'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	var internal = {},
		webrtc;

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
			authManager = am,
			remoteParticipant = null,
			localStreams = [],
			peerConnection = null,
			handshakeController = null,
			iceFilter = null,
			iceServers = null,

			// 'answer' is received or 'offer' received and accepted flag.
			// Is used to determine whether the coonection was accepted and need to send ice candidates to remote application.
			connectionEstablished = false,

			// It is tempoprary storage of ice candidates.
			// Ice candidates should be send to remote participant after receiving answer strictly.
			// If the application will send ice candidates after 'offer' sending then it can be skiped by remote appication
			// because there is no guarantee of connection establishing and while the application/user will be thinking
			// about accept/decline incoming connection these ice candidates reach it and will be skipped,
			// because the remote peerConnection still not created.
			iceCandidates = [];

		initHandshakeController.call(this);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			startSession: function (participantId, options) {
				/// <summary>Starts the process of p2p connection establishment</summary>
				/// <param name="participantId" type="string">Name of remote participant</param>
				/// <param name="options" type="object">Optional param. Offer options and connection type</param>

				if (!participantId) {
					throw new xrtc.CommonError('startSession', 'participantId should be specified');
				}

				var opts = options && options.offer || {},
					offerOptions = {};

				xrtc.Class.extend(offerOptions, xrtc.Connection.settings.offerOptions, opts);

				initPeerConnection.call(this, participantId, function () {
					iceFilter = new internal.IceCandidateFilter(options && options.connectionType || null, iceServers);
					peerConnection.createOffer(proxy(onCreateOfferSuccess), proxy(onCreateOfferError), offerOptions);

					function onCreateOfferSuccess(offer) {
						peerConnection.setLocalDescription(offer);

						//Cross-browser support: FF v.21 fix
						// todo:remove it in next versions
						if (webrtc.isFirefox) {
							offer.sdp = offer.sdp + 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
						}
						// todo:remove it in next versions

						var request = {
							offer: JSON.stringify(offer),
							connectionType: iceFilter.getType(),
							iceServers: iceServers
						};

						logger.debug('sendOffer', remoteParticipant, offer);
						handshakeController.sendOffer(remoteParticipant, request);
						this.trigger(xrtc.Connection.events.offerSent, remoteParticipant, request);
					}

					function onCreateOfferError(err) {
						var error = new xrtc.CommonError('startSession', "Cannot create WebRTC offer", err);

						logger.error('sendOffer', error);
						this.trigger(xrtc.Connection.events.offerError, error);
					}
				});
			},

			endSession: function () {
				/// <summary>Ends p2p connection</summary>

				if (handshakeController && remoteParticipant) {
					handshakeController.sendBye(remoteParticipant);
				}

				closePeerConnection.call(this);
			},

			addMedia: function (options) {
				/// <summary>Asks user to allow use local devices, e.g. camera and microphone</summary>
				/// <param name="options" type="object">Optional param. Local media options</param>

				var mediaOptions = options || { video: true, audio: true };
				if (mediaOptions.video && mediaOptions.video.mandatory && mediaOptions.video.mandatory.mediaSource === "screen" && mediaOptions.audio) {
					getUserMedia.call(this, { video: { mandatory: { chromeMediaSource: "screen" } } }, function (screenSharingStream) {
						getUserMedia.call(this, { audio: true }, function (audioStream) {

							function addTracks(array, tracks) {
								for (var i = 0; i < tracks.length; i++) {
									array.push(tracks[i]);
								}
							}

							var mediaStreamTracks = [];
							addTracks(mediaStreamTracks, audioStream.getAudioTracks());
							addTracks(mediaStreamTracks, screenSharingStream.getVideoTracks());

							addLocalStream.call(this, new webrtc.MediaStream(mediaStreamTracks));
						});
					});
				} else {
					getUserMedia.call(this, mediaOptions, function (stream) {
						addLocalStream.call(this, stream);
					});
				}
			},

			createDataChannel: function (name) {
				/// <summary>Creates new instance of DataChannel</summary>
				/// <param name="name" type="string">Name for DataChannel. Must be unique</param>

				var dataChannel = null;

				try {
					dataChannel = new xrtc.DataChannel(peerConnection.createDataChannel(name, { reliable: false }), userData.name);
				} catch (ex) {
					var error = new xrtc.CommonError('createDataChannel', "Cannot create DataChannel", ex);

					logger.error('createDataChannel', error);
					throw error;
				}

				return dataChannel;
			},

			getHandshake: function () {
				/// <summary>Returns HandshakeController</summary>

				return handshakeController;
			},

			getRemoteParticipantName: function () {
				/// <summary>Returns current remote participant name</summary>

				return remoteParticipant;
			},

			getState: function () {
				/// <summary>Returns the state of p2p connection</summary>

				return getSignalingState.call(this);
			}
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
				peerConnection = new webrtc.RTCPeerConnection(iceServers, xrtc.Connection.settings.peerConnectionOptions);
				logger.info('initPeerConnection', 'PeerConnection created.');

				peerConnection.onicecandidate = proxy(onIceCandidate);

				peerConnection.onstatechange = // M25-M26
					peerConnection.onsignalingstatechange = // M27+
					proxy(onConnectionStateChange);

				peerConnection.onicechange = // M25-M26
					peerConnection.oniceconnectionstatechange = // M27+
					proxy(onIceStateChange);

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
					addRemoteSteam.call(this, evt.stream);
				}

				for (var i = 0, len = localStreams.length; i < len; i++) {
					peerConnection.addStream(localStreams[i]);
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

		function getUserMedia(options, callback) {
			webrtc.getUserMedia(options, proxy(onGetUserMediaSuccess), proxy(onGetUserMediaError));

			function onGetUserMediaSuccess(stream) {
				if (typeof callback === "function") {
					callback.call(this, stream);
				}
			}

			function onGetUserMediaError(err) {
				var error = new xrtc.CommonError('addMedia', "Cannot get UserMedia", err);
				error.options = options;

				logger.error('addMedia', error);
				this.trigger(xrtc.Connection.events.streamError, error);
			}
		}

		function addLocalStream(stream) {
			localStreams.push(stream);

			var streamData = {
				stream: new xrtc.Stream(stream),
				participantId: userData.name
			};

			logger.debug('addLocalStream', streamData);
			this.trigger(xrtc.Connection.events.streamAdded, streamData);
		}

		function addRemoteSteam(stream) {
			var streamData = {
				stream: new xrtc.Stream(stream),
				participantId: remoteParticipant
			};

			logger.debug('addRemoteSteam', streamData);
			this.trigger(xrtc.Connection.events.streamAdded, streamData);
		}

		function getIceServers(callback) {
			if (typeof callback === "function") {
				if (iceServers) {
					callback(iceServers);
				} else {
					authManager.getToken(userData, function (token) {
						authManager.getIceServers(token, function (servers) {
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
			//todo: Need to check offerData parameter to the right format (existence of right fields, no errors in JSON.parse function). Will be good to verify this behavior using unit tests.

			// Skip 'offer' if it is not for me. It is temporary fix, because handshake shouldn't pass the 'offer' to wrong target.
			// Sometimes it happened that the server had sent the 'offer' to all/wrong participants. So we decided not touch this check.
			if (offerData.receiverId != userData.name) {
				return;
			}

			var data = {
				participantName: offerData.senderId,
				accept: proxy(onAcceptCall),
				decline: proxy(onDeclineCall)
			};

			this.trigger(xrtc.Connection.events.incomingCall, data);

			function onAcceptCall() {
				//End the current active call, if any
				this.endSession();

				iceServers = offerData.iceServers;

				initPeerConnection.call(this, offerData.senderId, function () {
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
						handshakeController.sendAnswer(offerData.senderId, request);

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
				handshakeController.sendBye(offerData.senderId, { type: 'decline' });
			}
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
			if (peerConnection) {
				peerConnection.onicecandidate = null;
				peerConnection.close();
				peerConnection = null;
				iceCandidates = [];
				iceServers = null;
				connectionEstablished = false;

				var closedParticipant = remoteParticipant;
				remoteParticipant = null;

				switch (type) {
					case 'decline':
						this.trigger(xrtc.Connection.events.offerDeclined, closedParticipant);
						break;
					case 'close':
					default:
						this.trigger(xrtc.Connection.events.connectionClosed, closedParticipant);
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
	});

	xrtc.Connection.extend({
		events: {
			streamAdded: 'streamadded',
			streamError: 'streamerror',

			iceAdded: 'iceadded',
			iceSent: 'icesent',

			offerSent: 'offersent',
			offerError: 'offererror',

			answerSent: 'answersent',
			answerReceived: 'answerreceived',
			answerError: 'answererror',

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
		},

		webrtc: {
			getUserMedia: (navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.getUserMedia).bind(navigator),
			RTCPeerConnection: exports.mozRTCPeerConnection || exports.webkitRTCPeerConnection || exports.RTCPeerConnection,
			RTCIceCandidate: exports.mozRTCIceCandidate || exports.RTCIceCandidate,
			RTCSessionDescription: exports.mozRTCSessionDescription || exports.RTCSessionDescription,
			URL: exports.webkitURL || exports.msURL || exports.oURL || exports.URL,
			MediaStream: exports.mozMediaStream || exports.webkitMediaStream || exports.MediaStream,
			isFirefox: !!navigator.mozGetUserMedia
		}
	});

	webrtc = xrtc.Connection.webrtc;

	//Cross-browser support: New syntax of getXXXStreams method in Chrome M26.
	if (!webrtc.RTCPeerConnection.prototype.getLocalStreams) {
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
		if (webrtc.isFirefox) {
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

	//Cross-browser support
	if (webrtc.isFirefox) {
		// Chrome M26b and Chrome Canary with this settings fires an erron on the creation of offer/answer, but it is necessary for FF
		xrtc.Connection.settings.offerOptions.mandatory.MozDontOfferDataChannel = true;
		xrtc.Connection.settings.answerOptions.mandatory.MozDontOfferDataChannel = true;
	}
})(window);