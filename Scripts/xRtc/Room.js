// #### Version 1.3.0 ####

// `xRtc.Room` is one of the main objects of **xRtc** library.

'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'Room', function Room(info, am, sc) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			hcEvents = xrtc.HandshakeController.events,
			scEvents = xrtc.ServerConnector.events,
			participants = [],
			isServerConnectorSubscribed = false,
			roomOptions = {},
			roomInfo = {},
			currentUserData = null,
			authManager = am || new xRtc.AuthManager(),
			serverConnector = sc || new xrtc.ServerConnector(),
			connections = [],
			handshakeControllers = {};

		// `roomInfo` initialization.
		xrtc.Class.extend(roomInfo, xrtc.Room.settings.info);
		if (typeof info === 'string') {
			roomInfo.name = info;
		} else {
			xrtc.Class.extend(roomInfo, info);
		}

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			// **[Public API]:** It is public method of `room` object. This method should be used for entering the room.
			enter: function (credentials, options) {
				var user = "", pass = "";

				if (!credentials) {
					throw new xrtc.CommonError('enter', 'User credentials should be specified.');
				}

				if (typeof credentials === 'string') {
					user = credentials;
				} else {
					user = credentials.username;
					pass = credentials.password;
				}

				subscribeToServerEvents.call(this);

				// `roomOptions` initialization.
				xrtc.Class.extend(roomOptions, xrtc.Room.settings.options);
				if (options) {
					xrtc.Class.extend(roomOptions, options);
				};

				// `userData` initialization.
				currentUserData = {
					domain: roomInfo.domain,
					application: roomInfo.application,
					room: roomInfo.name,
					name: user,
					password: pass
				};

				authManager.getToken(currentUserData, function (token) {
					roomInfo.user = user;
					serverConnector.connect(token);
				});
			},

			// **[Public API]:** It is public method of `room` object. This method should be used for leaving the room.
			leave: function () {
				serverConnector.disconnect();

				unsubscribeFromServerEvents.call(this);

				roomOptions = {};
				currentUserData = null;
				roomInfo.user = null;
				participants = [];

				// **Todo:** Maybe will be good to close all room connections. Need to discuss it with the team.
				connections = [],
				handshakeControllers = {};
			},

			// **[Public API]:** It is public method of `room` object. This method should be used for connection to someone from the current room.
			connect: function (userId, connectionOptions) {
				if (!roomInfo.user) {
					throw new xrtc.CommonError('connect', 'Need to enter the room before you connect someone.');
				}

				var connectionDataContainer = (connectionOptions && connectionOptions.data) ? connectionOptions.data : null;

				createConnection.call(this, currentUserData, userId, connectionDataContainer, function (connectionData) {
					var connection = connectionData.connection;

					if (connectionOptions && connectionOptions.createDataChannel === 'auto') {
						connection.createDataChannel('autoDataChannel');
					}

					connection._open(connectionOptions);
				});
			},

			// **[Public API]:** It is public method of `room` object. This method should be used for access room information.
			getInfo: function () {
				return roomInfo;
			},

			// **[Public API]:** It is public method of `room` object. Returns existed connections (`xRtc.Connection[]`) of the room.
			getConnections: function () {
				// Return the copy of internal array.
				return connections.map(function (connection) {
					return connection;
				});
			},

			// **[Public API]:** It is public method of `room` object. Returns array of participans from the current room.
			getParticipants: function () {
				//return the copy of array
				return participants.map(function (participant) {
					return participant;
				});
			}
		});

		function subscribeToServerEvents() {
			if (!isServerConnectorSubscribed) {
				serverConnector
					.on(scEvents.connectionOpen, proxy(function (event) { this.trigger(xrtc.Room.events.enter); }))
					.on(scEvents.connectionClose, proxy(function (event) { this.trigger(xrtc.Room.events.leave); }))
					.on(scEvents.tokenInvalid, proxy(function (event) { this.trigger(xrtc.Room.events.tokenInvalid); }))
					.on(scEvents.participantsUpdated, proxy(function (data) {
						participants = data.participants;
						sortParticipants();

						this.trigger(xrtc.Room.events.participantsUpdated, { participants: this.getParticipants() });
					}))
					.on(scEvents.participantConnected, proxy(function (data) {
						participants.push(data.participantId);
						sortParticipants();

						this.trigger(xrtc.Room.events.participantConnected, { participantId: data.participantId });
					}))
					.on(scEvents.participantDisconnected, proxy(function (data) {
						participants.splice(participants.indexOf(data.participantId), 1);
						sortParticipants();

						this.trigger(xrtc.Room.events.participantDisconnected, { participantId: data.participantId });
					}))
					.on(scEvents.receiveOffer, proxy(onIncomingConnection))
					// **Note:** everything works fine without sendbye functionality in case when connection was closed manually.
					// This functionality helps to detect 'close' action more quickly for Chrome because xRtc.Connection fires close event not immediately.
					.on(scEvents.receiveBye, proxy(onCloseConnection));

				isServerConnectorSubscribed = true;
			}
		}

		function unsubscribeFromServerEvents() {
			if (isServerConnectorSubscribed) {
				serverConnector
					.off(scEvents.participantsUpdated)
					.off(scEvents.participantConnected)
					.off(scEvents.participantDisconnected);

				// **Todo:** What about another events? (`connectionOpen`, `connectionClose`, `tokenInvalid`). Need to think about it later.

				isServerConnectorSubscribed = false;
			}
		}

		function sortParticipants() {
			participants.sort();
		}

		function getConnectionIndexById(connectionsArray, connectionId) {
			var resultIndex = null;
			for (var i = 0, len = connectionsArray.length; i < len; i++) {
				if (connectionsArray[i].getId() === connectionId) {
					resultIndex = i;
					break;
				}
			}

			return resultIndex;
		}

		function onIncomingConnection(data) {
			// Skip `offer` if it is not for me. It is temporary fix, because server shouldn't pass the `offer` to wrong target.
			// Sometimes it happened that the server had sent the `offer` to all/wrong participants. So we decided not touch this check.
			if (data.receiverId !== roomInfo.user) {
				return;
			}

			var self = this;

			var incomingConnectionData = {
				userId: data.senderId
			};

			if (!roomOptions.autoReply) {
				incomingConnectionData.data = data.connectionData;
				incomingConnectionData.accept = proxy(onAcceptCall);
				incomingConnectionData.decline = proxy(onDeclineCall);
			}

			this.trigger(xrtc.Room.events.incomingConnection, incomingConnectionData);

			if (roomOptions.autoReply) {
				onAcceptCall.call(self);
			}

			function onAcceptCall() {
				// **Todo:** Need to transfer remote connection data here.
				createConnection.call(self, currentUserData, data.senderId, data.connectionData, function (connectionData) {
					var offerData = {
						offer: data.offer,
						iceServers: data.iceServers,
						connectionType: data.connectionType,
						connectionId: data.connectionId,
						connectionData: data.connectionData
					};

					connectionData.handshakeController.trigger(hcEvents.receiveOffer, offerData);
				});
			}

			function onDeclineCall() {
				// **Note:** Need to think about declining reason.
				// **Todo:** Need to think about `bye` options definition and about senderId property name.
				serverConnector.sendBye(data.senderId, data.connectionId, null, { type: 'decline' });
			}
		}

		function onCloseConnection(data) {
			if (data.targetConnectionId) {
				var targetHc = handshakeControllers[data.targetConnectionId];
				if (targetHc) {
					if (data.options && data.options.type === 'decline') {
						// **Todo:** Think about sending decline reason.
						this.trigger(xrtc.Room.events.connectionDeclined, { userId: data.senderId, connectionId: data.connectionId });
					}

					// **Bug:** This actin should be executed only in case when `bye` was send from target user `(userid === connection.targetUser)`. As a result near handshake controller need to store userId also.
					targetHc.trigger(hcEvents.receiveBye);
				}

				// **Bug:** Close the connection in case when close command was received from target user of this connection.
				// Steps for reproduce:

				// 1.   Call to user;
				// 2.   Close created connection which was created for the user;
				// 3.   User accept incomin connection -> answer will be sent to me;
				// 4.   I received answer and send `bye` to the user, becuase my connection was closed already;
				// 5.   User receiving `bye` and doing nothing, but the connection should be closed.
				// **Note:** Do not forget about filtering close command by target user id.
			}
		}

		function createConnection(userData, targetUserId, connectionData, connectionCreated) {
			var self = this;
			var hc = new xrtc.HandshakeController();

			var connection = new xRtc.Connection(userData, targetUserId, hc, authManager, connectionData);
			var connectionId = connection.getId();

			handshakeControllers[connectionId] = hc;

			serverConnector.on(scEvents.receiveAnswer, function (data) {
				if (data.targetConnectionId) {
					var targetHc = handshakeControllers[data.targetConnectionId];
					if (targetHc) {
						targetHc.trigger(hcEvents.receiveAnswer, { connectionId: data.connectionId, answer: data.answer });
					} else {
						serverConnector.sendBye(data.senderId, data.connectionId, data.targetConnectionId);
					}
				}
			});

			serverConnector.on(scEvents.receiveIce, function (data) {
				if (data.targetConnectionId) {
					var targetHc = handshakeControllers[data.targetConnectionId];
					if (targetHc) {
						targetHc.trigger(hcEvents.receiveIce, { iceCandidate: data.iceCandidate });
					}
				}
			});

			hc.on(hcEvents.sendOffer, proxy(function (tUserId, tConnId, connId, sd) {
				serverConnector.sendOffer(tUserId, tConnId, connId, sd);
			}))
			.on(hcEvents.sendAnswer, proxy(function (tUserId, tConnId, connId, sd) {
				serverConnector.sendAnswer(tUserId, tConnId, connId, sd);
			}))
			.on(hcEvents.sendIce, proxy(function (tUserId, tConnId, connId, sd) {
				serverConnector.sendIce(tUserId, tConnId, connId, sd);
			}))
			.on(hcEvents.sendBye, proxy(function (tUserId, tConnId, connId) {
				serverConnector.sendBye(tUserId, tConnId, connId);
			}));

			connection.on(xrtc.Connection.events.connectionClosed, function () {
				connections.splice(getConnectionIndexById(connections, connectionId), 1);
				// todo: maybe need to unsubscribe this handshake controllers from all events
				delete handshakeControllers[connectionId];
			});

			connections.push(connection);

			self.trigger(xrtc.Room.events.connectionCreated, { userId: targetUserId, connection: connection });

			if (typeof connectionCreated === 'function') {
				connectionCreated({ connection: connection, handshakeController: hc });
			}
		}
	});

	// **Note:** Full list of events for the `xRtc.Room` object.
	xrtc.Room.extend({
		events: {
			enter: 'enter',
			leave: 'leave',

			incomingConnection: 'incomingconnection',
			connectionCreated: 'connectioncreated',
			connectionDeclined: 'connectiondeclined',

			participantsUpdated: 'participantsupdated',
			participantConnected: 'participantconnected',
			participantDisconnected: 'participantdisconnected',
			tokenInvalid: 'tokeninvalid'
		},

		settings: {
			info: {
				domain: exports.document.domain,
				application: 'default',
				name: 'default'
			},

			options: {
				autoReply: true
			}
		}
	});
})(window);