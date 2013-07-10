'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'Room', function Room(info, am, sc) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			name = null,
			participants = [],
			handshakeController = null,
			isHandshakeSubscribed = false,
			isServerConnectorSubscribed = false,
			roomOptions = {},
			roomInfo = {},
			authManager = am || new xRtc.AuthManager(),
			serverConnector = sc || new xrtc.ServerConnector();

		// roomInfo initialization
		xrtc.Class.extend(roomInfo, xrtc.Room.settings.info);
		if (typeof info === 'string') {
			roomInfo.name = info;
		} else {
			xrtc.Class.extend(roomInfo, info);
		}

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			join: function (userName, options) {
				subscribeOnServerConnectorEvents.call(this);
				subscribeOnHandshakeControllerEvents.call(this);

				// roomOptions initialization
				xrtc.Class.extend(roomOptions, xrtc.Connection.settings.options);
				if (options) {
					xrtc.Class.extend(roomOptions, options);
				};

				var userData = {
					domain: roomInfo.domain,
					application: roomInfo.application,
					room: roomInfo.name,
					name: userName
				};

				authManager.getToken(userData, function (token) {
					// todo: think about best place of this initialization
					roomInfo.user = userName;

					serverConnector.connect(token);
				});
			},

			connect: function (participantId, mediaContentOptions, connectionOptions) {
				if (!roomInfo.user) {
					throw new xrtc.CommonError('connect', 'Need to join the room before you connect someone.');
				}

				var self = this;

				// var connection = new xRtc.Connection(userData, { autoReply: settings.autoAcceptCall }, authManager);

				var connection = new xRtc.Connection(userData, authManager);

				var connectingData = {
					participantId: data.participantId,
					connection: connection
				};
				self.trigger(xrtc.Room.events.connecting, connectingData);

				// todo: need to prepare valid media content options
				if (mediaContentOptions) {
					connection.addMedia(mediaContentOptions);

					//todo: if neccessary appropriate data channels should be created here. Pseudo code was added for now.
					var channels = getChannels(mediaContentOptions);
					for (var i = 0, len = channels.length; i < len; i++) {
						connection.createDataChannel(channels[i].name);
					}
				}

				connection.startSession(participantId, connectionOptions);
			},

			leave: function () {
				unsubscribeFromServerConnectorEvents.call(this);
				unsubscribeFromHandshakeControllerEvents.call(this);

				name = null;
				participants = [];
			},
			
			getInfo: function ()
			{
				return roomInfo;
			},

			// todo: need to think about obligatoriness of this method

			addHandshake: function (hc) {
				handshakeController = hc;

				subscribeOnHandshakeControllerEvents.call(this);
			},

			getName: function () {
				return name;
			},

			getParticipants: function () {
				//return the copy of array
				return participants.map(function (participant) {
					return participant;
				});
			}
		});

		function subscribeOnServerConnectorEvents() {
			if (!isServerConnectorSubscribed) {
				serverConnector
					.on(xrtc.ServerConnector.events.connectionOpen, proxy(onConnectionOpen))
					.on(xrtc.ServerConnector.events.connectionClose, proxy(onConnectionClose))
					.on(xrtc.ServerConnector.events.tokenExpired, proxy(onTokenExpired))
					.on(xrtc.ServerConnector.serverEvents.participantsUpdated, proxy(onParticipantsUpdated))
					.on(xrtc.ServerConnector.serverEvents.participantConnected, proxy(onParticipantConnected))
					.on(xrtc.ServerConnector.serverEvents.participantDisconnected, proxy(onParticipantDisconnected));

				isServerConnectorSubscribed = true;
			}
		}

		function unsubscribeFromServerConnectorEvents() {
			if (isServerConnectorSubscribed) {
				serverConnector
					.off(xrtc.ServerConnector.serverEvents.participantsUpdated)
					.off(xrtc.ServerConnector.serverEvents.participantConnected)
					.off(xrtc.ServerConnector.serverEvents.participantDisconnected);

				isServerConnectorSubscribed = false;
			}
		}

		function onParticipantsUpdated(data) {
			name = data.room;
			participants = data.connections;
			orderParticipants();

			this.trigger(xrtc.Room.events.participantsUpdated, { participants: this.getParticipants() });
		}

		function onParticipantConnected(data) {
			name = data.room;
			participants.push(data.participantId);
			orderParticipants();

			this.trigger(xrtc.Room.events.participantConnected, { participantId: data.participantId });
		}

		function onParticipantDisconnected(data) {
			name = data.room;
			participants.splice(participants.indexOf(data.participantId), 1);
			orderParticipants();

			this.trigger(xrtc.Room.events.participantDisconnected, { participantId: data.participantId });
		}

		function orderParticipants() {
			participants.sort();
		}

		function onConnectionOpen(event) {
			this.trigger(xrtc.Room.events.join);
		}

		function onConnectionClose(event) {
			this.trigger(xrtc.Room.events.leave);
		}
		
		function onTokenExpired(event) {
			this.trigger(xrtc.Room.events.tokenExpired, event);
		}

		function subscribeOnHandshakeControllerEvents() {
			if (handshakeController && !isHandshakeSubscribed) {
				var hcEvents = xrtc.HandshakeController.events;
				handshakeController
					.on(hcEvents.sendIce, proxy(onHandshakeSendMessage))
					.on(hcEvents.sendOffer, proxy(onHandshakeSendMessage))
					.on(hcEvents.sendAnswer, proxy(onHandshakeSendMessage))
					.on(hcEvents.sendBye, proxy(onHandshakeSendMessage));

				serverConnector
					.on(hcEvents.receiveIce, proxy(onHandshakeReceiveMessage, hcEvents.receiveIce))
					.on(hcEvents.receiveOffer, proxy(onHandshakeReceiveMessage, hcEvents.receiveOffer))
					.on(hcEvents.receiveAnswer, proxy(onHandshakeReceiveMessage, hcEvents.receiveAnswer))
					.on(hcEvents.receiveBye, proxy(onHandshakeReceiveMessage, hcEvents.receiveBye));

				isHandshakeSubscribed = true;
			}
		}

		function unsubscribeFromHandshakeControllerEvents() {
			if (handshakeController && isHandshakeSubscribed) {
				var hcEvents = xrtc.HandshakeController.events;
				handshakeController
					.off(hcEvents.sendIce)
					.off(hcEvents.sendOffer)
					.off(hcEvents.sendAnswer)
					.off(hcEvents.sendBye);

				serverConnector
					.off(hcEvents.receiveIce)
					.off(hcEvents.receiveOffer)
					.off(hcEvents.receiveAnswer)
					.off(hcEvents.receiveBye);

				isHandshakeSubscribed = false;
			}
		}

		function onHandshakeSendMessage(data) {
			serverConnector.send(data);
		}

		function onHandshakeReceiveMessage(data, event) {
			handshakeController.trigger(event, data);
		}
	});

	xrtc.Room.extend({
		events: {
			join: 'join',
			leave: 'leave',

			connecting: 'connecting',

			participantsUpdated: 'participantsupdated',
			participantConnected: 'participantconnected',
			participantDisconnected: 'participantdisconnected',
			tokenExpired: 'tokenexpired'
		},

		settings: {
			info: {
				domain: 'designrealm.co.uk', //exports.document.domain,
				application: 'Test', //'Default',
				name: 'Test', //'Default'
			},

			options: {
				autoReply: true
			}
		}
	});
})(window);