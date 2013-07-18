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

	// todo: need to optimize the constructor sugnature of Connection object
	xrtc.Class(xrtc, 'Connection', function Connection(ud, targetId, hc, am, data) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			// need to think about necessity of this property. Maybe will be better to store function which returns this data.
			userData = ud,
			authManager = am || new xRtc.AuthManager(),
			remoteUserId = targetId,
			remoteConnectionId = null,
			localStreams = [],
			dataChannels = [],
			peerConnection = null,
			checkConnectionStateIntervalId = null,
			handshakeController = hc,
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
			// User data conainer. The data helps to identify the connection and differ the connection from other connections
			connectionData = data;

		subscribeToHandshakeControllerEvents.call(this);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			getId: function () {
				return connectionId;
			},

			open: function (options) {
				var self = this,
					offerOptions = {};

				// offerOptions initialization
				xrtc.Class.extend(offerOptions, xrtc.Connection.settings.offerOptions);
				if (options && options.offer) {
					xrtc.Class.extend(offerOptions, options.offer);
				}

				self.trigger(xrtc.Connection.events.connectionOpening, { sender: self, userId: remoteUserId });

				initPeerConnection.call(self, remoteUserId, function () {
					iceFilter = new internal.IceCandidateFilter(options && options.connectionType || null, iceServers);

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
							connectionData: connectionData,
							connectionType: iceFilter.getType(),
							iceServers: iceServers
						};

						logger.debug('sendOffer', remoteUserId, offer);
						handshakeController.sendOffer(remoteUserId, remoteConnectionId, connectionId, request);
						self.trigger(xrtc.Connection.events.offerSent, { userId: remoteUserId, offerData: request });
					}

					function onCreateOfferError(err) {
						var error = new xrtc.CommonError('startSession', "Cannot create WebRTC offer", err);

						logger.error('onCreateOfferError', error);
						self.trigger(xrtc.Connection.events.createOfferError, error);
					}
				});
			},

			close: function () {
				/// <summary>Ends p2p connection</summary>

				if (handshakeController && remoteUserId && remoteConnectionId) {
					handshakeController.sendBye(remoteUserId, remoteConnectionId, connectionId);
				}

				closePeerConnection.call(this);
			},

			addStream: function (xrtcStream) {
				var stream = xrtcStream.getStream();
				localStreams.push(stream);

				var streamData = {
					stream: xrtcStream,
					userId: userData.name
				};

				logger.debug('addLocalStream', streamData);
				this.trigger(xrtc.Connection.events.localStreamAdded, streamData);
			},

			createDataChannel: function (name) {
				dataChannels.push(name);
			},

			getData: function () {
				/// <summary>Data is initialized during the opening of the connection. The data helps to identify the connection and differ the connection from other connections</summary>
				return connectionData;
			},

			getState: function () {
				/// <summary>Returns the state of p2p connection</summary>

				return getSignalingState.call(this);
			},
		});

		function subscribeToHandshakeControllerEvents() {
			var hcEvents = xrtc.HandshakeController.events;
			handshakeController
				.on(hcEvents.receiveIce, proxy(onReceiveIce))
				.on(hcEvents.receiveOffer, proxy(onReceiveOffer))
				.on(hcEvents.receiveAnswer, proxy(onReceiveAnswer))
				.on(hcEvents.receiveBye, proxy(onReceiveBye));
		}

		function initPeerConnection(userId, callback) {
			remoteUserId = userId;

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

			function onIceServersGot(iceServersData) {
				var self = this;

				var browserCompatibleIceServers;
				if (webrtc.detectedBrowser == webrtc.supportedBrowsers.firefox) {
					browserCompatibleIceServers = { iceServers: [] };
					for (var i = 0, len = iceServersData.iceServers.length; i < len; i++) {
						var iceServer = iceServersData.iceServers[i];
						// TURN doesn't supported by FireFox yet
						if (iceServer.url.indexOf("turn:") === -1) {
							browserCompatibleIceServers.iceServers.push(iceServer);
						}
					}
				} else {
					browserCompatibleIceServers = iceServersData;
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

				// todo: need to think about the necessity of this handlers
				peerConnection.onicechange = // M25-M26
					peerConnection.oniceconnectionstatechange = // M27+
					proxy(onIceStateChange);

				peerConnection.ondatachannel = function (data) {
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
						// todo: Need to think about name of this event
						this.trigger(xrtc.Connection.events.connectionEstablished, { userId: remoteUserId });
					}
				}

				function onAddStream(evt) {
					addRemoteStream.call(this, evt.stream);
				}

				// add streams to native webrtc peerConnection which were added before
				for (var i = 0, len = localStreams.length; i < len; i++) {
					peerConnection.addStream(localStreams[i]);
				}

				// create data channnels which were created(registered for creation) before
				for (var i = 0, len = dataChannels.length; i < len; i++) {
					createDataChannel.call(this, dataChannels[i]);
				}

				callCallback();
			}
		}

		function createDataChannel(name) {
			/// <summary>Creates new instance of DataChannel</summary>
			/// <param name="name" type="string">Name for DataChannel. Must be unique</param>
			var self = this;
			try {
				// reliable channel is analogous to a TCP socket and unreliable channel is analogous to a UDP socket.
				// reliable data channels currently supports only by FF. It is default value.
				// in chrome reliable channels doesn't implemented yet: https://code.google.com/p/webrtc/issues/detail?id=1430
				var dc = peerConnection.createDataChannel(name, { reliable: false });
				// todo: need to check, maybe peerConnection.ondatachannel fires not only for offer receiver but and for offer sender user. If so then firing of this event should be removed here.
				self.trigger(xrtc.Connection.events.dataChannelCreated, { channel: new xrtc.DataChannel(dc, userData.name) });
			} catch (ex) {
				var error = new xrtc.CommonError('createDataChannel', "Cannot create DataChannel", ex);
				logger.error('createDataChannel', error);
				self.trigger(xrtc.Connection.events.dataChannelCreationError, { channelName: name, error: error });
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
				var iceCandidate = iceCandidates[i];

				handshakeController.sendIce(remoteUserId, remoteConnectionId, connectionId, JSON.stringify(iceCandidate));
				this.trigger(xrtc.Connection.events.iceSent, { iceCandidate: iceCandidate });
			}

			iceCandidates = [];
		}

		function addRemoteStream(stream) {
			var streamData = {
				stream: new xrtc.Stream(stream),
				userId: remoteUserId
			};

			logger.debug('addRemoteStream', streamData);
			this.trigger(xrtc.Connection.events.remoteStreamAdded, streamData);
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
			logger.debug('Ice candidate was received.', iceData);
			var iceCandidate = new webrtc.RTCIceCandidate(JSON.parse(iceData.iceCandidate));
			peerConnection.addIceCandidate(iceCandidate);

			this.trigger(xrtc.Connection.events.iceAdded, { iceCandidate: iceCandidate });
		}

		function onReceiveOffer(offerData) {
			logger.debug('Offer was received.', offerData);

			iceServers = offerData.iceServers;
			remoteConnectionId = offerData.connectionId;

			initPeerConnection.call(this, remoteUserId, function () {
				logger.debug('receiveOffer', offerData);
				iceFilter = new internal.IceCandidateFilter(offerData.connectionType, iceServers);

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
					handshakeController.sendAnswer(remoteUserId, remoteConnectionId, connectionId, request);

					this.trigger(xrtc.Connection.events.answerSent, { userId: remoteUserId, answerData: request });

					allowIceSending.call(this);
				}

				function onCreateAnswerError(err) {
					var error = new xrtc.CommonError('sendAnswer', "Cannot create WebRTC answer", err);

					logger.error('sendAnswer', error);
					this.trigger(xrtc.Connection.events.createAnswerError, error);
				}
			});
		}

		function onReceiveAnswer(answerData) {
			logger.debug('Answer was received.', answerData);

			remoteConnectionId = answerData.connectionId;

			allowIceSending.call(this);

			var sdp = JSON.parse(answerData.answer);
			var sessionDescription = new webrtc.RTCSessionDescription(sdp);
			peerConnection.setRemoteDescription(sessionDescription);
			this.trigger(xrtc.Connection.events.answerReceived, { userId: remoteConnectionId, answerData: { answer: sessionDescription } });
		}

		function onReceiveBye() {
			closePeerConnection.call(this);
		}

		function closePeerConnection() {
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

				var connectionData = {
					sender: self,
					userId: remoteUserId
				};

				remoteUserId = null;

				this.trigger(xrtc.Connection.events.connectionClosed, connectionData);
			}
		}

		function getIceState() {
			var state = peerConnection
							&& (peerConnection.iceConnectionState // M26+
							|| peerConnection.iceState) // M25
						|| 'notinitialized';

			return state;
		}

		// todo: need to think about available states
		function getSignalingState() {
			// it can change from version to version
			var isLocalStreamAdded = localStreams.length > 0,
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

		// todo: need to move this method to xrtc.utils
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
			localStreamAdded: 'localstreamadded',
			remoteStreamAdded: 'remotestreamadded',

			iceAdded: 'iceadded',
			iceSent: 'icesent',

			offerSent: 'offersent',
			createOfferError: 'createoffererror',

			answerSent: 'answersent',
			answerReceived: 'answerreceived',
			createAnswerError: 'createanswererror',

			dataChannelCreated: 'datachanneladded',
			dataChannelCreationError: 'datachannelcreationerror',

			connectionOpening: 'connectionopening',
			connectionEstablished: 'connectionestablished',
			connectionClosed: 'connectionclosed',

			stateChanged: 'statechanged'
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