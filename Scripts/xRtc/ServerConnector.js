'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'ServerConnector', function ServerConnector(options) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			socket = null,
			currentToken = null,
			//default ping interval is 5sec
			pingInterval = options ? options.pingInterval : 5000,
			pingIntervalId = null;

		xrtc.Class.extend(this, xrtc.EventDispatcher, xrtc.Ajax, {
			_logger: logger,

			connect: function (token) {
				/// <summary>Connects to WebSocket server</summary>

				currentToken = token;
				getWebSocketUrl.call(this, proxy(connect, token));
			},

			disconnect: function () {
				/// <summary>Disconnects from server</summary>

				if (socket) {
					socket.close();
					socket = null;
					currentToken = null;
					logger.info('disconnect', 'Connection with WS has been broken');
				} else {
					logger.debug('disconnect', 'Connection with WS has not been established yet');
				}
			},

			sendOffer: function (targetUserId, targetConnectionId, offer) {
				var request = {
					eventName: xrtc.ServerConnector.events.receiveOffer,
					targetUserId: targetUserId,
					data: {
						connectionId: targetConnectionId,
						offer: offer
					}
				};

				send(request);
			},

			sendAnswer: function (targetUserId, targetConnectionId, answer)
			{
				var request = {
					eventName: xrtc.ServerConnector.events.receiveAnswer,
					targetUserId: targetUserId,
					data: {
						connectionId: targetConnectionId,
						answer: answer
					}
				};

				send(request);
			},

			sendIce: function (targetUserId, targetConnectionId, iceCandidate)
			{
				var request = {
					eventName: xrtc.ServerConnector.events.receiveIce,
					targetUserId: targetUserId,
					data: {
						connectionId: targetConnectionId,
						iceCandidate: iceCandidate
					}
				};

				send(request);
			},

			sendBye: function (targetUserId, targetConnectionId, byeOptions) {
				var request = {
					eventName: xrtc.ServerConnector.events.receiveBye,
					targetUserId: targetUserId,
					data: { connectionId: data.connectionId }
				};

				if (options) {
					request.data.options = byeOptions;
				}

				send(request);
			}
		});

		function send(request) {
			/// <summary>Sends message to server</summary>

			if (!socket) {
				var error = new xrtc.CommonError('send', 'Trying to call method without established connection', 'WebSocket is not connected!');
				logger.error('send', error);

				throw error;
			}

			var requestObject = formatRequest.call(this, request);
			var requestJson = JSON.stringify(requestObject);

			logger.debug('send', requestObject, requestJson);
			socket.send(requestJson);
		}

		function getWebSocketUrl(callback) {
			this.ajax(xrtc.ServerConnector.settings.URL, 'POST', '', proxy(getWebSocketUrlSuccess, callback));
		}

		function getWebSocketUrlSuccess(response, callback) {
			try {
				response = JSON.parse(response);
				logger.debug('getWebSocketURL', response);

				if (!!response && !!response.e && response.e != '') {
					var error = new xrtc.CommonError('getWebSocketURL', 'Error occured while getting the URL of WebSockets', response.e);
					logger.error('getWebSocketURL', error);
					this.trigger(xrtc.ServerConnector.events.serverError, error);
				} else {
					var url = response.d.value;
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
			socket = new WebSocket(url + '/ws/' + encodeURIComponent(token));
			socket.onopen = proxy(socketOnOpen);
			socket.onclose = proxy(socketOnClose);
			socket.onerror = proxy(socketOnError);
			socket.onmessage = proxy(socketOnMessage);
		}

		function socketOnOpen(evt) {
			var data = { event: evt };
			logger.debug('open', data);

			if (pingInterval) {
				pingIntervalId = pingServer.call(this, pingInterval);
			}

			this.trigger(xrtc.ServerConnector.events.connectionOpen, data);
		}

		function socketOnClose(evt) {
			if (pingIntervalId) {
				exports.clearInterval(pingIntervalId);
				pingIntervalId = null;
			}

			var data = { event: evt };
			logger.debug('close', data);
			this.trigger(xrtc.ServerConnector.events.connectionClose, data);

			socket = null;
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
			if (msg.data === '"Token invalid"') {
				result = {
					//todo: will be better to rename this event to tokenInvalid
					eventName: xrtc.ServerConnector.events.tokenInvalid,
					data: {
						token: currentToken
					}
				};
			} else {
				try {
					json = JSON.parse(msg.data);
					switch (json.type) {
						case 'peers':
							result = {
								eventName: json.type,
								data: {
									senderId: json.userid,
									room: json.room,
									connections: json.message.users,
								}
							};
							break;
						case 'peer_connected':
						case 'peer_removed':
							result = {
								eventName: json.type,
								data: {
									senderId: json.userid,
									room: json.room,
									participantId: json.message,
								}
							};
							break;
						default:
							logger.debug('parseMessage', msg.data);
							result = json.message;
							if (!result.data) {
								result.data = {};
							}
							result.data.senderId = json.userid;
							result.data.receiverId = result.targetUserId;
							break;
					}
				} catch (e) {
					var error = new xrtc.CommonError('parseMessage', 'Message format error', e);
					logger.error('parseMessage', error, msg);

					this.trigger(xrtc.ServerConnector.events.messageFormatError, error);
				}
			}

			return result;
		}

		function formatRequest(request) {
			var result = {
				eventName: request.eventName
			};

			if (typeof request.data !== 'undefined') {
				result.data = request.data;
			}

			if (typeof request.targetUserId !== 'undefined') {
				// we call 'toString' because 'targetUserId' can be a number, and server cannot resolve it
				result.targetUserId = request.targetUserId.toString();
			}

			return result;
		}

		function pingServer(interval) {
			var self = this;

			return exports.setInterval(function () {
					// ping request is empty message
					var pingRequest = {};
					self.send.call(this, pingRequest);
				},
			interval);
		}
	});

	xrtc.ServerConnector.extend({
		events: {
			connectionOpen: 'connectionopen',
			connectionClose: 'connectionclose',
			connectionError: 'connectionerror',
			message: 'message',
			messageFormatError: 'messageformaterror',

			serverError: 'servererror',
			tokenInvalid: 'tokeninvalid',

			receiveOffer: 'receiveoffer',
			receiveAnswer: 'receiveanswer',
			receiveIce: 'receiveice',
			receiveBye: 'receivebye',

			/* Server events */
			participantsUpdated: 'peers',
			participantConnected: 'peer_connected',
			participantDisconnected: 'peer_removed'
		},

		settings: {
			URL: 'http://beta.xirsys.com/wsList'
		}
	});
})(window);
