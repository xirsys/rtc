'use strict';

(function (exports) {
	var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia,
		URL = exports.URL || exports.webkitURL || exports.msURL || exports.oURL,
		RTCPeerConnection = exports.PeerConnection || exports.webkitPeerConnection00 || exports.webkitRTCPeerConnection,
		RTCIceCandidate = exports.RTCIceCandidate,
		RTCSessionDescription = exports.RTCSessionDescription;
	
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
				self._logger.debug('Connection.receiveice', response.senderId);
				
				var iceCandidate = new RTCIceCandidate(response.iceCandidate);
				self._peerConnection.addIceCandidate(iceCandidate);

				self.trigger(xrtc.Connection.events.iceAdded, response, iceCandidate);
			});

			handshakeController.on(xrtc.HandshakeController.events.receiveOffer, function (response) {
				self._logger.debug('Connection.receiveoffer', response.senderId);
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
					function(answer) {
						self._peerConnection.setLocalDescription(answer);
						self._handshakeController.sendAnswer(response.senderId, JSON.stringify(answer));

						self.trigger(xrtc.Connection.events.answerSent, response, sessionDescription);
					},
					function (error) {
						self.trigger(xrtc.Connection.events.answerError, error);
					},
					xrtc.Connection.settings.answerOptions);
			});

			handshakeController.on(xrtc.HandshakeController.events.receiveAnswer, function (response) {
				self._logger.debug('Connection.receiveanswer', response.senderId);
				var sdp = JSON.parse(response.sdp);
				
				var sessionDescription = new RTCSessionDescription(sdp);
				self._peerConnection.setRemoteDescription(sessionDescription);

				var stream = self._peerConnection.remoteStreams[0],
					data = {
						stream: stream,
						url: URL.createObjectURL(stream)
					};
				
				self.trigger(xrtc.Connection.events.answerReceived, data);
			});
		},

		connect: function () {
			var self = this;
			
			this._getToken(function (token) {
				self._handshakeController.connect(token);
			});
		},

		startSession: function (participantId) {
			var self = this;

			this._remoteParticipant = participantId;
			this._initPeerConnection();
			self._peerConnection.createOffer(
				function(offer) {
					self._peerConnection.setLocalDescription(offer);
					self._handshakeController.sendOffer(self._remoteParticipant, JSON.stringify(offer));
				},
				function(error) {
					// todo: log and fire event
				},
				{
					mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true }
				});
			//this._getToken(function (token) {
			//});
		},
		
		endSession: function () {
			if (this._peerConnection) {
				this._peerConnection.close();
			}
		},

		addMedia: function (options) {
			var self = this;
			var opts = {
				//peerConnectionServers: { iceServers: [{ url: 'turn:user123@86.57.152.233', credential: '1234567' }] },//{ 'iceServers': [{ 'url': 'stun:stun.l.google.com:19302' }] }
				//peerConnectionConfiguration: { optional: [{ RtpDataChannels: true }] },
				//audioConstraints: true,
				//videoConstraints: true,
				audio: true,
				video: {
					mandatory: { minAspectRatio: 1.333, maxAspectRatio: 1.334 },
					optional: [{ minFrameRate: 24 }, { maxWidth: 300 }, { maxHeigth: 300 }]
				}
				//offerConstraints: { 'has_audio': true, 'has_video': true } // Chrome 24
				//offerConstraints: { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': false } }
			};

			this._initPeerConnection();

			//todo: pass own params
			getUserMedia.call(
				navigator,
				opts,
				function (stream) {
					var data = {
						stream: stream,
						url: URL.createObjectURL(stream)
					};
					
					self._peerConnection.addStream(stream);
					self.trigger(xrtc.Connection.events.streamAdded, data);
				}, function(error) {
					//todo: pass own params
					debugger;
					self.trigger(xrtc.Connection.events.streamError, error);
				});
		},

		createDataChannel: function () {

		},

		_getToken: function (callback) {
			var self = this,
				ajax = new xrtc.Ajax();
			
			ajax.request(
				xrtc.Connection.settings.URL + 'getToken',
				xrtc.Ajax.methods.POST,
				'data=' + JSON.stringify(this._getTokenRequestParams()),
				function (response) {
					var auth = JSON.parse(response.responseText);
					if (!!auth && !!auth.E && auth.E != '') {
						//todo: fire event
						console.log('Error creating authentication token: ' + auth.E);
						return;
					}
					
					if (typeof (callback) == 'function') {
						var token = auth.D.token;
						self._logger.info('Connection._getToken', token);
						callback.call(self, token);
					}
				}
			);
		},

		_getIceServers: function () {
			return { iceServers: [{ url: 'stun:turn.influxis.com:3478' }] };
		},
		
		_initPeerConnection: function () {
			if (!this._peerConnection) {
				var self = this;
				this._peerConnection = new RTCPeerConnection(this._getIceServers());
				this._peerConnection.onicecandidate = function (evt) {
					if (!!evt.candidate) {
						self._handshakeController.sendIce(self._remoteParticipant, evt.candidate);
						self.trigger(xrtc.Connection.events.iceSent, evt);
					}
				};
			}
		},
		
		_getTokenRequestParams: function() {
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
			answerError: 'answererror'
		},
		
		settings: {
			URL: 'http://turn.influxis.com/',
			
			tokenParams: {
				type: 'token_request',
				authentication: 'public',
				authorization: null,
			},
			
			// todo: think to change this
			answerOptions: {
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true
				}
			}
		}
	});
})(window);