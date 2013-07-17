﻿'use strict';

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

			sendOffer: function (targetUserId, targetConnectionId, connectionId, offer) {
				var request = {
					eventName: xrtc.ServerConnector.events.receiveOffer,
					targetUserId: targetUserId,
					data: {
						targetConnectionId: targetConnectionId,
						connectionId: connectionId,
						offer: offer
					}
				};

				send(request);
			},

			sendAnswer: function (targetUserId, targetConnectionId, connectionId, answer) {
				var request = {
					eventName: xrtc.ServerConnector.events.receiveAnswer,
					targetUserId: targetUserId,
					data: {
						targetConnectionId: targetConnectionId,
						connectionId: connectionId,
						answer: answer
					}
				};

				send(request);
			},

			sendIce: function (targetUserId, targetConnectionId, connectionId, iceCandidate) {
				var request = {
					eventName: xrtc.ServerConnector.events.receiveIce,
					targetUserId: targetUserId,
					data: {
						targetConnectionId: targetConnectionId,
						connectionId: connectionId,
						iceCandidate: iceCandidate
					}
				};

				send(request);
			},

			sendBye: function (targetUserId, targetConnectionId, connectionId, byeOptions) {
				var request = {
					eventName: xrtc.ServerConnector.events.receiveBye,
					targetUserId: targetUserId,
					data: {
						targetConnectionId: targetConnectionId,
						connectionId: connectionId
					}
				};

				if (byeOptions) {
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
			var data = { message: msg };
			logger.debug('message', data);
			this.trigger(xrtc.ServerConnector.events.message, data);

			handleServerMessage.call(this, msg);
		}

		function validateServerMessage(msg) {
			var validationResult = true;
			if (msg.data === '"Token invalid"') {
				validationResult = false;
				this.trigger(xrtc.ServerConnector.events.tokenInvalid, { token: currentToken });
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

				this.trigger(xrtc.ServerConnector.events.messageFormatError, error);
			}

			return resultObject;
		}

		function handleServerMessage(msg) {
			if (validateServerMessage(msg)) {
				var data = parseServerMessage(msg);
				if (data.type == xrtc.ServerConnector.events.participantsUpdated) {
					var participantsData = {
						senderId: data.userid,
						room: data.room,
						connections: data.message.users,
					};
					this.trigger(xrtc.ServerConnector.events.participantsUpdated, participantsData);
				}
				else if (data.type == xrtc.ServerConnector.events.participantConnected) {
					var connectedData = {
						senderId: data.userid,
						room: data.room,
						participantId: data.message,
					};
					this.trigger(xrtc.ServerConnector.events.participantConnected, connectedData);
				}
				else if (data.type == xrtc.ServerConnector.events.participantDisconnected) {
					var disconnectedData = {
						senderId: data.userid,
						room: data.room,
						participantId: data.message,
					};
					this.trigger(xrtc.ServerConnector.events.participantDisconnected, disconnectedData);
				}
				else if (data.type == xrtc.ServerConnector.events.receiveOffer) {
					var offerData = {
						senderId: data.userid,
						receiverId: data.message.targetUserId,
						connectionId: data.message.data.connectionId,
						offer: {
							offer: data.message.data.offer.offer,
							iceServers: data.message.data.offer.iceServers,
							connectionType: data.message.data.offer.connectionType
						},
						targetConnectionId: data.message.data.targetConnectionId
					};

					this.trigger(xrtc.ServerConnector.events.receiveOffer, offerData);
				}
				else if (data.type == xrtc.ServerConnector.events.receiveAnswer) {
					var answerData = {
						senderId: data.userid,
						receiverId: data.message.targetUserId,
						connectionId: data.message.data.connectionId,
						answer: {
							answer: data.message.data.answer.answer
						},
						targetConnectionId: data.message.data.targetConnectionId
					};

					this.trigger(xrtc.ServerConnector.events.receiveAnswer, answerData);
				}
				else if (data.type == xrtc.ServerConnector.events.receiveIce) {
					var iceData = {
						senderId: data.userid,
						receiverId: data.message.targetUserId,
						connectionId: data.message.data.connectionId,
						iceCandidate: data.message.data.iceCandidate,
						targetConnectionId: data.message.data.targetConnectionId
					};

					this.trigger(xrtc.ServerConnector.events.receiveIce, iceData);
				}
				else if (data.type == xrtc.ServerConnector.events.receiveBye) {
					var byeData = {
						senderId: data.userid,
						receiverId: data.message.targetUserId,
						connectionId: data.message.data.connectionId,
						targetConnectionId: data.message.data.targetConnectionId
					};

					if (data.message.data.options && data.message.data.options.type) {
						byeData.options = { type: data.message.data.options.type };
					}

					this.trigger(xrtc.ServerConnector.events.receiveBye, byeData);
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
				// we call 'toString' because 'targetUserId' can be a number, and server cannot resolve it
				result.targetUserId = request.targetUserId.toString();
			}

			return result;
		}

		function pingServer(interval) {
			return exports.setInterval(function () {
				// ping request is empty message
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
