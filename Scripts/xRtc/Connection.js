'use strict';

(function (exports) {
	var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia,
		URL = exports.URL || exports.webkitURL || exports.msURL || exports.oURL,
		RTCPeerConnection = exports.PeerConnection || exports.webkitPeerConnection00 || exports.webkitRTCPeerConnection,
		RTCIceCandidate = exports.RTCIceCandidate,
		RTCSessionDescription = exports.RTCSessionDescription;

	// todo: move to another place
	function extend(destinationObj, sourceObj) {
		for (var i in sourceObj) {
			destinationObj[i] = sourceObj[i];
		}
	}

	var xrtc = exports.xRtc;
	xrtc.Connection = new xrtc.Class('Connection');

	xrtc.Connection.include(xrtc.EventDispatcher);
	xrtc.Connection.include({
		init: function (userData, handshakeController) {
			var self = this;
			this._logger = new xrtc.Logger();
			this._peerConnection = null;
			this._remoteParticipant = null;
			this._handshakeController = handshakeController;
			this._userData = userData;

			handshakeController.on(xrtc.HandshakeController.events.receiveIce, function (response) {
				self._logger.debug('Connection.receiveIce', response);

				var iceCandidate = new RTCIceCandidate(response.iceCandidate);
				self._peerConnection.addIceCandidate(iceCandidate);

				self.trigger(xrtc.Connection.events.iceAdded, response, iceCandidate);
			});

			handshakeController.on(xrtc.HandshakeController.events.receiveOffer, function (response) {
				self._logger.debug('Connection.receiveoffer', response);
				var sdp = JSON.parse(response.sdp);

				// todo: remove it
				self._remoteParticipant = response.senderId;
				if (response.receiverId !== self._userData.name) {
					return;
				}
				// todo: remove it

				var sessionDescription = new RTCSessionDescription(sdp);
				self._peerConnection.setRemoteDescription(sessionDescription);
				self._peerConnection.createAnswer(
					function (answer) {
						self._peerConnection.setLocalDescription(answer);
						self._handshakeController.sendAnswer(response.senderId, JSON.stringify(answer));

						self._logger.debug('Connection.sendAnswer', response, answer);
						self.trigger(xrtc.Connection.events.answerSent, response, answer);

						/***********************************************/
						// todo: check and refactor
						var stream = self._peerConnection.remoteStreams[0],
							data = {
								stream: stream,
								url: URL.createObjectURL(stream),
								isLocal: false
							};

						self.trigger(xrtc.Connection.events.streamAdded, data);
						/***********************************************/
					},
					function (error) {
						var data = { error: error };
						self._logger.error('Connection.sendAnswer', data);
						self.trigger(xrtc.Connection.events.answerError, data);
					},
					xrtc.Connection.settings.answerOptions);
			});

			handshakeController.on(xrtc.HandshakeController.events.receiveAnswer, function (response) {
				self._logger.debug('Connection.receiveAnswer', response);
				var sdp = JSON.parse(response.sdp);

				var sessionDescription = new RTCSessionDescription(sdp);
				self._peerConnection.setRemoteDescription(sessionDescription);
				self.trigger(xrtc.Connection.events.answerReceived, response, sessionDescription);

				/***********************************************/
				// todo: think to refactor this
				var stream = self._peerConnection.remoteStreams[0],
					data = {
						stream: stream,
						url: URL.createObjectURL(stream),
						isLocal: false
					};
				self.trigger(xrtc.Connection.events.streamAdded, data);
				/***********************************************/
			});
		},

		connect: function () {
			var self = this;

			this._getToken(function (token) {
				self._handshakeController.connect(token);
			});
		},

		startSession: function (participantId, options) {
			var self = this, opts = {};

			extend(opts, xrtc.Connection.settings.offerOptions);
			extend(opts, options || {});

			this._remoteParticipant = participantId;
			this._initPeerConnection();
			
			self._peerConnection.createOffer(
				function(offer) {
					self._peerConnection.setLocalDescription(offer);
					self._handshakeController.sendOffer(self._remoteParticipant, JSON.stringify(offer));

					self._logger.debug('Controller.sendOffer', self._remoteParticipant, offer);
					self.trigger(xrtc.Connection.events.offerSent, self._remoteParticipant, offer);
				},
				function (error) {
					var data = { error: error };
					self._logger.error('Controller.sendOffer', data);
					self.trigger(xrtc.Connection.events.offerError, data);
				},
				opts
			);
		},

		endSession: function () {
			if (this._peerConnection) {
				this._peerConnection.close();
			}
		},

		addMedia: function (options) {
			var self = this, opts = {};

			extend(opts, xrtc.Connection.settings.mediaOptions);
			extend(opts, options || {});

			this._initPeerConnection();

			//todo: pass own params
			getUserMedia.call(navigator, opts,
				function (stream) {
					var data = {
						stream: stream,
						url: URL.createObjectURL(stream),
						isLocal: stream.constructor.name === 'LocalMediaStream'
					};

					self._peerConnection.addStream(stream);
					self.trigger(xrtc.Connection.events.streamAdded, data);
				},
				function (error) {
					var data = {
						error: error
					};

					self.trigger(xrtc.Connection.events.streamError, data);
				});
		},

		createDataChannel: function (name) {
			// todo: check negative flows
			var dataChannel = null;

			try {
				dataChannel = new xrtc.DataChannel(this._peerConnection.createDataChannel(name, { reliable: false }));
			} catch (ex) {
				var error = {
					exception: ex
				};
				this.trigger(xrtc.Connection.events.dataChannelCreationError, error);
			}

			return dataChannel;
		},

		_getToken: function (callback) {
			var self = this,
				ajax = new xrtc.Ajax();

			ajax.request(
				xrtc.Connection.settings.URL + 'getToken',
				xrtc.Ajax.methods.POST,
				'data=' + JSON.stringify(this._getTokenRequestParams()),
				function (response) {
					self._logger.debug('Connection._getToken', response);

					var serverMessage = JSON.parse(response.responseText);
					if (!!serverMessage && !!serverMessage.E && serverMessage.E != '') {
						var errorData = { method: 'getToken', error: serverMessage.E };
						self._logger.error('Connection._getToken', errorData);
						self.trigger(xrtc.Connection.events.serverError, errorData);
						return;
					}

					var token = serverMessage.D.token;
					self._logger.info('Connection._getToken', token);

					if (typeof (callback) == 'function') {
						callback.call(self, token);
					}
				}
			);
		},

		_getIceServers: function (callback) {
			var self = this,
				ajax = new xrtc.Ajax();

			this._getToken(function (token) {
				ajax.request(
					xrtc.Connection.settings.URL + 'getIceServers',
					xrtc.Ajax.methods.POST,
					'token=' + token,
					function (response) {
						self._logger.debug('Connection._getIceServers', response);

						var serverMessage = JSON.parse(response.responseText);
						if (!!serverMessage && !!serverMessage.E && serverMessage.E != '') {
							var errorData = { method: 'getIceServers', error: serverMessage.E };
							self._logger.error('Connection._getIceServers', errorData);
							self.trigger(xrtc.Connection.events.serverError, errorData);
							return;
						}

						// todo: say Lee to fix iceServers message format and remove replacement
						var iceServers = serverMessage.D
							.replace(' url', ' "url"')
							.replace(' url', ' "url"')
							.replace('credential', '"credential"')
							.replace('iceServers', '"iceServers"');

						iceServers = JSON.parse(iceServers);
						self._logger.info('Connection._getIceServers', iceServers);

						if (typeof (callback) == 'function') {
							callback.call(self, iceServers);
						}
					}
				);
			});
		},

		_initPeerConnection: function () {
			if (!this._peerConnection) {
				var self = this;

				this._getIceServers(function (iceServers) {
					self._peerConnection = new RTCPeerConnection(iceServers, xrtc.Connection.settings.peerConnectionOptions);

					self._peerConnection.onicecandidate = function (evt) {
						if (!!evt.candidate) {
							self._handshakeController.sendIce(self._remoteParticipant, evt.candidate);

							self.trigger(xrtc.Connection.events.iceSent, { event: evt });
						}
					};
				});
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

			this._logger.info('Connection._getTokenRequestParams', result);

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

			serverError: 'serverError'
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
					optional: [{ minFrameRate: 24 }, { maxWidth: 300 }, { maxHeigth: 300 }]
				}
			},

			peerConnectionOptions: {
				optional: [{ RtpDataChannels: true }]
			}
		}
	});
})(window);