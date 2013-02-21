(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.HandshakeController = new xrtc.Class();

	xrtc.HandshakeController.include({
		init: function (peerConnection, name) {
			this._logger = new xrtc.Logger();
			this._eventDispatcher = new xrtc.EventDispatcher();
			this._socket = null;

			//this._channel = new exports.DataChannel(peerConnection, name);

			// this._channel.onopen = function (event) {
			// 	self._eventDispatcher.trigger(xrtc.events.open, event);
			// };
			// this._channel.onmessage = function (event) {
			// 	self._eventDispatcher.trigger(xrtc.events.message, event);
			// };
			// this._channel.onclose = function (event) {
			// 	self._eventDispatcher.trigger(xrtc.events.close, event);
			// };
			// this._channel.onerror = function (event) {
			// 	self._eventDispatcher.trigger(xrtc.events.error, event);
			// };
			// this._channel.ondatachannel = function () {
			// 	self._eventDispatcher.trigger(xrtc.events.datachannel, event);
			// };
		},

		connect: function (token) {
			var self = this,
				events = xrtc.HandshakeController.events,
				url = 'ws://turn.influxis.com:8002/ws/' + escape(token);

			self._socket = new WebSocket(url);

			self._socket.onopen = function (evt) {
				debugger;
				self._logger.info(evt);
				self.trigger(events.connectionOpen, evt);
			};

			self._socket.onmessage = function (msg) {
				debugger;
				self._logger.info(msg);
				self.trigger(events.message, msg);

				//todo: parse ice/offer/answer
				var message = self._parseMessage(msg);
				self.trigger(message.name, message.data);
			};

			self._socket.onclose = function (evt) {
				debugger;
				self._logger.info(evt);
				self.trigger(events.connectionClose, evt);
			};

			self._socket.onerror = function (evt) {
				debugger;
				self._logger.error(evt);
				self.trigger(events.connectionError, evt);
			};
		},

		sendIce: function (participantId, ice) {
			var data = {
				eventName: "rtc_ice_candidate",
				data: {
					socketId: participantId,
					candidate: ice
				}
			};
			
			var request = JSON.stringify(data);
			this._socket.send(request);
		},

		sendOffer: function (participantId, offer) {
			var data = {
				eventName: "rtc_offer",
				data: {
					socketId: participantId,
					sdp: offer
				}
			};

			var request = JSON.stringify(data);
			this._socket.send(request);
		},

		sendAnswer: function (participantId, answer) {
			var data = {
				eventName: "rtc_answer",
				data: {
					socketId: participantId,
					sdp: answer
				}
			};

			var request = JSON.stringify(data);
			this._socket.send(request);
		},

		on: function (eventName, eventHandler) {
			this._logger.info('HandshakeController.on', Array.prototype.slice.call(arguments));

			this._eventDispatcher.on.apply(this._eventDispatcher, arguments);
		},

		off: function (eventName) {
			this._logger.info('HandshakeController.off', Array.prototype.slice.call(arguments));

			this._eventDispatcher.off.apply(this._eventDispatcher, arguments);
		},

		trigger: function (eventName, data) {
			this._logger.info('HandshakeController.trigger', Array.prototype.slice.call(arguments));

			this._eventDispatcher.trigger.apply(this._eventDispatcher, arguments);
		},
		
		_parseMessage: function(msg) {
			var json = JSON.parse(msg.data);
			switch (json.Type) {
				case "peers":
					json = {
						eventName: json.Type,
						data: {
							connections: JSON.parse(json.Message)
						}
					};
					break;
				case "peer_connected":
					json = {
						eventName: json.Type,
						data: {
							paticipantId: json.Message
						}
					};
					break;
				case "peer_removed":
					json = {
						eventName: json.Type,
						data: {
							paticipantId: json.Message
						}
					};
					break;
				default:
					json = JSON.parse(json.Message);
					break;
			}
			return { name: xrtc.HandshakeController.eventMapping[json.eventName], data: json.data };
		}
	});

	xrtc.HandshakeController.extend({
		events: {
			connectionOpen: "connectionopen",
			connectionClose: "connectionclose",
			connectionError: "connectionerror",
			
			message: "message",
			connected: "connected",
			
			participantsUpdated: "participantsupdated",
			participantConnected: "participantconnected",
			participantDisconnected: "participantdisconnected",
			
			recieveIce: "recieveice",
			recieveOffer: "recieveoffer",
			recieveAnswer: "recieveanswer",
			sendIce: "sendIce",
			sendOffer: "sendOffer",
			sendAnswer: "sendAnswer"
		},
		
		eventMapping: {
			"peers": "participantsUpdated",
			"peer_connected": "participantConnected",
			"peer_removed": "participantDisconnected",
			
			"receive_offer": "recieveOffer",
			"rtc_ice_candidate": "recieveIce",
			"rtc_answer": "recieveAnswer"
		}
	});
})(window);