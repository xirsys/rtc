'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.HandshakeController = xrtc.Class('HandshakeController');

	xrtc.HandshakeController.include(xrtc.EventDispatcher);
	xrtc.HandshakeController.include({
		init: function () {
			this._logger = new xrtc.Logger(this.className);
			this._socket = null;
		},

		connect: function (token) {
			/// <summary>Connects with server</summary>
			/// <param name="token" type="string">Is used like unique name of user</param>
			
			var self = this,
				events = xrtc.HandshakeController.events,
				url = xrtc.HandshakeController.settings.URL + escape(token);

			self._socket = new WebSocket(url);

			self._socket.onopen = function (evt) {
				var data = { event: evt };
				self._logger.debug('open', data);
				self.trigger(events.connectionOpen, data);
			};

			self._socket.onmessage = function (msg) {
				var data = { event: msg };
				self._logger.debug('message', data);
				self.trigger(events.message, msg);

				var message = self._parseMessage(msg);
				self._logger.info('message', msg, message);
				if (message) {
					self.trigger(message.eventName, message.data);
				}
			};

			self._socket.onclose = function (evt) {
				var data = { event: evt };
				self._logger.debug('close', data);
				self.trigger(events.connectionClose, data);
			};

			self._socket.onerror = function (evt) {
				var data = { event: evt };
				self._logger.error('error', data);
				self.trigger(events.connectionError, data);
			};
		},

		disconnect: function () {
			/// <summary>Disconnects from server</summary>
			
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
						this._logger.debug('_parseMessage', msg.data);
						result = JSON.parse(json.Message);
						result.data.senderId = json.UserId;
						result.data.receiverId = json.TargetUserId;
						break;
				}
			}
			catch (e) {
				//todo: make generic error
				this._logger.error('_parseMessage', 'Message format error.', e, msg);
				self.trigger(events.messageFormatError, msg);
			}

			return result
				? { eventName: xrtc.HandshakeController.events[xrtc.HandshakeController.eventsMapping[result.eventName]], data: result.data }
				: null;
		},

		sendIce: function (targetUserId, iceCandidate) {
			/// <summary>Sends ICE servers to remote user</summary>
			/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
			/// <param name="iceCandidate" type="object">WebRTC internal object. Will be converted to JSON</param>
			
			var data = {
				eventName: xrtc.HandshakeController.events.receiveIce,
				targetUserId: targetUserId.toString(),
				data: { iceCandidate: iceCandidate }
			};

			this._send(data, xrtc.HandshakeController.events.sendIce);
		},

		sendOffer: function (targetUserId, offer) {
			/// <summary>Sends offer to remote user</summary>
			/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
			/// <param name="offer" type="object">WebRTC internal object. Will be converted to JSON</param>
			
			var data = {
				eventName: xrtc.HandshakeController.events.receiveOffer,
				targetUserId: targetUserId.toString(),
				data: { sdp: offer }
			};

			this._send(data, xrtc.HandshakeController.events.sendOffer);
		},

		sendAnswer: function (targetUserId, answer) {
			/// <summary>Sends answer to remote user</summary>
			/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
			/// <param name="answer" type="object">WebRTC internal object. Will be converted to JSON</param>
			
			var data = {
				eventName: xrtc.HandshakeController.events.receiveAnswer,
				targetUserId: targetUserId.toString(),
				data: { sdp: answer }
			};

			this._send(data, xrtc.HandshakeController.events.sendAnswer);
		},

		sendBye: function (targetUserId) {
			/// <summary>Sends disconnection message to remote user</summary>
			/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
			
			var data = {
				eventName: xrtc.HandshakeController.events.receiveBye,
				targetUserId: targetUserId.toString()
			};

			this._send(data, xrtc.HandshakeController.events.sendAnswer);
		},

		_send: function (data, event) {
			if (!this._socket) {
				this._logger.error(event, 'Trying to call method without established connection');
				throw {
					error: 'WebSocket is not connected!'
				};
			}

			var request = JSON.stringify(data);
			this._logger.debug('' + event, data, request);
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
			messageFormatError: 'messageformaterror',

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
			peers: 'participantsUpdated',
			peer_connected: 'participantConnected',
			peer_removed: 'participantDisconnected',

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