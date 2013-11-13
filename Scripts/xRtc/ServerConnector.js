// #### Version 1.4.0 ####

// XirSys (default) realization of connection manager.

// **Responsibility of this manager:**

// * Establish and handle server connection (For XirSys realization is WebSockets).
// * Implementation of the protocol to communicate with the server (For XirSys is custom protocol).

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.serverConnector');

goog.require('xRtc.baseClass');
goog.require('xRtc.eventDispatcher');
goog.require('xRtc.commonError');
goog.require('xRtc.ajax');
goog.require('xRtc.logger');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'ServerConnector', function ServerConnector(options) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			socket = null,
			currentToken = null,
			// Default ping interval is 5sec.
			pingInterval = options ? options.pingInterval : 5000,
			pingIntervalId = null,
			scEvents = xrtc.ServerConnector.events;

		xrtc.Class.extend(this, xrtc.EventDispatcher, xrtc.Ajax, {
			_logger: logger,

			// Connects to WebSocket server.
			connect: function (token) {
				currentToken = token;
				getWebSocketUrl.call(this, proxy(connect, token));
			},

			// Disconnects from server.
			disconnect: function () {
				if (socket) {
					socket.close();
					socket = null;
					currentToken = null;
					logger.info('disconnect', 'Connection with WS has been broken');
				} else {
					logger.debug('disconnect', 'Connection with WS has not been established yet');
				}
			},

			sendOffer: function (targetUserId, connectionId, offerData) {
				var request = {
					eventName: scEvents.receiveOffer,
					targetUserId: targetUserId,
					data: {
						connectionId: connectionId,
						offer: offerData || {}
					}
				};

				send(request);
			},

			sendAnswer: function (targetUserId, connectionId, answerData) {
				var request = {
					eventName: scEvents.receiveAnswer,
					targetUserId: targetUserId,
					data: {
						connectionId: connectionId,
						answer: answerData || {}
					}
				};

				send(request);
			},

			sendIce: function (targetUserId, connectionId, iceCandidate) {
				var request = {
					eventName: scEvents.receiveIce,
					targetUserId: targetUserId,
					data: {
						connectionId: connectionId,
						iceCandidate: iceCandidate
					}
				};

				send(request);
			},

			sendBye: function (targetUserId, connectionId, byeData) {
				var request = {
					eventName: scEvents.receiveBye,
					targetUserId: targetUserId,
					data: {
						connectionId: connectionId,
						byeData: byeData || {}
					}
				};

				send(request);
			}
		});

		// Sends message to server.
		function send(request) {
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
					this.trigger(scEvents.serverError, { error: error });
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
			// **Todo:** remove "/ws/"
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

			this.trigger(scEvents.connectionOpen, data);
		}

		function socketOnClose(evt) {
			if (pingIntervalId) {
				exports.clearInterval(pingIntervalId);
				pingIntervalId = null;
			}

			var data = { event: evt };
			logger.debug('close', data);
			this.trigger(scEvents.connectionClose, data);

			socket = null;
		}

		function socketOnError(evt) {
			var error = new xrtc.CommonError('onerror', 'WebSocket has got an error', evt);
			logger.error('error', error);
			this.trigger(scEvents.connectionError, { error: error });
		}

		function socketOnMessage(msg) {
			var data = { message: msg };
			logger.debug('message', data);
			this.trigger(scEvents.message, data);

			handleServerMessage.call(this, msg);
		}

		function validateServerMessage(msg) {
			var validationResult = true;
			if (msg.data === '"Token invalid"') {
				validationResult = false;
				this.trigger(scEvents.tokenInvalid, { token: currentToken });
			}

			return validationResult;
		}

		function parseServerMessage(msg) {
			var resultObject;

			try {
				resultObject = JSON.parse(msg.data);
			} catch (e) {
				resultObject = null;
				var error = new xrtc.CommonError('parseServerMessage', 'Message format error', e);
				logger.error('parseServerMessage', error, msg);

				this.trigger(scEvents.messageFormatError, { error: error });
			}

			return resultObject;
		}

		function handleRoomEvents(eventName, data) {
			if (eventName == scEvents.usersUpdated) {
				var users = [];
				for (var i = 0, len = data.message.users.length; i < len; i++) {
					users.push({ id: data.message.users[i], name: data.message.users[i] });
				}

				var usersData = {
					//senderId: data.userid,
					//room: data.room,
					users: users
				};
				this.trigger(scEvents.usersUpdated, usersData);
			}
			else if (eventName == scEvents.userConnected) {
				var connectedData = {
					//senderId: data.userid,
					//room: data.room,
					user: { id: data.message, name: data.message }
				};
				this.trigger(scEvents.userConnected, connectedData);
			}
			else if (eventName == scEvents.userDisconnected) {
				var disconnectedData = {
					//senderId: data.userid,
					//room: data.room,
					user: { id: data.message, name: data.message }
				};
				this.trigger(scEvents.userDisconnected, disconnectedData);
			}
		}

		function handleHandshakeEvents(eventName, data) {
			if (eventName == scEvents.receiveOffer) {
				var offerData = {
					senderId: data.userid,
					receiverId: data.message.targetUserId,
					connectionId: data.message.data.connectionId,
					offer: data.message.data.offer.offer,
					iceServers: data.message.data.offer.iceServers,
					connectionType: data.message.data.offer.connectionType,
					connectionData: data.message.data.offer.connectionData
					/*targetConnectionId: data.message.data.targetConnectionId*/
				};

				this.trigger(scEvents.receiveOffer, offerData);
			}
			else if (eventName == scEvents.receiveAnswer) {
				var answerData = {
					senderId: data.userid,
					/*receiverId: data.message.targetUserId,*/
					connectionId: data.message.data.connectionId,
					answer: data.message.data.answer.answer,
					acceptData: data.message.data.answer.acceptData
				};

				this.trigger(scEvents.receiveAnswer, answerData);
			}
			else if (eventName == scEvents.receiveIce) {
				var iceData = {
					senderId: data.userid,
					/*receiverId: data.message.targetUserId,*/
					connectionId: data.message.data.connectionId,
					iceCandidate: data.message.data.iceCandidate
				};

				this.trigger(scEvents.receiveIce, iceData);
			}
			else if (eventName == scEvents.receiveBye) {
				var byeData = {
					senderId: data.userid,
					/*receiverId: data.message.targetUserId,*/
					connectionId: data.message.data.connectionId,
					byeData: data.message.data.byeData
				};

				this.trigger(scEvents.receiveBye, byeData);
			}
		}

		function handleServerMessage(msg) {
			if (validateServerMessage(msg)) {
				var data = parseServerMessage(msg);
				var eventName = data.type;
				if (eventName == scEvents.usersUpdated ||
					eventName == scEvents.userConnected ||
					eventName == scEvents.userDisconnected) {
					handleRoomEvents.call(this, eventName, data);
				} else if (eventName == scEvents.receiveOffer ||
					eventName == scEvents.receiveAnswer ||
					eventName == scEvents.receiveIce ||
					eventName == scEvents.receiveBye) {
					handleHandshakeEvents.call(this, eventName, data);
				}
			}
		}

		function formatRequest(request) {
			var result = {
				eventName: request.eventName
			};

			if (typeof request.data !== 'undefined') {
				result.data = request.data;
			}

			if (typeof request.targetUserId !== 'undefined') {
				// We call `toString` because `targetUserId` can be a number, and server cannot resolve it.
				result.targetUserId = request.targetUserId.toString();
			}

			return result;
		}

		function pingServer(interval) {
			return exports.setInterval(function () {
				// Ping request is empty message.
				var pingRequest = {};
				send.call(this, pingRequest);
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

			/* Server generated events */
			usersUpdated: 'peers',
			userConnected: 'peer_connected',
			userDisconnected: 'peer_removed'
		},

		settings: {
			URL: 'https://beta.xirsys.com/wsList'
		}
	});
})(window);
