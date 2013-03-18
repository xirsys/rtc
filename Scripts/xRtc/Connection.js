'use strict';

//todo: add ability to check WebRTC support. think of it!
(function (exports) {
	var xrtc = exports.xRtc;

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


	xrtc.Connection = xrtc.Class('Connection');

	xrtc.Connection.include(xrtc.EventDispatcher);
	xrtc.Connection.include(xrtc.Ajax);
	xrtc.Connection.include({
		init: function (userData, handshakeController) {
			this._authManager = new xrtc.AuthManager();

			var self = this;
			self._logger = new xrtc.Logger(this.className);
			self._peerConnection = null;
			self._remoteParticipant = null;
			self._handshakeController = handshakeController;
			self._userData = userData;
			self._localStreams = [];
			this.proxy = xrtc.Class.proxy(this);

			handshakeController
				.on(xrtc.HandshakeController.events.receiveIce, function (response) {
					if (self._remoteParticipant != response.senderId || !self._peerConnection) {
						return;
					}

					self._logger.debug('receiveIce', response);

					var iceCandidate = new RTCIceCandidate(JSON.parse((response.iceCandidate)));
					self._peerConnection.addIceCandidate(iceCandidate);

					self.trigger(xrtc.Connection.events.iceAdded, response, iceCandidate);
				})
				.on(xrtc.HandshakeController.events.receiveOffer, function (response) {
					if (response.receiverId != self._userData.name) {
						return;
					}

					if (self.getState() === 'connected') {
						//todo: or logic of using one Connection will be removed
						self._handshakeController.sendBye(response.senderId);
						return;
					}

					self._initPeerConnection(response.senderId, function (peerConnection) {
						self._logger.debug('receiveOffer', response);
						var sdp = JSON.parse(response.sdp);

						var sessionDescription = new RTCSessionDescription(sdp);
						peerConnection.setRemoteDescription(sessionDescription);

						peerConnection.createAnswer(
							function (answer) {
								peerConnection.setLocalDescription(answer);
								self._handshakeController.sendAnswer(response.senderId, JSON.stringify(answer));

								self._logger.debug('sendAnswer', response, answer);
								self.trigger(xrtc.Connection.events.answerSent, response, answer);

								self._addRemoteSteam();
							},
							function (err) {
								var error = new xrtc.CommonError('sendAnswer', "Can't create WebRTC answer", err);
								self._logger.error('sendAnswer', error);
								self.trigger(xrtc.Connection.events.answerError, error);
							},
							xrtc.Connection.settings.answerOptions);
					});
				})
				.on(xrtc.HandshakeController.events.receiveAnswer, function (response) {
					if (self._remoteParticipant != response.senderId || !self._peerConnection) {
						return;
					}

					self._logger.debug('receiveAnswer', response);
					var sdp = JSON.parse(response.sdp);

					var sessionDescription = new RTCSessionDescription(sdp);
					self._peerConnection.setRemoteDescription(sessionDescription);
					self.trigger(xrtc.Connection.events.answerReceived, response, sessionDescription);

					self._addRemoteSteam();
				})
				.on(xrtc.HandshakeController.events.receiveBye, function (response) {
					if (self._remoteParticipant != response.senderId || !self._peerConnection) {
						return;
					}

					self._close();
				});
		},

		connect: function () {
			/// <summary>Initiate connection with server via HandshakeController</summary>

			var self = this;

			this._getIceServers(function (token, iceServers) {
				self._iceServers = iceServers;
				self._handshakeController.connect(token);
			});
		},

		_getIceServers: function (callback) {
			var self = this;

			this._authManager.getToken(this._userData, function (token) {
				self._authManager.getIceServers(token, function (iceServers) {
					if (typeof callback === "function") {
						callback(token, iceServers);
					}
				});
			});
		},

		startSession: function (participantId, options) {
			/// <summary>Starts the process of p2p connection establishment</summary>
			/// <param name="participantId" type="string">Name of remote participant</param>
			/// <param name="options" type="object">Optional param. Offer options</param>

			if (!participantId) {
				throw new xrtc.CommonError('startSession', 'participantId should be specified');
			}

			var self = this, opts = {};

			xrtc.Class.extend(opts, xrtc.Connection.settings.offerOptions, options || {});

			this._initPeerConnection(participantId, function (peerConnection) {
				peerConnection.createOffer(
					function (offer) {
						peerConnection.setLocalDescription(offer);
						self._logger.debug('sendOffer', self._remoteParticipant, offer);

						// todo:remove it in next versions
						if (isFirefox) {
							offer.sdp = offer.sdp + 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:BAADBAADBAADBAADBAADBAADBAADBAADBAADBAAD\r\n';
						}
						// todo:remove it in next versions

						self._handshakeController.sendOffer(self._remoteParticipant, JSON.stringify(offer));

						self.trigger(xrtc.Connection.events.offerSent, self._remoteParticipant, offer);
					},
					function (err) {
						var error = new xrtc.CommonError('startSession', "Can't create WebRTC offer", err);
						self._logger.error('sendOffer', error);
						self.trigger(xrtc.Connection.events.offerError, error);
					},
					opts
				);
			});
		},

		endSession: function () {
			/// <summary>Ends p2p connection</summary>

			if (this._handshakeController && this._remoteParticipant) {
				this._handshakeController.sendBye(this._remoteParticipant);
			}

			this._close();
		},

		addMedia: function (options) {
			/// <summary>Asks user to allow use local devices, e.g. camera and microphone</summary>
			/// <param name="options" type="object">Optional param. Local media options</param>

			var self = this, opts = {};

			xrtc.Class.extend(opts, xrtc.Connection.settings.mediaOptions, options || {});

			getUserMedia(
				opts,
				function (stream) {
					self._localStreams.push(stream);

					var xrtcStream = new xrtc.Stream(stream, self._userData.name);

					self._logger.debug('addMedia', xrtcStream);
					self.trigger(xrtc.Connection.events.streamAdded, xrtcStream);
				},
				function (err) {
					var error = new xrtc.CommonError('addMedia', "Can't get UserMedia", err);

					self._logger.error('addMedia', error);
					self.trigger(xrtc.Connection.events.streamError, error);
				}
			);
		},

		createDataChannel: function (name) {
			/// <summary>Creates new instance of DataChannel</summary>
			/// <param name="name" type="string">Name for DataChannel. Must be unique</param>

			var dataChannel = null;

			try {
				dataChannel = new xrtc.DataChannel(this._peerConnection.createDataChannel(name, { reliable: false }), this._userData.name);
			} catch (ex) {
				var error = new xrtc.CommonError('createDataChannel', "Can't create DataChannel", ex);
				this.trigger(xrtc.Connection.events.dataChannelCreationError, error);
			}

			return dataChannel;
		},


		getState: function () {
			/// <summary>Returns state of p2p connection</summary>

			// it can change from version to version
			var isLocalStreamAdded = this._localStreams.length > 0,

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

				state = this._peerConnection ? this._peerConnection.readyState : 'notinitialized';

			return states[state];
		},

		_close: function () {
			if (this._peerConnection) {
				this._peerConnection.onicecandidate = null;
				this._peerConnection.close();
				this._peerConnection = null;

				var closedParticipant = this._remoteParticipant;
				this._remoteParticipant = null;

				this.trigger(xrtc.Connection.events.connectionClosed, closedParticipant);
			}
		},

		_initPeerConnection: function (userId, callback) {
			this._remoteParticipant = userId;
			var self = this;

			function callCallback() {
				if (typeof callback === "function") {
					try {
						callback(self._peerConnection);
					} catch (e) {
						// todo: check or not check?
						// here is a server problem, sometimes it doesn't work from first time
						// error can occur 1-4 times in a row
					}
				}
			}

			if (!this._peerConnection) {
				this._getIceServers(function (token, iceServers) {
					self._peerConnection = new RTCPeerConnection(iceServers, xrtc.Connection.settings.peerConnectionOptions);
					self._logger.info('_initPeerConnection', 'PeerConnection created.');

					self._peerConnection.onicecandidate = function (evt) {
						if (!!evt.candidate) {
							self._handshakeController.sendIce(self._remoteParticipant, JSON.stringify(evt.candidate));
							self.trigger(xrtc.Connection.events.iceSent, { event: evt });
						}
					};

					self._peerConnection.onstatechange = function (e) {
						self.trigger(xrtc.Connection.events.stateChanged, self.getState());
					};

					self._peerConnection.onopen = function (e) {
						self.trigger(xrtc.Connection.events.connectionEstablished, self._remoteParticipant);
					};

					for (var i = 0, len = self._localStreams.length; i < len; i++) {
						self._peerConnection.addStream(self._localStreams[i]);
					}

					self.trigger(xrtc.Connection.events.initialized);

					callCallback();
				});
			} else {
				callCallback();
			}
		},

		_addRemoteSteam: function () {
			var streams = this._peerConnection.getRemoteStreams();

			if (streams.length > 0) {
				this.trigger(xrtc.Connection.events.streamAdded, new xrtc.Stream(streams[0], this._remoteParticipant));
			} else {
				// will make pause if there is not any remote streams
				setTimeout(this.proxy(this._addRemoteSteam), 100);
			}
		},
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
		// Chrome M26b and Chrome Canary this settings fires an erron on the creation of offer/answer 
		xrtc.Connection.settings.offerOptions.mandatory.MozDontOfferDataChannel = true;
		xrtc.Connection.settings.answerOptions.mandatory.MozDontOfferDataChannel = true;
	}
})(window);