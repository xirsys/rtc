'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	//todo: add ability to check WebRTC support. think of it!
	var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.getUserMedia,
		RTCPeerConnection = exports.mozRTCPeerConnection || exports.webkitRTCPeerConnection || exports.RTCPeerConnection,
		RTCIceCandidate = exports.mozRTCIceCandidate || exports.RTCIceCandidate,
		RTCSessionDescription = exports.mozRTCSessionDescription || exports.RTCSessionDescription,
		MediaStream = exports.mozMediaStream || exports.webkitMediaStream || exports.MediaStream,
		isFirefox = !!navigator.mozGetUserMedia;

	getUserMedia = getUserMedia.bind(navigator);

	if (!MediaStream.prototype.getVideoTracks) {
		if (isFirefox) {
			xrtc.Class.extend(MediaStream.prototype, {
				getVideoTracks: function () {
					return [];
				},

				getAudioTracks: function () {
					return [];
				}
			});
		} else {
			xrtc.Class.extend(MediaStream.prototype, {
				getVideoTracks: function () {
					return this.videoTracks;
				},

				getAudioTracks: function () {
					return this.audioTracks;
				}
			});
		}
	}

	// New syntax of getXXXStreams method in M26.
	if (!RTCPeerConnection.prototype.getLocalStreams) {
		xrtc.Class.extend(RTCPeerConnection.prototype, {
			getLocalStreams: function () {
				return this.localStreams;
			},

			getRemoteStreams: function () {
				return this.remoteStreams;
			}
		});
	}

	xrtc.Class2(xrtc, 'Connection', function Connection(ud, am) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			userData = ud,
			authManager = am,
			remoteParticipant = null,
			localStreams = [],
			peerConnection = null,
			handshakeController = null;

		initHandshakeController.call(this);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			startSession: function (participantId, options) {
				/// <summary>Starts the process of p2p connection establishment</summary>
				/// <param name="participantId" type="string">Name of remote participant</param>
				/// <param name="options" type="object">Optional param. Offer options</param>

				if (!participantId) {
					throw new xrtc.CommonError('startSession', 'participantId should be specified');
				}

				var opts = {};
				xrtc.Class.extend(opts, xrtc.Connection.settings.offerOptions, options || {});

				initPeerConnection.call(this, participantId, function () {
					peerConnection.createOffer(proxy(onCreateOfferSuccess), proxy(onCreateOfferError), opts);

					function onCreateOfferSuccess(offer) {
						peerConnection.setLocalDescription(offer);

						// todo:remove it in next versions
						if (isFirefox) {
							offer.sdp = offer.sdp + 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
						}
						// todo:remove it in next versions

						logger.debug('sendOffer', remoteParticipant, offer);
						handshakeController.sendOffer(remoteParticipant, JSON.stringify(offer));

						this.trigger(xrtc.Connection.events.offerSent, remoteParticipant, offer);
					}

					function onCreateOfferError(err) {
						var error = new xrtc.CommonError('startSession', "Can't create WebRTC offer", err);

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

				var opts = {};
				xrtc.Class.extend(opts, xrtc.Connection.settings.mediaOptions, options || {});

				getUserMedia(opts, proxy(onGetUserMediaSuccess), proxy(onGetUserMediaError));

				function onGetUserMediaSuccess(stream) {
					localStreams.push(stream);

					var xrtcStream = new xrtc.Stream(stream, userData.name);

					logger.debug('addMedia', xrtcStream);
					this.trigger(xrtc.Connection.events.streamAdded, xrtcStream);
				}

				function onGetUserMediaError(err) {
					var error = new xrtc.CommonError('addMedia', "Can't get UserMedia", err);

					logger.error('addMedia', error);
					this.trigger(xrtc.Connection.events.streamError, error);
				}
			},

			createDataChannel: function (name) {
				/// <summary>Creates new instance of DataChannel</summary>
				/// <param name="name" type="string">Name for DataChannel. Must be unique</param>

				var dataChannel = null;

				try {
					dataChannel = new xrtc.DataChannel(peerConnection.createDataChannel(name, { reliable: false }), userData.name);
				} catch (ex) {
					var error = new xrtc.CommonError('createDataChannel', "Can't create DataChannel", ex);
					this.trigger(xrtc.Connection.events.dataChannelCreationError, error);
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

				// it can change from version to version
				var isLocalStreamAdded = localStreams.length > 0,
					states = {
						'notinitialized': isLocalStreamAdded ? 'ready' : 'not-ready',

						// Chrome M25
						'new': isLocalStreamAdded ? 'ready' : 'not-ready',
						'opening': 'connecting',
						'active': 'connected',
						'closing': 'disconnecting',
						'closed': isLocalStreamAdded ? 'ready' : 'not-ready',

						// Chrome M26+
						'stable': 'connected',
						'have-local-offer': 'ready',
						'have-remote-offer': 'connecting'
					},

					state = peerConnection ? peerConnection.readyState : 'notinitialized';

				return states[state];
			}
		});

		function initHandshakeController() {
			handshakeController = new xrtc.HandshakeController();

			handshakeController
				.on(xrtc.HandshakeController.events.receiveIce, proxy(onReceiveIce))
				.on(xrtc.HandshakeController.events.receiveOffer, proxy(onReceiveOffer))
				.on(xrtc.HandshakeController.events.receiveAnswer, proxy(onReceiveAnswer))
				.on(xrtc.HandshakeController.events.receiveBye, proxy(onReceiveBye));
		}

		function initPeerConnection(userId, callback) {
			remoteParticipant = userId;

			if (!peerConnection) {
				getIceServers.call(this, proxy(onIceServersCandidate));
			} else {
				callCallback();
			}

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

			function onIceServersCandidate(token, iceServers) {
				peerConnection = new RTCPeerConnection(iceServers, xrtc.Connection.settings.peerConnectionOptions);
				logger.info('initPeerConnection', 'PeerConnection created.');

				peerConnection.onicecandidate = proxy(onIceCandidate);
				peerConnection.onstatechange = proxy(onStateChange);
				peerConnection.onopen = proxy(onOpen);

				function onIceCandidate(evt) {
					if (!!evt.candidate) {
						handshakeController.sendIce(remoteParticipant, JSON.stringify(evt.candidate));
						this.trigger(xrtc.Connection.events.iceSent, { event: evt });
					}
				}

				function onStateChange(evt) {
					this.trigger(xrtc.Connection.events.stateChanged, this.getState());
				}

				function onOpen(evt) {
					this.trigger(xrtc.Connection.events.connectionEstablished, this.remoteParticipant);
				}

				for (var i = 0, len = localStreams.length; i < len; i++) {
					peerConnection.addStream(localStreams[i]);
				}

				this.trigger(xrtc.Connection.events.initialized);

				callCallback();
			}
		}

		function addRemoteSteam() {
			var streams = peerConnection.getRemoteStreams();

			if (streams.length > 0) {
				this.trigger(xrtc.Connection.events.streamAdded, new xrtc.Stream(streams[0], remoteParticipant));
			} else {
				// will make pause if there is not any remote streams
				setTimeout(proxy(addRemoteSteam), 100);
			}
		}

		function getIceServers(callback) {
			authManager.getToken(userData, function (token) {
				authManager.getIceServers(token, function (iceServers) {
					if (typeof callback === "function") {
						callback(token, iceServers);
					}
				});
			});
		}

		function onReceiveIce(response) {
			if (response.senderId != remoteParticipant || !peerConnection) {
				return;
			}

			logger.debug('receiveIce', response);

			var iceCandidate = new RTCIceCandidate(JSON.parse(response.iceCandidate));
			peerConnection.addIceCandidate(iceCandidate);

			this.trigger(xrtc.Connection.events.iceAdded, response, iceCandidate);
		}

		function onReceiveOffer(response) {
			if (response.receiverId != userData.name) {
				return;
			}

			var data = {
				participantName: response.senderId,
				accept: proxy(onAcceptCall),
				decline: proxy(onDeclineCall)
			};

			this.trigger(xrtc.Connection.events.incomingCall, data);

			function onAcceptCall() {
				this.endSession();

				initPeerConnection.call(this, response.senderId, function () {
					logger.debug('receiveOffer', response);
					var sdp = JSON.parse(response.sdp);

					var sessionDescription = new RTCSessionDescription(sdp);
					peerConnection.setRemoteDescription(sessionDescription);

					peerConnection.createAnswer(proxy(onCreateAnswerSuccess), proxy(onCreateAnswerError), xrtc.Connection.settings.answerOptions);

					function onCreateAnswerSuccess(answer) {
						peerConnection.setLocalDescription(answer);

						logger.debug('sendAnswer', response, answer);
						handshakeController.sendAnswer(response.senderId, JSON.stringify(answer));

						this.trigger(xrtc.Connection.events.answerSent, response, answer);

						addRemoteSteam.call(this);
					}

					function onCreateAnswerError(err) {
						var error = new xrtc.CommonError('sendAnswer', "Can't create WebRTC answer", err);

						logger.error('sendAnswer', error);
						this.trigger(xrtc.Connection.events.answerError, error);
					}
				});
			}

			function onDeclineCall() {
				handshakeController.sendBye(response.senderId, { type: 'decline' });
			}
		}

		function onReceiveAnswer(response) {
			if (response.senderId != remoteParticipant || !peerConnection) {
				return;
			}

			logger.debug('receiveAnswer', response);
			var sdp = JSON.parse(response.sdp);

			var sessionDescription = new RTCSessionDescription(sdp);
			peerConnection.setRemoteDescription(sessionDescription);
			this.trigger(xrtc.Connection.events.answerReceived, response, sessionDescription);

			addRemoteSteam.call(this);
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
				
				var closedParticipant = remoteParticipant;
				remoteParticipant = null;

				debugger;
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

			serverError: 'servererror',

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

			mediaOptions: {
				audio: true,
				video: {
					mandatory: { minAspectRatio: 1.333, maxAspectRatio: 1.334 },
					optional: [{ minFrameRate: 24 }, { maxFrameRate: 24 }, { maxWidth: 320 }, { maxHeigth: 240 }]
				}
			},

			peerConnectionOptions: {
				optional: [{ RtpDataChannels: true }, { DtlsSrtpKeyAgreement: true }]
			}
		}
	});



	if (isFirefox) {
		// Chrome M26b and Chrome Canary with this settings fires an erron on the creation of offer/answer 
		xrtc.Connection.settings.offerOptions.mandatory.MozDontOfferDataChannel = true;
		xrtc.Connection.settings.answerOptions.mandatory.MozDontOfferDataChannel = true;
	}
})(window);