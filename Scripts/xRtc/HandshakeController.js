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
				if (message) {
					self.trigger(message.eventName, message.data);
				}
			};

			self._socket.onclose = function (evt) {
				var data = { event: evt };
				self._logger.debug('HandshakeController.close', data);
				self.trigger(events.connectionClose, data);
			};

			self._socket.onerror = function (evt) {
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
			var json, result;
			try {
				json = JSON.parse(msg.data);

				switch (json.Type) {
					case 'peers':
						result = {
							eventName: json.Type,
							data: {
								connections: JSON.parse(json.Message),
								senderId: json.UserId
							}
						};
						break;
					case 'peer_connected':
					case 'peer_removed':
						result = {
							eventName: json.Type,
							data: {
								paticipantId: json.Message,
								senderId: json.UserId
							}
						};
						break;
					default:
						this._logger.debug('HandshakeController._parseMessage', msg.data);
						result = JSON.parse(json.Message);
						result.data.senderId = json.UserId;
						break;
				}
			}
			catch (e) {
				this._logger.error('Message format error.', e, msg);
				self.trigger(events.messageFormatError, msg);
			}

			return result
				? { eventName: xrtc.HandshakeController.events[xrtc.HandshakeController.eventsMapping[result.eventName]], data: result.data }
				: null;
		},

		sendIce: function (targetUserId, iceCandidate) {
			var data = {
				eventName: xrtc.HandshakeController.events.receiveIce,
				targetUserId: targetUserId.toString(),
				data: { receiverId: targetUserId.toString(), iceCandidate: iceCandidate }
			};

			this._send(data, xrtc.HandshakeController.events.sendIce);
		},

		sendOffer: function (targetUserId, offer) {
			var data = {
				eventName: xrtc.HandshakeController.events.receiveOffer,
				targetUserId: targetUserId.toString(),
				data: { receiverId: targetUserId.toString(), sdp: offer }
			};

			this._send(data, xrtc.HandshakeController.events.sendOffer);
		},

		sendAnswer: function (targetUserId, answer) {
			var data = {
				eventName: xrtc.HandshakeController.events.receiveAnswer,
				targetUserId: targetUserId.toString(),
				data: { receiverId: targetUserId.toString(), sdp: answer }
			};

			this._send(data, xrtc.HandshakeController.events.sendAnswer);
		},

		sendBye: function (targetUserId) {
			var data = {
				eventName: xrtc.HandshakeController.events.receiveBye,
				targetUserId: targetUserId.toString(),
				data: { receiverId: targetUserId.toString() }
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

			messageFormatError: 'messageFormatError',

			message: 'message',

			participantsUpdated: 'participantsupdated',
			participantConnected: 'participantconnected',
			participantDisconnected: 'participantdisconnected',

			sendIce: 'sendice',
			receiveIce: 'receiveice',

			sendOffer: 'sendoffer',
			receiveOffer: 'receiveoffer',

			sendAnswer: 'sendanswer',
			receiveAnswer: 'receiveanswer',

			sendBye: 'sendbye',
			receiveBye: 'receivebye'
		},

		eventsMapping: {
			'peers': 'participantsUpdated',
			'peer_connected': 'participantConnected',
			'peer_removed': 'participantDisconnected',

			receiveice: 'receiveIce',
			receiveoffer: 'receiveOffer',
			receiveanswer: 'receiveAnswer',
			receivebye: 'receiveBye'
		},

		settings: {
			URL: 'ws://turn.influxis.com:8002/ws/'
		}
	});
})(window);