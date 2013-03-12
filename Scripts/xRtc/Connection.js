'use strict';

(function (exports) {
	var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia,
		URL = exports.URL || exports.webkitURL || exports.msURL || exports.oURL,
		RTCPeerConnection = exports.PeerConnection || exports.webkitPeerConnection00 || exports.webkitRTCPeerConnection,
		RTCIceCandidate = exports.RTCIceCandidate,
		RTCSessionDescription = exports.RTCSessionDescription;

	var xrtc = exports.xRtc;
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

								/***********************************************/
								// todo: in next version it should be wrapped
								var stream = self._peerConnection.remoteStreams[0],
									data = {
										stream: stream,
										url: URL.createObjectURL(stream),
										isLocal: false,
										participantId: self._remoteParticipant
									};

								self.trigger(xrtc.Connection.events.streamAdded, data);
								/***********************************************/
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


					/***********************************************/
					// todo: in next version it should be wrapped
					var stream = self._peerConnection.remoteStreams[0],
						data = {
							stream: stream,
							url: URL.createObjectURL(stream),
							isLocal: false,
							participantId: self._remoteParticipant
						};

					self.trigger(xrtc.Connection.events.streamAdded, data);
					/***********************************************/
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

			getUserMedia.call(navigator, opts,
				function (stream) {
					var data = {
						stream: stream,
						url: URL.createObjectURL(stream),
						isLocal: true,
						participantId: self._userData.name
					};

					self._localStreams.push(stream);

					self._logger.debug('addMedia', data);
					self.trigger(xrtc.Connection.events.streamAdded, data);
				},
				function (err) {
					var error = new xrtc.CommonError('addMedia', "Can't get UserMedia", err);

					self._logger.error('addMedia', error);
					self.trigger(xrtc.Connection.events.streamError, error);
				});
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
			if (!this._peerConnection) {
				return 'notinitialized';
			}

			return this._peerConnection.readyState;
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

						if (typeof (callback) == 'function') {
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
				if (typeof (callback) == 'function') {
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
				if (typeof (callback) == 'function') {
					callback.call(this, this._iceServers);
				}
			} else {
				var self = this;

				//callback.call(self, { iceServers: [{ url: "stun:stun.l.google.com:19302" }] });
				//callback.call(self, { iceServers: [{ url: "turn:user123@86.57.152.233", credential: "1234567" }] });
				//callback.call(self, { iceServers: [{ url: "stun:turn.influxis.com" }] });
				//callback.call(self, { iceServers: [{ url: "turn:free@turn.influxis.com", credential: "free" }] });
				//callback.call(self, { iceServers: [{ url: "stun:turn.influxis.com" }, { url: "turn:free@turn.influxis.com", credential: "free" }] });
				//callback.call(self, null);
				//return;

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

							var iceServers = JSON.parse(response.D);
							//debugger;
							// todo: remove it!
							//iceServers.iceServers = [iceServers.iceServers[0]];
							iceServers.iceServers[0].url = iceServers.iceServers[0].url.replace('stun:stun', 'stun:turn');
							//iceServers.iceServers[0].url = iceServers.iceServers[0].url.replace('.com', '.com:3478');
							// todo: remove it!

							self._logger.info('_getIceServers', iceServers);

							if (typeof (callback) == 'function') {
								callback.call(self, iceServers);
							}

						} catch (e) {
							self._getIceServersByToken(token, callback);
						}
					}
				);
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
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true
				}
			},

			answerOptions: {
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
				optional: [{ RtpDataChannels: true }]
			}
		}
	});
})(window);