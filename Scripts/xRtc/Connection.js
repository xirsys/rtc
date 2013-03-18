'use strict';

//todo: add ability to check WebRTC support. think of it!
(function (exports) {
	var xrtc = exports.xRtc;

	var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.getUserMedia,
		URL = exports.webkitURL || exports.msURL || exports.oURL || exports.URL,
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

					if (self.getState() === 'active') {
						//todo: perhaps in next version this event will be replaced by another
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

		/// <summary>Initiate connection with server via HandshakeController</summary>
		connect: function () {
			var self = this;

			self._getToken(function (token) {
				self._getIceServersByToken(token, function (iceServers) {
					self._iceServers = iceServers;
					self._handshakeController.connect(token);
				});
			});
		},

		/// <summary>Starts the process of p2p connection establishment</summary>
		/// <param name="participantId" type="string">Name of remote participant</param>
		/// <param name="options" type="object">Optional param. Offer options</param>
		startSession: function (participantId, options) {
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

		/// <summary>Ends p2p connection</summary>
		endSession: function () {
			if (this._handshakeController && this._remoteParticipant) {
				this._handshakeController.sendBye(this._remoteParticipant);
			}

			this._close();
		},

		/// <summary>Asks user to allow use local devices, e.g. camera and microphone</summary>
		/// <param name="options" type="object">Optional param. Local media options</param>
		addMedia: function (options) {
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

		/// <summary>Creates new instance of DataChannel</summary>
		/// <param name="name" type="string">Name for DataChannel. Must be unique</param>
		createDataChannel: function (name) {
			var dataChannel = null;

			try {
				dataChannel = new xrtc.DataChannel(this._peerConnection.createDataChannel(name, { reliable: false }), this._userData.name);
			} catch (ex) {
				var error = new xrtc.CommonError('createDataChannel', "Can't create DataChannel", ex);
				this.trigger(xrtc.Connection.events.dataChannelCreationError, error);
			}

			return dataChannel;
		},


		/// <summary>Returns state of p2p connection</summary>
		getState: function () {
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

		_getToken: function (callback) {
			var self = this;

			this.ajax(
				xrtc.Connection.settings.URL + 'getToken',
				'POST',
				'data=' + JSON.stringify(this._getTokenRequestParams()),
				function (response) {
					try {
						response = JSON.parse(response);
						self._logger.debug('_getToken', response);

						if (!!response && !!response.E && response.E != '') {
							var error = new xrtc.CommonError('getToken', response.E);
							self._logger.error('_getToken', error);
							self.trigger(xrtc.Connection.events.serverError, error);
							return;
						}

						var token = response.D.token;
						self._logger.info('_getToken', token);

						if (typeof (callback) === 'function') {
							callback.call(self, token);
						}
					} catch (e) {
						self._getToken(callback);
					}
				}
			);
		},

		_getIceServers: function (callback) {
			var self = this;

			if (this._iceServers) {
				if (typeof (callback) === 'function') {
					callback.call(this, this._iceServers);
				}
			} else {
				self._getToken(function (token) {
					self._getIceServersByToken(token, callback);
				});
			}
		},

		_getIceServersByToken: function (token, callback) {
			if (this._iceServers) {
				if (typeof (callback) === 'function') {
					callback.call(this, this._iceServers);
				}
			} else {
				var self = this;

				var iceServers = xrtc.Connection.settings.iceServers;
				if (iceServers && iceServers.iceServers && iceServers.iceServers.length > 0) {
					self._logger.info('_getIceServers', iceServers);

					if (typeof (callback) === 'function') {
						callback.call(self, iceServers);
					}
				} else {
					this.ajax(
						xrtc.Connection.settings.URL + 'getIceServers',
						'POST',
						'token=' + token,
						function (response) {
							try {
								response = JSON.parse(response);
								self._logger.debug('_getIceServers', response);

								if (!!response && !!response.E && response.E != '') {
									var error = new xrtc.CommonError('getIceServers', response.E);
									self._logger.error('_getIceServers', error);
									self.trigger(xrtc.Connection.events.serverError, error);
									return;
								}

								iceServers = JSON.parse(response.D);

								// todo: remove it in next version of Firefox
								self._convertIceServerDNStoIP(iceServers.iceServers);
								// todo: remove it in next version of Firefox

								self._logger.info('_getIceServers', iceServers);

								if (typeof (callback) === 'function') {
									callback.call(self, iceServers);
								}

							} catch (e) {
								self._getIceServersByToken(token, callback);
							}
						}
					);
				}
			}
		},

		// todo: remove it in next version of Firefox
		_convertIceServerDNStoIP: function (iceServers) {
			var addresses = {
				'stun.influxis.com': '50.97.63.12',
				'turn.influxis.com': '50.97.63.12'
			};

			for (var i = 0; i < iceServers.length; i++) {
				var server = iceServers[i];

				for (var dns in addresses) {
					server.url = server.url.replace(dns, addresses[dns]);
				}
			}
		},
		// todo: remove it in next version of Firefox

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
				this._getIceServers(function (iceServers) {
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
						this._peerConnection.addStream(self._localStreams[i]);
					}

					self.trigger(xrtc.Connection.events.initialized);

					callCallback();
				});
			} else {
				callCallback();
			}
		},

		_getTokenRequestParams: function () {
			var tokenParams = xrtc.Connection.settings.tokenParams,
				userData = this._userData,
				result = {
					Type: tokenParams.type,
					Authentication: tokenParams.authentication,
					Authorization: tokenParams.authorization,
					Domain: userData.domain,
					Application: userData.application,
					Room: userData.room,
					Ident: userData.name
				};

			this._logger.info('_getTokenRequestParams', result);

			return result;
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
			URL: 'http://turn.influxis.com/',

			tokenParams: {
				type: 'token_request',
				authentication: 'public',
				authorization: null,
			},

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