'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class2(xrtc, 'ServerConnector', function ServerConnector() {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			socket = null;

		xrtc.Class.extend(this, xrtc.EventDispatcher, xrtc.Ajax, {
			_logger: logger,

			connect: function (token) {
				/// <summary>Connects to WebSocket server</summary>
				getWebSocketUrl.call(this, proxy(connect, token));
			},

			disconnect: function () {
				/// <summary>Disconnects from server</summary>

				if (socket) {
					socket.close();
					socket = null;
					logger.info('disconnect', 'Connection with WS has been broken');
				} else {
					logger.debug('disconnect', 'Connection with WS has not been established yet');
				}
			},

			send: function (data) {
				/// <summary>Sends message to server</summary>

				if (!socket || socket.readyState === 3) {
					var error = new xrtc.CommonError('send', 'Trying to call method without established connection', 'WebSocket is not connected!');
					logger.error('send', error);

					throw error;
				}

				var request = JSON.stringify(data);
				logger.debug('send', data, request);
				socket.send(request);
			}
		});

		function getWebSocketUrl(callback) {
			this.ajax(xrtc.ServerConnector.settings.URL, 'POST', '', proxy(getWebSocketURLSuccess, callback));
		}

		function getWebSocketURLSuccess(response, callback) {
			try {
				response = JSON.parse(response);
				logger.debug('getWebSocketURL', response);

				if (!!response && !!response.E && response.E != '') {
					var error = new xrtc.CommonError('getWebSocketURL', 'Error occured while getting the URL of WebSockets', response.E);
					logger.error('getWebSocketURL', error);
					this.trigger(xrtc.ServerConnector.events.serverError, error);
				} else {
					var url = response.D.value;
					logger.info('getWebSocketURL', url);

					if (typeof (callback) === 'function') {
						callback(url);
					}
				}
			} catch (e) {
				getWebSocketUrl.call(this, callback);
			}
		}

		function connect(url, token) {
			// todo: remove "/ws/"
			socket = new WebSocket(url + '/ws/' + token);
			socket.onopen = proxy(socketOnOpen);
			socket.onclose = proxy(socketOnClose);
			socket.onerror = proxy(socketOnError);
			socket.onmessage = proxy(socketOnMessage);
		}

		function socketOnOpen(evt) {
			var data = { event: evt };
			logger.debug('open', data);
			this.trigger(xrtc.ServerConnector.events.connectionOpen, data);
		}

		function socketOnClose(evt) {
			var data = { event: evt };
			logger.debug('close', data);
			this.trigger(xrtc.ServerConnector.events.connectionClose, data);
		}

		function socketOnError(evt) {
			var error = new xrtc.CommonError('onerror', 'WebSocket has got an error', evt);
			logger.error('error', error);
			this.trigger(xrtc.ServerConnector.events.connectionError, error);
		}

		function socketOnMessage(msg) {
			var data = { event: msg };
			logger.debug('message', data);
			this.trigger(xrtc.ServerConnector.events.message, data);

			var message = parseMessage.call(this, msg);
			logger.info('message', msg, message);
			if (message) {
				this.trigger(message.eventName, message.data);
			}
		}

		function parseMessage(msg) {
			var json, result = null;
			try {
				json = JSON.parse(msg.data);

				switch (json.Type) {
					case 'peers':
						result = {
							eventName: json.Type,
							data: {
								senderId: json.UserId,
								room: json.Room,
								connections: JSON.parse(json.Message),
							}
						};
						break;
					case 'peer_connected':
					case 'peer_removed':
						result = {
							eventName: json.Type,
							data: {
								senderId: json.UserId,
								room: json.Room,
								paticipantId: json.Message,
							}
						};
						break;
					default:
						logger.debug('parseMessage', msg.data);
						result = JSON.parse(json.Message);
						if (!result.data) {
							result.data = {};
						}
						result.data.senderId = json.UserId;
						result.data.receiverId = json.TargetUserId;
						break;
				}
			} catch (e) {
				var error = new xrtc.CommonError('parseMessage', 'Message format error', e);
				logger.error('parseMessage', error, msg);

				this.trigger(xrtc.ServerConnector.events.messageFormatError, e);
			}

			return result;
		}
	});

	xrtc.ServerConnector.extend({
		events: {
			connectionOpen: 'connectionopen',
			connectionClose: 'connectionclose',
			connectionError: 'connectionerror',
			message: 'message',
			messageFormatError: 'messageformaterror',

			serverError: 'servererror'
		},

		settings: {
			URL: 'http://turn.influxis.com/ws'
		}
	});
})(window);