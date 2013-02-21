(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.Connection = new xrtc.Class();

	xrtc.Connection.include({
		init: function (userData, handshakeController) {
			var self = this;
			this._logger = new xrtc.Logger();
			this._peerConnection = null;
			this._eventDispatcher = new xrtc.EventDispatcher();
			this._handshakeController = handshakeController;
			this._userData = userData;

			handshakeController.on('receiveIce', function (request) {
				var iceCandidate = new RTCIceCandidate(request);
				self._peerConnection.addIceCandidate(iceCandidate);

				self.trigger('iceAdded', request, iceCandidate);
			});
			
			handshakeController.on('receiveOffer', function (response) {
				var sessionDescription = new RTCSessionDescription(response.offer);
				self._peerConnection.setRemoteDescription(sessionDescription);
				self._peerConnection.createAnswer(
					function(desc) {
						self._peerConnection.setLocalDescription(desc);
						self._handshakeController.sendAnswer(response.participantId, JSON.stringify(desc));
					},
					function(e) {
						//todo: add logic
					},
					{ mandatory: { OfferToReceiveAudio: true, OfferToReceiveVideo: false } }); // todo: think to change this

				self.trigger('offerAdded', request, sessionDescription);
			});

			handshakeController.on('receiveanswer', function(request) {
				var sessionDescription = new RTCSessionDescription(request);
				self._peerConnection.setRemoteDescription(sessionDescription);

				self.trigger('answerAdded', request, self._peerConnection.remoteStreams[0]);
			});
		},

		connect: function () {
			this._getToken(function (token) {
				this._handshakeController.connect(token);
			});
		},

		startSession: function (participantId) {
			this._peerConnection = new webkitRTCPeerConnection(this._getIceServers());
			this._getToken(function (token) {
				this._handshakeController.sendOffer(token);
			});
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
				video: true,
				/*{
					mandatory: { minAspectRatio: 1.333, maxAspectRatio: 1.334 },
					optional: [{ minFrameRate: 24 }, { maxWidth: 640 }, { maxHeigth: 480 }]
				}*/
				//offerConstraints: { 'has_audio': true, 'has_video': true } // Chrome 24
				//offerConstraints: { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': false } }
			};

			var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

			getUserMedia.call(
				navigator,
				opts,
				function(e) {
					//todo: pass own params
					self.trigger.apply(self, xrtc.Connection.events.addStream, arguments);
					self._peerConnection.addstream(e);
					//xrtc.streams.push(stream);
					//xrtc.initializedStreams++;

					//jer-notify user method
					//xrtc.onMediaResult(stream);
					//if (xrtc.initializedStreams === xrtc.numStreams) {
					//	xrtc.dispatcher.dispatch('ready');
					//}
				}, function(e) {
					//todo: pass own params
					self.trigger.apply(self, xrtc.Connection.events.addStreamError, arguments);

					//alert("Could not connect stream.");
					//onFail();
				});
		},

		createDataChannel: function () {

		},

		on: function (eventName, eventHandler) {
			this._logger.info('Connection.on', arguments);

			this._eventDispatcher.on(arguments);
		},

		off: function (eventName) {
			this._logger.info('Connection.off', arguments);

			this._eventDispatcher.off(arguments);
		},

		trigger: function (eventName) {
			this._logger.info('Connection.trigger', arguments);

			this._eventDispatcher.trigger(arguments);
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
			addStream: "addstream",
			addStreamError: "addstreamerror",
			icecandidate: "icecandidate", //this._peerConnection.onicecandidate
			createOffer: "createOffer",
			createOfferError: "createOfferError",
			createAnswer: "createAnswer",
			createAnswerError: "createAnswerError"
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