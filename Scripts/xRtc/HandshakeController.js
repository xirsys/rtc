'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.HandshakeController = new xrtc.Class('HandshakeController');

	xrtc.HandshakeController.include(xrtc.EventDispatcher);
	xrtc.HandshakeController.include({
		init: function () {
			this._logger = new xrtc.Logger();
			this._socket = null;
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
					self._logger.error('HandshakeController.message', '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
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
		
		disconnect: function () {
			// todo: check
			this._socket.close();
			this._socket = null;
		},

		_parseMessage: function (msg) {
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
			
			this._send(data, xrtc.HandshakeController.events.sendIce);
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

			this._send(data, xrtc.HandshakeController.events.sendOffer);
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
			
			this._send(data, xrtc.HandshakeController.events.sendAnswer);
		},

		_send: function (data, event) {
			if (!this._socket) {
				this._logger.error('HandshakeController.' + event, 'Trying to call method without established connection');
				throw {
					error: 'WebSocket is not connected!'
				};
			}

			var request = JSON.stringify(data);
			this._logger.debug('HandshakeController.' + event, data, request);
			this.trigger(event, data);
			this._socket.send(request);
		}
	});

	xrtc.HandshakeController.extend({
		events: {
			connectionOpen: 'connectionopen',
			connectionClose: 'connectionclose',
			connectionError: 'connectionerror',
			
			message: 'message',
			
			participantsUpdated: 'participantsupdated',
			participantConnected: 'participantconnected',
			participantDisconnected: 'participantdisconnected',

			sendIce: 'sendice',
			receiveIce: 'receiveice',
			
			sendOffer: 'sendoffer',
			receiveOffer: 'receiveoffer',
			
			sendAnswer: 'sendanswer',
			receiveAnswer: 'receiveanswer'
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