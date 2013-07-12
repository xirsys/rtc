'use strict';

(function (exports) {
	var xrtc = exports.xRtc,
		internal = {},
		webrtc = xrtc.webrtc;

	xrtc.Class(internal, 'IceCandidateFilter', function IceCandidateFilter(type, is) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			connectionType = type || 'default',
			iceServers = is && is.iceServers || null,
			ipRegexp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;

		xrtc.Class.extend(this, {
			getType: function () {
				return connectionType;
			},

			isAllowed: function (ice) {
				var result = true;

				switch (connectionType) {
					case 'direct':
						result = iceCandidatesFilters.local(ice) || iceCandidatesFilters.stun(ice);
						break;
					case 'server':
						if (iceCandidatesFilters.stun(ice)) {
							iceCandidateConverters.stun2turn(ice);
						} else if (iceCandidatesFilters.turn(ice)) {
							iceCandidateConverters.turn2turn(ice);
						} else {
							result = false;
						}
						break;
					default:
						break;
				}

				return result;
			}
		});

		var iceCandidatesFilters = {
			local: function (iceCandidate) {
				var regexp = /typ host/;

				return filterIceCandidate(iceCandidate, regexp);
			},

			stun: function (iceCandidate) {
				var regexp = /typ srflx/;

				return filterIceCandidate(iceCandidate, regexp);
			},

			turn: function (iceCandidate) {
				var regexp = /typ relay/;

				return filterIceCandidate(iceCandidate, regexp);
			}
		};

		function filterIceCandidate(iceCandidate, regexp) {
			return regexp.test(iceCandidate.candidate);
		}

		function getTurnIp() {
			if (iceServers) {
				for (var i = 0; i < iceServers.length; i++) {
					var server = iceServers[i];
					if ('credential' in server) {
						return server.url.split('@')[1];
					}

				}
			}
			return null;
		}

		var iceCandidateConverters = {
			turn2turn: function (iceCandidate) {
				var candidate = iceCandidate.candidate;

				var matches = candidate.match(ipRegexp);
				iceCandidate.candidate = candidate.replace(ipRegexp, matches[0]);
			},

			stun2turn: function (iceCandidate) {
				var turnIp = getTurnIp();
				if (turnIp) {
					var candidate = iceCandidate.candidate;
					iceCandidate.candidate = candidate.replace(ipRegexp, turnIp);
				} else {
					//todo: is it right?
					iceCandidateConverters.turn2turn(iceCandidate);
				}
			}
		};
	});

	xrtc.Class(xrtc, 'Connection', function Connection(ud, am) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			userData = ud,
			authManager = am || new xRtc.AuthManager(),
			remoteParticipant = null,
			peerConnection = null,
			checkConnectionStateIntervalId = null,
			handshakeController = null,
			iceFilter = null,
			iceServers = null,
			// 'answer' is received or 'offer' received and accepted flag.
			// Is used to determine whether the coonection was accepted and need to send ice candidates to remote application.
			connectionEstablished = false,
			// It is tempoprary storage of ice candidates.
			// Ice candidates should be send to remote participant after receiving answer strictly.
			// If the application will send ice candidates after 'offer' sending then it can be skipped by remote application
			// because there is no guarantee of connection establishing and while the application/user will be thinking
			// about accept/decline incoming connection these ice candidates reach it and will be skipped,
			// because the remote peerConnection still not created.
			iceCandidates = [],
			connectionId = generateGuid(),
			remoteConnectionId = null;

		initHandshakeController.call(this);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			getId: function() {
				return connectionId;
			},

			open: function (participantId, options) {
				/// <summary>Starts the process of p2p connection establishment</summary>
				/// <param name="participantId" type="string">Name of remote participant</param>
				/// <param name="options" type="object">Optional param. Offer options and connection type</param>
				var self = this;

				if (!participantId) {
					throw new xrtc.CommonError('startSession', 'participantId should be specified');
				}

				var offerOptions = {};
				// offerOptions initialization
				xrtc.Class.extend(offerOptions, xrtc.Connection.settings.offerOptions);
				if (options && options.offer) {
					xrtc.Class.extend(offerOptions, options.offer);
				}

				initPeerConnection.call(this, participantId, function () {
					iceFilter = new internal.IceCandidateFilter(options && options.connectionType || null, iceServers);

					self.trigger(xrtc.Connection.events.offerCreating);

					peerConnection.createOffer(proxy(onCreateOfferSuccess), proxy(onCreateOfferError), offerOptions);

					function onCreateOfferSuccess(offer) {
						logger.debug('onCreateOfferSuccess', offer);
						peerConnection.setLocalDescription(offer);

						// Interoperability support of FF21 and Chrome
						if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion <= 21) {
							var inline = 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:FakeFakeFakeFakeFakeFakeFakeFakeFakeFake\r\nc=IN';
							offer.sdp = offer.sdp.indexOf('a=crypto') == -1 ? sdp.replace(/c=IN/g, inline) : offer.sdp;
						}

						var request = {
							offer: JSON.stringify(offer),
							connectionType: iceFilter.getType(),
							iceServers: iceServers
						};

						logger.debug('sendOffer', remoteParticipant, offer);
						handshakeController.sendOffer(remoteParticipant, connectionId, request);
						this.trigger(xrtc.Connection.events.offerSent, remoteParticipant, request);
					}

					function onCreateOfferError(err) {
						var error = new xrtc.CommonError('startSession', "Cannot create WebRTC offer", err);

						logger.error('sendOffer', error);
						this.trigger(xrtc.Connection.events.offerError, error);
					}
				});
			},

			close: function () {
				/// <summary>Ends p2p connection</summary>

				if (handshakeController && remoteParticipant && remoteConnectionId) {
					handshakeController.sendBye(remoteParticipant, remoteConnectionId);
				}

				closePeerConnection.call(this);
			},

			addStream: function (stream) {
				peerConnection.addStream(stream.getStream());

				var streamData = {
					stream: stream,
					participantId: userData.name
				};

				logger.debug('addStream', streamData);
				this.trigger(xrtc.Connection.events.streamAdded, streamData);
			},

			createDataChannel: function (name) {
				/// <summary>Creates new instance of DataChannel</summary>
				/// <param name="name" type="string">Name for DataChannel. Must be unique</param>
				var self = this;
				var dataChannel;

				try {
					var dc = peerConnection.createDataChannel(name, { reliable: false });
					dataChannel = new xrtc.DataChannel(dc, userData.name);
					// todo: need to check, maybe peerConnection.ondatachannel fires not only for offer receiver but and for offer sender user. If so then firing of this event should be removed here.
					self.trigger(xrtc.Connection.events.dataChannelCreated, { channel: dataChannel });
				} catch (ex) {
					var error = new xrtc.CommonError('createDataChannel', "Cannot create DataChannel", ex);
					logger.error('createDataChannel', error);
					throw error;
				}

				return dataChannel;
			},

			getState: function () {
				/// <summary>Returns the state of p2p connection</summary>

				return getSignalingState.call(this);
			},
		});

		function initHandshakeController() {
			handshakeController = new xrtc.HandshakeController();

			var hcEvents = xrtc.HandshakeController.events;
			handshakeController
				.on(hcEvents.receiveIce, proxy(onReceiveIce))
				.on(hcEvents.receiveOffer, proxy(onReceiveOffer))
				.on(hcEvents.receiveAnswer, proxy(onReceiveAnswer))
				.on(hcEvents.receiveBye, proxy(onReceiveBye));
		}

		function initPeerConnection(userId, callback) {
			remoteParticipant = userId;

			if (!peerConnection) {
				getIceServers.call(this, proxy(onIceServersGot));
			} else {
				callCallback();
			}

			//todo: need to think of this approach and refactor it
			function callCallback() {
				if (typeof callback === "function") {
					try {
						callback();
					} catch (e) {
						// todo: check or not check?
						// here is a server problem, sometimes it doesn't work from first time
						// error can occur 1-4 times in a row
					}
				}
			}

			function onIceServersGot(iceServers) {
				var self = this;

				var browserCompatibleIceServers;
				if (webrtc.detectedBrowser == webrtc.supportedBrowsers.firefox) {
					browserCompatibleIceServers = { iceServers: [] };
					for (var i = 0, len = iceServers.iceServers.length; i < len; i++) {
						var iceServer = iceServers.iceServers[i];
						// TURN doesn't supported by FireFox yet
						if (iceServer.url.indexOf("turn:") === -1) {
							browserCompatibleIceServers.iceServers.push(iceServer);
						}
					}
				} else {
					browserCompatibleIceServers = iceServers;
				}

				peerConnection = new webrtc.RTCPeerConnection(browserCompatibleIceServers, xrtc.Connection.settings.peerConnectionOptions);
				logger.info('initPeerConnection', 'PeerConnection created.');

				peerConnection.onicecandidate = proxy(onIceCandidate);

				peerConnection.onstatechange = // M25-M26
					peerConnection.onsignalingstatechange = // M27+
					proxy(onConnectionStateChange);

				// in FireFox onstatechange or alternative event does not fire properly
				if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
					var connectionState = this.getState();
					checkConnectionStateIntervalId = exports.setInterval(function () {
						var currentConnectionState = self.getState();
						if (currentConnectionState != connectionState) {
							connectionState = currentConnectionState;
							self.trigger(xrtc.Connection.events.stateChanged, connectionState);
						}
					}, 100);
				}

				peerConnection.onicechange = // M25-M26
					peerConnection.oniceconnectionstatechange = // M27+
					proxy(onIceStateChange);

				peerConnection.ondatachannel = function(data) {
					self.trigger(xrtc.Connection.events.dataChannelCreated, { channel: new xrtc.DataChannel(data.channel, userData.name) });
				};

				// It is called any time a MediaStream is added by the remote peer. This will be fired only as a result of setRemoteDescription.
				peerConnection.onaddstream = proxy(onAddStream);

				function onIceCandidate(evt) {
					if (!!evt.candidate) {
						// in the original RTCIceCandidate class 'candidate' property is immutable
						var ice = JSON.parse(JSON.stringify(evt.candidate));

						if (iceFilter.isAllowed(ice)) {
							handleIceCandidate.call(this, ice);
						}
					}
				}

				function onConnectionStateChange(evt) {
					this.trigger(xrtc.Connection.events.stateChanged, this.getState());
				}

				function onIceStateChange(evt) {
					var state = getIceState.call(this);

					if (state === 'connected') {
						this.trigger(xrtc.Connection.events.connectionEstablished, remoteParticipant);
					}
				}

				function onAddStream(evt) {
					addRemoteStream.call(this, evt.stream);
				}

				this.trigger(xrtc.Connection.events.initialized);

				callCallback();
			}
		}

		function handleIceCandidate(ice) {
			iceCandidates.push(ice);

			if (connectionEstablished) {
				sendIceCandidates.call(this);
			}
		}

		function allowIceSending() {
			connectionEstablished = true;

			// Send already generated ice candidates
			sendIceCandidates.call(this);
		}

		function sendIceCandidates() {
			for (var i = 0; i < iceCandidates.length; i++) {
				var ice = JSON.stringify(iceCandidates[i]);

				handshakeController.sendIce(remoteParticipant, ice);
				this.trigger(xrtc.Connection.events.iceSent, ice);
			}

			iceCandidates = [];
		}

		function addRemoteStream(stream) {
			var streamData = {
				stream: new xrtc.Stream(stream),
				participantId: remoteParticipant
			};

			logger.debug('addRemoteStream', streamData);
			this.trigger(xrtc.Connection.events.streamAdded, streamData);
		}

		function getIceServers(callback) {
			if (typeof callback === "function") {
				if (iceServers) {
					callback(iceServers);
				} else {
					authManager.getToken(userData, function (token) {
						authManager.getIceServers(token, userData, function (servers) {
							iceServers = servers;
							callback(iceServers);
						});
					});
				}
			}
		}

		function onReceiveIce(iceData) {
			//todo: Need to check iceData parameter to the right format (existence of right fields, no errors in JSON.parse function). Will be good to verify this behavior using unit tests.

			// Skip ice candidates, if it does not come from the application that 'offer' was received (not from your current companion)
			// or no 'offer' had been received or sent yet (peerConnection was not created)
			if (iceData.senderId != remoteParticipant || !peerConnection) {
				return;
			}

			logger.debug('receiveIce', iceData);
			var iceCandidate = new webrtc.RTCIceCandidate(JSON.parse(iceData.iceCandidate));
			peerConnection.addIceCandidate(iceCandidate);

			this.trigger(xrtc.Connection.events.iceAdded, iceData, iceCandidate);
		}

		function onReceiveOffer(offerData) {
			var self = this;

			//todo: Need to check offerData parameter to the right format (existence of right fields, no errors in JSON.parse function). Will be good to verify this behavior using unit tests.

			// Skip 'offer' if it is not for me. It is temporary fix, because handshake shouldn't pass the 'offer' to wrong target.
			// Sometimes it happened that the server had sent the 'offer' to all/wrong participants. So we decided not touch this check.
			if (offerData.receiverId != userData.name) {
				return;
			}

			var data = {
				participantName: offerData.senderId,
				connectionType: offerData.connectionType
			};

			// todo: move this logic to the Room object
			// begin
			if (!connectionOptions.autoReply) {
				data.accept = proxy(onAcceptCall);
				data.decline = proxy(onDeclineCall);
			}

			this.trigger(xrtc.Connection.events.incomingCall, data);

			if (connectionOptions.autoReply) {
				onAcceptCall.call(self);
			}

			function onAcceptCall() {
				//End the current active call, if any
				//this.endSession();

				remoteConnectionId = offerData.connectionId;
				iceServers = offerData.iceServers;

				initPeerConnection.call(this, offerData.senderId, function () {
					logger.debug('receiveOffer', offerData);
					iceFilter = new internal.IceCandidateFilter(offerData.connectionType, iceServers);

					// data channels doesn't work in case of interoperability Chrome and FireFox
					/*if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion <= 21) {
						offerData.offer = offerData.offer.substr(0, offerData.offer.indexOf("a=mid:data"));
					}*/

					var sdp = JSON.parse(offerData.offer);

					var remoteSessionDescription = new webrtc.RTCSessionDescription(sdp);
					peerConnection.setRemoteDescription(remoteSessionDescription);

					peerConnection.createAnswer(proxy(onCreateAnswerSuccess), proxy(onCreateAnswerError), xrtc.Connection.settings.answerOptions);

					function onCreateAnswerSuccess(answer) {
						peerConnection.setLocalDescription(answer);

						var request = {
							answer: JSON.stringify(answer)
						};

						logger.debug('sendAnswer', offerData, answer);
						handshakeController.sendAnswer(offerData.senderId, remoteConnectionId, request);

						this.trigger(xrtc.Connection.events.answerSent, offerData, answer);

						allowIceSending.call(this);
					}

					function onCreateAnswerError(err) {
						var error = new xrtc.CommonError('sendAnswer', "Cannot create WebRTC answer", err);

						logger.error('sendAnswer', error);
						this.trigger(xrtc.Connection.events.answerError, error);
					}
				});
			}

			function onDeclineCall() {
				handshakeController.sendBye(offerData.senderId, remoteConnectionId, { type: 'decline' });
			}
			// end
		}

		function onReceiveAnswer(answerData) {
			//todo: Need to check answerData parameter to the right format (existence of right fields, no errors in JSON.parse function). Will be good to verify this behavior using unit tests.

			// Skip 'answer', if it does not come from the application to which the 'offer' was sent to (to current companion)
			// or no 'offer' had been received or sent yet (peerConnection was not created)
			if (answerData.senderId != remoteParticipant || !peerConnection) {
				return;
			}

			allowIceSending.call(this);

			logger.debug('receiveAnswer', answerData);
			var sdp = JSON.parse(answerData.answer);

			var sessionDescription = new webrtc.RTCSessionDescription(sdp);
			peerConnection.setRemoteDescription(sessionDescription);
			this.trigger(xrtc.Connection.events.answerReceived, answerData, sessionDescription);
		}

		function onReceiveBye(response) {
			if (response.senderId != remoteParticipant || !peerConnection) {
				return;
			}

			closePeerConnection.call(this, response.type || 'close');
		}

		function closePeerConnection(type) {
			var self = this;

			if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && checkConnectionStateIntervalId) {
				exports.clearInterval(checkConnectionStateIntervalId);
				checkConnectionStateIntervalId = null;
			}

			if (peerConnection) {
				peerConnection.onicecandidate = null;
				peerConnection.close();
				peerConnection = null;
				iceCandidates = [];
				iceServers = null;
				connectionEstablished = false;

				remoteParticipant = null;

				var connectionData = {
					sender: self,
					closedParticipant: remoteParticipant
				};

				switch (type) {
					case 'decline':
						this.trigger(xrtc.Connection.events.offerDeclined, connectionData);
						break;
					case 'close':
					default:
						this.trigger(xrtc.Connection.events.connectionClosed, connectionData);
						break;
				}
			}
		}

		function getIceState() {
			var state = peerConnection
							&& (peerConnection.iceConnectionState // M26+
							|| peerConnection.iceState) // M25
						|| 'notinitialized';

			return state;
		}

		function getSignalingState() {
			// it can change from version to version
			var isLocalStreamAdded = peerConnection.getLocalStreams().length > 0,
				states = {
					//todo: why not-ready if local stream is not added? What about situation when only text chat will be used?
					'notinitialized': isLocalStreamAdded ? 'ready' : 'not-ready',

					// Chrome M25
					//todo: why not-ready if local stream is not added? What about situation when only text chat will be used?
					'new': isLocalStreamAdded ? 'ready' : 'not-ready',
					'opening': 'connecting',
					'active': 'connected',
					'closing': 'disconnecting',
					//todo: why not-ready if local stream is not added? What about situation when only text chat will be used?
					'closed': isLocalStreamAdded ? 'ready' : 'not-ready',

					// Chrome M26+
					'stable': 'connected',
					'have-local-offer': 'ready',
					'have-remote-offer': 'connecting'
				},
				state = peerConnection
						&& (peerConnection.signalingState // M26+
						|| peerConnection.readyState) // M25-M26
					|| 'notinitialized';

			return states[state];
		}

		function generateGuid() {
			var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
			return guid;
		};
	});

	xrtc.Connection.extend({
		events: {
			streamAdded: 'streamadded',

			iceAdded: 'iceadded',
			iceSent: 'icesent',

			offerCreating: 'offercreating',
			offerSent: 'offersent',
			offerError: 'offererror',

			answerSent: 'answersent',
			answerReceived: 'answerreceived',
			answerError: 'answererror',

			dataChannelCreated: 'datachannelcreated',
			dataChannelCreationError: 'datachannelcreationerror',

			connectionEstablished: 'connectionestablished',
			connectionClosed: 'connectionclosed',

			initialized: 'initialized',
			stateChanged: 'statechanged',

			incomingCall: 'incomingcall',
			offerDeclined: 'offerdeclined'
		},

		settings: {
			offerOptions: {
				optional: [],
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true
				}
			},

			answerOptions: {
				optional: [],
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true
				}
			},

			// Interop Notes between Chrome M25 and Firefox Nightly (version 21):
			// Chrome does not yet do DTLS-SRTP by default whereas Firefox only does DTLS-SRTP. In order to get interop,
			// you must supply Chrome with a PC constructor constraint to enable DTLS: { 'optional': [{'DtlsSrtpKeyAgreement': 'true'}]}
			peerConnectionOptions: {
				optional: [{ RtpDataChannels: true }, { DtlsSrtpKeyAgreement: true }]
			}
		}
	});

	// Cross-browser support: New syntax of getXXXStreams method in Chrome M26.
	if (/* For FireFox 22 webrtc.RTCPeerConnection.prototype is undefined */webrtc.RTCPeerConnection.prototype && !webrtc.RTCPeerConnection.prototype.getLocalStreams) {
		xrtc.Class.extend(webrtc.RTCPeerConnection.prototype, {
			getLocalStreams: function () {
				return this.localStreams;
			},

			getRemoteStreams: function () {
				return this.remoteStreams;
			}
		});
	}

	//Cross-browser support: New syntax of getXXXTracks method in Chrome M26.
	if (!webrtc.MediaStream.prototype.getVideoTracks) {
		if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
			xrtc.Class.extend(webrtc.MediaStream.prototype, {
				getVideoTracks: function () {
					return [];
				},

				getAudioTracks: function () {
					return [];
				}
			});
		} else {
			xrtc.Class.extend(webrtc.MediaStream.prototype, {
				getVideoTracks: function () {
					return this.videoTracks;
				},

				getAudioTracks: function () {
					return this.audioTracks;
				}
			});
		}
	}

	// todo: no need to disable data channels in case of communication between FireFox and Firefox. These flags are necessary in case of interoperability between FireFox and Chrome only
	// Data channels does't supported in case of interoperability of FireFox and Chrome
	if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
		// Chrome M26b and Chrome Canary with this settings fires an erron on the creation of offer/answer, but it is necessary for interoperablity between FF and Chrome
		xrtc.Connection.settings.offerOptions.mandatory.MozDontOfferDataChannel = true;
		xrtc.Connection.settings.answerOptions.mandatory.MozDontOfferDataChannel = true;
	}
})(window);