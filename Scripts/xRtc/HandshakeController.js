'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.HandshakeController = new xrtc.Class('HandshakeController');

	xrtc.HandshakeController.include(xrtc.EventDispatcher);
	xrtc.HandshakeController.include({
		init: function (peerConnection, name) {
			this._logger = new xrtc.Logger();
			this._socket = null;

			//this._channel = new exports.DataChannel(peerConnection, name);

			// this._channel.onopen = function (event) {
			// 	self.trigger(xrtc.HandshakeController.events.open, event);
			// };
			// this._channel.onmessage = function (event) {
			// 	self.trigger(xrtc.HandshakeController.events.message, event);
			// };
			// this._channel.onclose = function (event) {
			// 	self.trigger(xrtc.HandshakeController.events.close, event);
			// };
			// this._channel.onerror = function (event) {
			// 	self.trigger(xrtc.HandshakeController.events.error, event);
			// };
			// this._channel.ondatachannel = function () {
			// 	self.trigger(xrtc.HandshakeController.events.datachannel, event);
			// };
		},

		connect: function (token) {
			var self = this,
				events = xrtc.HandshakeController.events,
				url = xrtc.HandshakeController.settings.URL + escape(token);
			
			self._socket = new WebSocket(url);

			self._socket.onopen = function (evt) {
				var data = { event: evt };
				self._logger.debug('HandshakeController.open', data);
				self.trigger(events.connectionOpen, data);
			};

			self._socket.onmessage = function (msg) {
				var data = { event: msg };
				self._logger.debug('HandshakeController.message', data);
				self.trigger(events.message, msg);
				
				//todo: remove it
				if (msg.data === 'null') {
					return;
				}
				//todo: remove it

				var message = self._parseMessage(msg);
				self._logger.info('HandshakeController.message', msg, message);
				self.trigger(message.eventName, message.data);
			};

			self._socket.onclose = function (evt) {
				debugger;
				var data = { event: evt };
				self._logger.debug('HandshakeController.close', data);
				self.trigger(events.connectionClose, data);
			};

			self._socket.onerror = function (evt) {
				debugger;
				var data = { event: evt };
				self._logger.error('HandshakeController.error', data);
				self.trigger(events.connectionError, data);
			};
		},

		sendIce: function (receiverId, ice) {
			var data = {
				eventName: 'rtc_ice_candidate',
				TargetUserId: receiverId, // todo: make starts from small letter
				data: {
					receiverId: receiverId,
					iceCandidate: ice
				}
			};
			
			var request = JSON.stringify(data);
			this._logger.info('HandshakeController.sendIce', data, request);
			this.trigger(xrtc.HandshakeController.events.sendIce, data);
			this._socket.send(request);
		},

		sendOffer: function (receiverId, offer) {
			var data = {
				eventName: 'rtc_offer',
				TargetUserId: receiverId, // todo: make starts from small letter
				data: {
					receiverId: receiverId,
					sdp: offer
				}
			};

			var request = JSON.stringify(data);
			this._logger.info('HandshakeController.sendOffer', data, request);
			this.trigger(xrtc.HandshakeController.events.sendOffer, data);
			this._socket.send(request);
		},

		sendAnswer: function (receiverId, answer) {
			var data = {
				eventName: 'rtc_answer',
				TargetUserId: receiverId, // todo: make starts from small letter
				data: {
					receiverId: receiverId,
					sdp: answer
				}
			};

			var request = JSON.stringify(data);
			this._logger.info('HandshakeController.sendAnswer', data, request);
			this.trigger(xrtc.HandshakeController.events.sendAnswer, data);
			this._socket.send(request);
		},
		
		_parseMessage: function(msg) {
			var json = JSON.parse(msg.data), result;
			
			switch (json.Type) {
				case 'peers':
					result = {
						eventName: json.Type,
						data: {
							connections: JSON.parse(json.Message)
						}
					};
					break;
				case 'peer_connected':
					result = {
						eventName: json.Type,
						data: {
							paticipantId: json.Message
						}
					};
					break;
				case 'peer_removed':
					result = {
						eventName: json.Type,
						data: {
							paticipantId: json.Message
						}
					};
					break;
				default:
					this._logger.debug('HandshakeController._parseMessage', msg.data);
					result = JSON.parse(json.Message);
					break;
			}
			result.data.senderId = json.UserId;
			return { eventName: xrtc.HandshakeController.events[xrtc.HandshakeController.eventMapping[result.eventName]], data: result.data };
		}
	});

	xrtc.HandshakeController.extend({
		events: {
			connectionOpen: 'connectionopen',
			connectionClose: 'connectionclose',
			connectionError: 'connectionerror',
			
			message: 'message',
			connected: 'connected',
			
			participantsUpdated: 'participantsupdated',
			participantConnected: 'participantconnected',
			participantDisconnected: 'participantdisconnected',

			sendIce: 'sendIce',
			receiveIce: 'recieveice',
			
			sendOffer: 'sendOffer',
			receiveOffer: 'recieveoffer',
			
			sendAnswer: 'sendAnswer',
			receiveAnswer: 'recieveanswer'
		},
		
		eventMapping: {
			'peers': 'participantsUpdated',
			'peer_connected': 'participantConnected',
			'peer_removed': 'participantDisconnected',
			
			'rtc_offer': 'receiveOffer',
			'rtc_ice_candidate': 'receiveIce',
			'rtc_answer': 'receiveAnswer'
		},
		
		settings: {
			URL: 'ws://turn.influxis.com:8002/ws/'
		}
	});
})(window);