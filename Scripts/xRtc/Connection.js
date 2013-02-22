(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.Connection = new xrtc.Class('Connection');

	xrtc.Connection.include(xrtc.EventDispatcher);
	xrtc.Connection.include({
		init: function (userData, handshakeController) {
			var self = this;
			this._logger = new xrtc.Logger();
			this._peerConnection = null;
			this._handshakeController = handshakeController;
			this._userData = userData;

			handshakeController.on(xrtc.HandshakeController.events.recieveIce, function (response) {
				debugger;
				var iceCandidate = new RTCIceCandidate(JSON.parse(response.data).iceCandidate);
				self._peerConnection.addIceCandidate(iceCandidate);

				self.trigger(xrtc.Connection.events.iceAdded, request, iceCandidate);
			});

			handshakeController.on(xrtc.HandshakeController.events.recieveOffer, function (response) {
				var sdp = JSON.parse(response.sdp);
				$('#chat-form :text').val(response.participantId);
				
				var sessionDescription = new RTCSessionDescription(sdp);
				self._peerConnection.setRemoteDescription(sessionDescription);
				self._peerConnection.createAnswer(
					function (answer) {
						debugger;
						self._peerConnection.setLocalDescription(answer);
						self._handshakeController.sendAnswer(response.participantId, JSON.stringify(answer));

						self.trigger(xrtc.Connection.events.answerSent, response, sessionDescription);
					},
					function (error) {
						self.trigger(xrtc.Connection.events.answerError, error);
					},
					{ mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: true } }); // todo: think to change this
			});

			handshakeController.on(xrtc.HandshakeController.events.recieveAnswer, function (response) {
				var sdp = JSON.parse(response.sdp);
				
				var sessionDescription = new RTCSessionDescription(sdp);
				self._peerConnection.setRemoteDescription(sessionDescription);

				self.trigger(xrtc.Connection.events.answerReceived, request, self._peerConnection.remoteStreams[0]);
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
			
			this._initPeerConnection();
			self._peerConnection.createOffer(
				function (offer) {
					self._peerConnection.setLocalDescription(offer);
					self._handshakeController.sendOffer(participantId, JSON.stringify(offer));
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
				//peerConnectionServers: { iceServers: [{ url: "turn:user123@86.57.152.233", credential: "1234567" }] },//{ "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] }
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

			var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

			this._initPeerConnection();

			//todo: pass own params
			getUserMedia.call(
				navigator,
				opts,
				function (stream) {
					self._peerConnection.addStream(stream);
					self.trigger(xrtc.Connection.events.streamAdded, stream);
				}, function(error) {
					//todo: pass own params
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
				"data=" + JSON.stringify(this._getTokenRequestParams()),
				function (response) {
					var auth = JSON.parse(response.responseText);
					if (!!auth && !!auth.E && auth.E != "") {
						//todo: fire event
						console.log("Error creating authentication token: " + auth.E);
						return;
					}
					
					if (typeof (callback) == "function") {
						var token = auth.D.token;
						self._logger.info('Connection._getToken', token);
						callback.call(self, token);
					}
				}
			);
		},

		_getIceServers: function () {
			return { iceServers: [{ url: "stun:turn.influxis.com:3478" }] };
		},
		
		_initPeerConnection: function () {
			if (!this._peerConnection) {
				var self = this;
				this._peerConnection = new webkitRTCPeerConnection(this._getIceServers());
				this._peerConnection.onicecandidate = function (event) {
					debugger;
					if (!!event.candidate) {
						self._handshakeController.sendIce(self._userData.name, event.candidate.candidate);
						self.trigger(xrtc.Connection.events.iceSent, event);
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
			streamAdded: "streamadded",
			streamError: "streamerror",
			
			iceAdded: "iceadded",
			iceSent: "icesent",
			
			offerSent: "offersent",
			offerError: "offererror",
			
			answerSent: "answersent",
			answerError: "answererror",
			answerReceived: "answerreceived"
		},
		
		settings: {
			URL: 'http://turn.influxis.com/',
			tokenParams: {
				type: "token_request",
				authentication: "public",
				authorization: null,
			}
		}
	});
})(window);