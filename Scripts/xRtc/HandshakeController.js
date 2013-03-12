'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.HandshakeController = xrtc.Class('HandshakeController');

	xrtc.HandshakeController.include(xrtc.EventDispatcher);
	xrtc.HandshakeController.include(xrtc.Ajax);
	xrtc.HandshakeController.include({
		init: function () {
			this._logger = new xrtc.Logger(this.className);
			this._socket = null;
		},

		connect: function (token) {
			/// <summary>Connects with server</summary>
			/// <param name="token" type="string">Is used like unique name of user</param>

			var self = this,
				events = xrtc.HandshakeController.events;

			this._getWebSocketURL(function (url) {
				// todo: possible remove "/ws/"
				var wsurl = url + '/ws/' + token;

				self._socket = new WebSocket(wsurl);

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
					var error = new xrtc.CommonError('onerror', 'WebSocket has got an error', evt);
					self._logger.error('error', error);
					self.trigger(events.connectionError, error);
				};
			});
		},

		disconnect: function () {
			/// <summary>Disconnects from server</summary>

			this._socket.close();
			this._socket = null;
		},

		_getWebSocketURL: function (callback) {
			var self = this;

			this.ajax(
				xrtc.HandshakeController.settings.URL,
				'POST',
				'',
				function (response) {
					try {
						response = JSON.parse(response);
						self._logger.debug('_getWebSocketURL', response);

						if (!!response && !!response.E && response.E != '') {
							var error = new xrtc.CommonError('getWebSocketURL', 'Error occured while getting the URL of WebSockets', response.E);
							self._logger.error('_getWebSocketURL', error);
							self.trigger(xrtc.Connection.events.serverError, error);
							return;
						}

						var url = response.D.value;

						self._logger.info('_getWebSocketURL', url);

						if (typeof (callback) === 'function') {
							callback.call(self, url);
						}

					} catch (e) {
						self._getWebSocketURL(callback);
					}
				}
			);
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
				var error = new xrtc.CommonError('_parseMessage', 'Message format error', e);
				this._logger.error('_parseMessage', error, msg);
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
				var error = new xrtc.CommonError(event, 'Trying to call method without established connection', 'WebSocket is not connected!');
				this._logger.error(event, error);
				throw error;
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
			URL: 'http://turn.influxis.com/ws'
		}
	});
})(window);