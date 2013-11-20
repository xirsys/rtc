// #### Version 1.4.0 ####

// `xRtc.Room` is one of the main objects of **xRtc** library.

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.room');

goog.require('xRtc.baseClass');
goog.require('xRtc.eventDispatcher');
goog.require('xRtc.logger');
goog.require('xRtc.common');
goog.require('xRtc.commonError');
goog.require('xRtc.handshakeController');
goog.require('xRtc.connection');
goog.require('xRtc.authManager');
goog.require('xRtc.serverConnector');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

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
	// Additionaly `roomInfo` will be contain information about current user `roomInfo.user`.

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
			users = [],
			isServerConnectorSubscribed = false,
			roomOptions = {},
			roomInfo = {},
			currentUserData = null,
			authManager = am || new xRtc.AuthManager(),
			serverConnector = sc || new xrtc.ServerConnector(),
			connections = [],
			handshakeControllerObjects = {},
			byeTypes = {
				decline : 'decline'
			};

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
			// `var currentUser = room.getInfo().user;`.

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
					roomInfo.user = { id: null, name: user };
					serverConnector.connect(token);
				});
			},

			// **[Public API]:** `leave()` is public method of `room` object. This method should be used for leaving the room.

			// **Simple examples:**

			// * `room.leave();`
			leave: function () {
				serverConnector.on(xrtc.ServerConnector.events.connectionClose, function () {
					unsubscribeFromServerEvents.call(this);

					roomOptions = {};
					currentUserData = null;
					roomInfo.user = null;
					users = [];

					// **Todo:** Maybe will be good to close all room connections. Need to discuss it with the team.
					connections = [],
					handshakeControllerObjects = {};
				});

				serverConnector.disconnect();
			},

			// **[Public API]:** `connect(targetUserId, connectionOptions)` is public method of `room` object. This method should be used for connection to someone from the current room

			// **Note:** After entering a room will be generated `usersupdated` event which contains users ids
			// which can be used for the method

			// **Note:** `getUsers()` also returns array of users in the room.

			// The method takes following parameters:

			// * `targetUserId: string`. It is required parameter.
			// This specified `targetUserId` to which we want to connect (establish p2p connection).
			// * `connectionOptions: object`. It is optional parameter. This parameter should have following format:
			// `{ data: object, createDataChannel: string }`. Where `data` is any user data which should be associated with created `connection`.
			// E.g. this `data` can be used for identifying the connection because there may be many connections and they are asynchronous.
			// Beside this `data` can be used as storage for any informationhe which developer wants to keep it here and this object is accessible
			// for the remote side on `incomingconnection` event (behind the scene object will be serialized
			// to JSON and transferred to remote side using server connection).
			// `createDataChannel` is special flag which should be used if you want to create `xRtc.DataChannel` with minimum code. If this flag equals `"auto"` then
			// on `the xRtc.Connection` **one** data channel with name `"autoDataChannel"` will be created automatically.

			// **Simple examples:**

			// * `room.connect("My friend name");`
			// * `room.connect("My friend name", { data: "Hello World!" });`
			// * `room.connect("My friend name", { data: { customField: "Hello World!" } });`
			// * `room.connect("My friend name", { data: "Hello World!", createDataChannel : "auto" });`
			// * `room.connect("My friend name", { createDataChannel : "auto" });`
			connect: function (targetUserId, connectionOptions) {
				if (!roomInfo.user) {
					throw new xrtc.CommonError('connect', 'Need to enter the room before you connect someone.');
				}

				var targetUser = getUserById(targetUserId);
				if (targetUser == null) {
					var error = xrtc.CommonError('connect', 'Target user not found.');
					this.trigger(xrtc.Room.events.error, { userId: targetUserId, error: error });
				} else {
					var connectionDataContainer = (connectionOptions && connectionOptions.data) ? connectionOptions.data : null;

					createConnection.call(this, xrtc.utils.newGuid(), currentUserData, targetUser, connectionDataContainer, function (connectionData) {
						var connection = connectionData.connection;

						if (connectionOptions && connectionOptions.createDataChannel === 'auto') {
							connection.createDataChannel('autoDataChannel');
						}

						connection._open(connectionOptions);
					});
				}
			},

			// **[Public API]:** `getInfo()` is public method of `room` object. This method should be used for access room information.
			// The method returns information about room (domain, application, room name) and current user.
			// The returned object has following format: `{ domain: string, application: string, name: string, user: string }`, where:

			// * `domain`. The value which was defined during room creation.
			// * `application`. The value which was defined during room creation.
			// * `name`. Name of the room which was defined during room creation.
			// * `user`. Current user which was initialized after entering the room.
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

			// **[Public API]:** `getUsers()` is public method of `room` object. Returns array of users from the current room.

			getUsers: function () {
				// Return the copy of internal array.
				return users.map(function (user) {
					return user;
				});
			}
		});

		function subscribeToServerEvents() {
			var self = this;
			if (!isServerConnectorSubscribed) {
				serverConnector
					.on(scEvents.connectionOpen, proxy(function (event) { this.trigger(xrtc.Room.events.enter); }))
					.on(scEvents.connectionClose, proxy(function (event) { this.trigger(xrtc.Room.events.leave); }))
					.on(scEvents.tokenInvalid, proxy(function (event) { this.trigger(xrtc.Room.events.tokenInvalid, event); }))
					.on(scEvents.usersUpdated, proxy(function (data) {
						users = data.users;
						sortUsers();

						this.trigger(xrtc.Room.events.usersUpdated, { users: this.getUsers() });
					}))
					.on(scEvents.userConnected, proxy(function (data) {
						users.push(data.user);
						sortUsers();

						this.trigger(xrtc.Room.events.userConnected, { user: data.user });
					}))
					.on(scEvents.userDisconnected, proxy(function (data) {
						users.splice(getUserIndexById(users, data.user.id), 1);
						sortUsers();

						this.trigger(xrtc.Room.events.userDisconnected, { user: data.user });
					}))
					.on(scEvents.receiveOffer, proxy(onIncomingConnection))
					// **Note:** everything works fine without sendbye functionality in case when connection was closed manually.
					// This functionality helps to detect 'close' action more quickly for *Chrome* because 'xRtc.Connection' fires 'connectionclosed' event not immediately.
					.on(scEvents.receiveBye, proxy(onReceiveBye))
					.on(scEvents.receiveAnswer, function (data) {
						if (!data.senderId || !data.connectionId) {
							return;
						}

						var sender = getUserById(data.senderId);
						if (sender) {
							var targetHcObject = handshakeControllerObjects[data.connectionId];
							if (targetHcObject) {
								if (targetHcObject.userId === sender.id) {
									self.trigger(xrtc.Room.events.connectionAccepted, { user: sender, connection: getConnectionById(data.connectionId), data: data.acceptData });
									targetHcObject.hc.trigger(hcEvents.receiveAnswer, { connectionId: data.connectionId, answer: data.answer });
								}
							} else {
								serverConnector.sendBye(data.senderId, data.connectionId, { type: byeTypes.decline, data: 'Remote connection not found.' });
							}
						}
					})
					.on(scEvents.receiveIce, function (data) {
						if (!data.senderId || !data.connectionId) {
							return;
						}

						var targetHcObject = handshakeControllerObjects[data.connectionId];
						if (targetHcObject && targetHcObject.userId === data.senderId) {
							targetHcObject.hc.trigger(hcEvents.receiveIce, { iceCandidate: data.iceCandidate, connectionId: data.connectionId });
						}
					});

				isServerConnectorSubscribed = true;
			}
		}

		function unsubscribeFromServerEvents() {
			if (isServerConnectorSubscribed) {
				serverConnector
					.off(scEvents.connectionOpen)
					.off(scEvents.connectionClose)
					.off(scEvents.tokenInvalid)
					.off(scEvents.usersUpdated)
					.off(scEvents.userConnected)
					.off(scEvents.userDisconnected)
					.off(scEvents.receiveOffer)
					.off(scEvents.receiveBye)
					.off(scEvents.receiveAnswer)
					.off(scEvents.receiveIce);

				isServerConnectorSubscribed = false;
			}
		}

		function sortUsers() {
			users.sort(compareUsers);
		}

		function onIncomingConnection(data) {
			if (!data.senderId || !data.connectionId) {
				return;
			}

			var self = this;

			var incomingConnectionData = {
				user: getUserById(data.senderId)
			};

			if (!roomOptions.autoReply) {
				incomingConnectionData.data = data.connectionData;
				incomingConnectionData.accept = proxy(onAcceptCall);
				incomingConnectionData.decline = proxy(onDeclineCall);
			}

			handshakeControllerObjects[data.connectionId] = { userId: data.senderId, hc: null };

			this.trigger(xrtc.Room.events.incomingConnection, incomingConnectionData);

			if (roomOptions.autoReply) {
				onAcceptCall.call(self);
			}

			function onAcceptCall(acceptData) {
				createConnection.call(self, data.connectionId, currentUserData, getUserById(data.senderId), data.connectionData, function (connectionData) {
					var offerData = {
						offer: data.offer,
						iceServers: data.iceServers,
						connectionType: data.connectionType,
						connectionId: data.connectionId,
						connectionData: data.connectionData,
						acceptData: acceptData
					};

					connectionData.handshakeController.trigger(hcEvents.receiveOffer, offerData);
				});
			}

			function onDeclineCall(declineData) {
				serverConnector.sendBye(data.senderId, data.connectionId, { type: byeTypes.decline, data: declineData });
			}
		}

		function onReceiveBye(data) {
			if (!data.senderId || !data.connectionId) {
				return;
			}

			var sender = getUserById(data.senderId);
			if (sender) {
				var targetHcObject = handshakeControllerObjects[data.connectionId];
				if (targetHcObject) {
					if (targetHcObject.userId === sender.id) {
						if (data.byeData && data.byeData.type === byeTypes.decline /* your connection was declined on the remote side */ ||
							!targetHcObject.hc /* incoming connection of the remote user was declined by remote user (remote user close appropriate connection)*/) {
							this.trigger(xrtc.Room.events.connectionDeclined, {
								user: sender,
								// `connection` can be null in case if incoming call of remote user was declined by remote user.
								// `connection` object on local side will be created only if incoming call will be accepted on local side.
								connection: getConnectionById(data.connectionId),
								data: data.byeData
							});
						}

						if (targetHcObject.hc) {
							targetHcObject.hc.trigger(hcEvents.receiveBye);
						}
					}
				}
			}
		}

		function createConnection(connectionId, userData, targetUser, connectionData, connectionCreated) {
			var self = this;

			var hc = new xrtc.HandshakeController();

			var connection = new xRtc.Connection(connectionId, userData, targetUser, hc, authManager, connectionData);

			if (!handshakeControllerObjects[connectionId]) {
				handshakeControllerObjects[connectionId] = { userId: targetUser.id, hc: hc };
			} else /* handshake controller object was already created on the incoming connection event */ {
				handshakeControllerObjects[connectionId].hc = hc;
			}

			hc.on(hcEvents.sendOffer, proxy(function (tUserId, connId, data) {
				serverConnector.sendOffer(tUserId, connId, data);
			}))
			.on(hcEvents.sendAnswer, proxy(function (tUserId, connId, data) {
				serverConnector.sendAnswer(tUserId, connId, data);
			}))
			.on(hcEvents.sendIce, proxy(function (tUserId, connId, data) {
				serverConnector.sendIce(tUserId, connId, data);
			}))
			.on(hcEvents.sendBye, proxy(function (tUserId, connId, data) {
				serverConnector.sendBye(tUserId, connId, data);
			}));

			connection.on(xrtc.Connection.events.connectionClosed, function () {
				connections.splice(getConnectionIndexById(connections, connectionId), 1);
				delete handshakeControllerObjects[connectionId];
			});

			connections.push(connection);

			self.trigger(xrtc.Room.events.connectionCreated, { user: targetUser, connection: connection });

			if (typeof connectionCreated === 'function') {
				connectionCreated({ connection: connection, handshakeController: hc });
			}
		}

		function compareUsers(p1, p2) {
			var result = 0;
			if (p1.name < p2.name) {
				result = -1;
			} else if (p1.name > p2.name) {
				result = 1;
			}

			return result;
		}

		function getUserById(userId) {
			var user = null;
			for (var i = 0, len = users.length; i < len; i++) {
				if (users[i].id === userId) {
					user = users[i];
					break;
				}
			}

			return user;
		}

		function getConnectionById(connectionId) {
			var connection = null;
			for (var i = 0, len = connections.length; i < len; i++) {
				if (connections[i].getId() === connectionId) {
					connection = connections[i];
					break;
				}
			}

			return connection;
		}

		function getConnectionIndexById(connectionsArray, connectionId) {
			var resultIndex = -1;
			for (var i = 0, len = connectionsArray.length; i < len; i++) {
				if (connectionsArray[i].getId() === connectionId) {
					resultIndex = i;
					break;
				}
			}

			return resultIndex;
		}

		function getUserIndexById(usersArray, userId) {
			var resultIndex = -1;
			for (var i = 0, len = usersArray.length; i < len; i++) {
				if (usersArray[i].id === userId) {
					resultIndex = i;
				}
			}
			return resultIndex;
		}
	});

	xrtc.Room.extend({
		// **Note:** Full list of events for the `xRtc.Room` object.
		events: {
			enter: 'enter',
			leave: 'leave',

			incomingConnection: 'incomingconnection',

			connectionCreated: 'connectioncreated',
			connectionAccepted: 'connectionaccepted',
			connectionDeclined: 'connectiondeclined',

			usersUpdated: 'usersupdated',
			userConnected: 'userconnected',
			userDisconnected: 'userdisconnected',
			tokenInvalid: 'tokeninvalid',

			error: 'error'
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