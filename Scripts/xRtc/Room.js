// #### Version 1.3.0 ####

// `xRtc.Room` is one of the main objects of **xRtc** library.

'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	// **[Public API]:** `xRtc.Room` object has public constructor `xRtc.Room(info, am, sc)`. This constructor can take 3 parameters:

	// 1. `info: object | string`. It is optional parameter.
	// If parameter is `string` then it is name of a room that already exists on the server.
	// If parameter is `object` then it should have following format `{ domain: string, application: string, name: string }` (all fields are optional),
	// where `domain` is application domain, `application` is app name, `name` is room name.
	// 2. `am: xRtc.AuthManager`. It is optional parameter.
	// If this parameter is not specified, the default realization of `xrtc.AuthManager` will be used.
	// You may need this option if you use own server side or you want to subscribe to some events of `xrtc.AuthManager`.
	// 3. `sc: xrtc.ServerConnector`. It is optional parameter.
	// If this parameter is not specified, the default realization of `xrtc.ServerConnector` will be used.
	// You may need this option if you use own server side or you want to subscribe to some events of `xrtc.ServerConnector`.
	
	// If any of these cases, `domain, application, name` values are not specified then values will
	// be initializaed using default values(these values can be overwritten):

	// * `xRtc.Room.settings.info.domain`. It is domain which was returned by browser.
	// * `xRtc.Room.settings.info.application`. It is "default".
	// * `xRtc.Room.settings.info.name`. It is "default".

	// **Note:** Mentioned values are accessible after room creation. You can get it using following code: `var roomInfo = room.getInfo();`.
	// Additionaly `roomInfo` will be contain information about current user `roomInfo.user` (`string` for xRtc 1.3.0.0).

	// **Simple examples of room creation:**

	// * `var room = new xRtc.Room();`
	// * `var room = new xRtc.Room("my test room");`
	// * `var room = new xRtc.Room("my test room", new xRtc.AuthManager(), new xrtc.ServerConnector());`
	// * `var room = new xRtc.Room("my test room", new customAuthManager(), new customServerConnector());`
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

			// **[Public API]:** `enter(credentials, options)` is public method of `room` object. This method should be used for entering the room.
			// After entering the room, the connection to the server is established,
			// the `room` object will be synchronized to the room on the server and all the events on the server
			// will cause appropriate events for the `room`.
			// This method has following arguments:

			// 1. `credentials: object | string`. It is required parameter. If this parameter is `object` then it should have following format:
			// `{ username : string, password: string }`, where `username` is the name of the current user(who entering the room),
			// `password` is password of the current user.
			// If this parameter is `string` then it is the name of the current user.
			// 2. `options : object`. It is optional parameter. This parameter should have following format: `{ autoReply: bool }`
			// (field is optional),
			// where `autoReply` is flag which mean all incoming call will be accepted automatically or not. Default value can be overwritten here
			// `xRtc.Room.settings.option.autoReply` and equals `true`.

			// **Note:** After entering the room current user information will be accessible using following code:
			// `var currentUser = room.getInfo().user;` (For xRtc 1.3.0 `currentUser` is `string`).

			// **Simple examples:**

			// * `room.enter("John Doe");`
			// * `room.enter("John Doe", { autoReply: false });`
			// * `room.enter({ username: "John Doe", password: "password" });`
			// * `room.enter({ username: "John Doe", password: "password" }, { autoReply: false });`
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
				xrtc.Class.extend(roomOptions, xrtc.Room.settings.enterOptions);
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

			// **[Public API]:** `leave()` is public method of `room` object. This method should be used for leaving the room.

			// **Simple examples:**

			// * `room.leave();`
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

			// **[Public API]:** `connect(userId, connectionOptions)` is public method of `room` object. This method should be used for connection to someone from the current room
			
			// **Note:** After entering a room will be generated `participantsupdated` event which contains user ids (names for xRtc 1.3.0)
			// which can be used for the method
			
			// **Note:** `getParticipants()` also returns array of users in the room (user ids | user names for the xRtc 1.3.0).

			// The method takes following parameters:

			// * `userId: string`. It is required parameter.
			// This specified target user id (user name for xRtc 1.3.0.0) to which we want to connect (establish p2p connection).
			// * `connectionOptions: object`. It is optional parameter. This parameter should have following format:
			// `{ data: object, createDataChannel: string }`. Where `data` is any user data which should be associated with created `connection`.
			// E.g. this `data` can be used for identifying the connection because there may be many connections and they are asynchronous.
			// Beside this `data` can be used as storage for any informationhe which developer wants to keep it here and this object is accessible
			// for the remote side on `incomingconnection` event (behind the scene object will be serialized
			// to JSON and transferred to remote side using server connection).
			// `createDataChannel` is special flag which should be used if you want to create `xRtc.DataChannel` with minimum code. If this flag equals `"auto"` then
			// on `the xRtc.Connection` **one** data channel with name `"autoDataChannel"` will be created automatically.

			// **Note:** For xRtc 1.3.0 `userId` and `userName` are identical.

			// **Simple examples:**

			// * `room.connect("My friend name");`
			// * `room.connect("My friend name", { data: "Hello World!" });`
			// * `room.connect("My friend name", { data: { customField: "Hello World!" } });`
			// * `room.connect("My friend name", { data: "Hello World!", createDataChannel : "auto" });`
			// * `room.connect("My friend name", { createDataChannel : "auto" });`
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

			// **[Public API]:** `getInfo()` is public method of `room` object. This method should be used for access room information.
			// The method returns information about room (domain, application, room name) and current user (name for xRtc 1.3.0).
			// The returned object has following format: `{ domain: string, application: string, name: string, user: string }`, where:

			// * `domain`. The value which was defined during room creation.
			// * `application`. The value which was defined during room creation.
			// * `name`. Name of the room which was defined during room creation.
			// * `user`. Current user (`string` for xRtc 1.3.0) which was initialized after entering the room.
			// This value will be cleared (`null`) after leaving the room.

			// **Simple example:**

			// * `var roomInfo = room.getInfo(); var domain = roomInfo.domain; var application = roomInfo.application;
			// var roomName = roomInfo.name; var currentUser = roomInfo.user;`

			getInfo: function () {
				return roomInfo;
			},

			// **[Public API]:** `getConnections()` is public method of `room` object. Returns existed connections (`xRtc.Connection[]`) of the room
			// which have not been closed yet.
			getConnections: function () {
				// Return the copy of internal array.
				return connections.map(function (connection) {
					return connection;
				});
			},

			// **[Public API]:** `getParticipants()` is public method of `room` object. Returns array of participans from the current room.

			// **Note:** array of strings for xRtc 1.3.0 where each `string` is `userId` (`userName`).
			getParticipants: function () {
				// Return the copy of internal array.
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
					// This functionality helps to detect 'close' action more quickly for *Chrome* because 'xRtc.Connection' fires 'connectionclosed' event not immediately.
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
				// **Todo:** Maybe need to unsubscribe this handshake controllers from all events.
				delete handshakeControllers[connectionId];
			});

			connections.push(connection);

			self.trigger(xrtc.Room.events.connectionCreated, { userId: targetUserId, connection: connection });

			if (typeof connectionCreated === 'function') {
				connectionCreated({ connection: connection, handshakeController: hc });
			}
		}
	});

	xrtc.Room.extend({
		// **Note:** Full list of events for the `xRtc.Room` object.
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
			// **Note:** Default information values for the `xRtc.Room` object.
			info: {
				domain: exports.document.domain,
				application: 'default',
				name: 'default'
			},

			// **Note:** Default options which used for the `enter(credentials, options)`
			// method of `xRtc.Room` object if some options not specified.
			enterOptions: {
				autoReply: true
			}
		}
	});
})(window);