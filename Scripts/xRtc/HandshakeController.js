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
			this.proxy = xrtc.Class.proxy(this);
		},

		connect: function (token) {
			/// <summary>Connects with server</summary>
			/// <param name="token" type="string">Is used like unique name of user</param>

			this._getWebSocketURL(this.proxy(this._connect, token));
		},

		disconnect: function () {
			/// <summary>Disconnects from server</summary>

			if (this._socket) {
				this._socket.close();
				this._socket = null;
				this._logger.info('disconnect', 'Connection with WS has been broken');
			} else {
				this._logger.debug('disconnect', 'Connection with WS has not been established yet');
			}

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
			this._logger.debug(event, data, request);
			this.trigger(event, data);
			this._socket.send(request);
		},

		_getWebSocketURL: function (callback) {
			this.ajax(xrtc.HandshakeController.settings.URL, 'POST', '', this.proxy(this._getWebSocketURLSuccess, callback));
		},

		_getWebSocketURLSuccess: function (response, callback) {
			try {
				response = JSON.parse(response);
				this._logger.debug('_getWebSocketURL', response);

				if (!!response && !!response.E && response.E != '') {
					var error = new xrtc.CommonError('getWebSocketURL', 'Error occured while getting the URL of WebSockets', response.E);
					this._logger.error('_getWebSocketURL', error);
					this.trigger(xrtc.Connection.events.serverError, error);
				} else {
					var url = response.D.value;
					this._logger.info('_getWebSocketURL', url);

					if (typeof (callback) === 'function') {
						callback.call(this, url);
					}
				}
			} catch (e) {
				this._getWebSocketURL(callback);
			}
		},

		_connect: function (url, token) {
			// todo: remove "/ws/"
			this._socket = new WebSocket(url + '/ws/' + token);
			this._socket.onopen = this.proxy(this._socketOnOpen);
			this._socket.onclose = this.proxy(this._socketOnClose);
			this._socket.onerror = this.proxy(this._socketOnError);
			this._socket.onmessage = this.proxy(this._socketOnMessage);
		},

		_socketOnOpen: function (evt) {
			var data = { event: evt };
			this._logger.debug('open', data);
			this.trigger(xrtc.HandshakeController.events.connectionOpen, data);
		},

		_socketOnClose: function (evt) {
			var data = { event: evt };
			this._logger.debug('close', data);
			this.trigger(xrtc.HandshakeController.events.connectionClose, data);
		},

		_socketOnError: function (evt) {
			var error = new xrtc.CommonError('onerror', 'WebSocket has got an error', evt);
			this._logger.error('error', error);
			this.trigger(xrtc.HandshakeController.events.connectionError, error);
		},

		_socketOnMessage: function (msg) {
			var data = { event: msg };
			this._logger.debug('message', data);
			this.trigger(xrtc.HandshakeController.events.message, msg);

			var message = this._parseMessage(msg);
			this._logger.info('message', msg, message);
			if (message) {
				this.trigger(message.eventName, message.data);
			}
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