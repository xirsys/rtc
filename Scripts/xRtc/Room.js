'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'Room', function Room(info, am, sc) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			hcEvents = xrtc.HandshakeController.events,
			scEvents = xrtc.ServerConnector.events,
			name = null,
			participants = [],
			isServerConnectorSubscribed = false,
			roomOptions = {},
			roomInfo = {},
			authManager = am || new xRtc.AuthManager(),
			serverConnector = sc || new xrtc.ServerConnector(),
			connections = [],
			handshakeControllers = {};

		// roomInfo initialization
		xrtc.Class.extend(roomInfo, xrtc.Room.settings.info);
		if (typeof info === 'string') {
			roomInfo.name = info;
		} else {
			xrtc.Class.extend(roomInfo, info);
		}

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			// todo: maybe will be better to rename this method to 'enter'
			join: function (userName, options) {
				subscribeToServerEvents.call(this);

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

			leave: function () {
				unsubscribeFromServerEvents.call(this);

				name = null;
				participants = [];
			},

			connect: function (participantId, connectionOptions) {
				if (!roomInfo.user) {
					throw new xrtc.CommonError('connect', 'Need to join the room before you connect someone.');
				}

				// todo: get userdata or something like this

				var connection = createConnection(userData, participantId);

				// todo: need to prepare valid media content options
				if (mediaContentOptions) {
					// todo: if neccessary, appropriate data channels should be created here. Pseudo code was added for now.
					var channels = getChannels(mediaContentOptions);
					for (var i = 0, len = channels.length; i < len; i++) {
						connection.createDataChannel(channels[i].name);
					}
				}

				connection.startSession(participantId, connectionOptions);
			},

			getInfo: function ()
			{
				return roomInfo;
			},

			getConnections: function() {
				return connections;
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

		function subscribeToServerEvents() {
			if (!isServerConnectorSubscribed) {
				serverConnector
					.on(scEvents.connectionOpen, proxy(function (event) { this.trigger(xrtc.Room.events.join); }))
					.on(scEvents.connectionClose, proxy(function (event) { this.trigger(xrtc.Room.events.leave); }))
					.on(scEvents.tokenInvalid, proxy(function (event) { this.trigger(xrtc.Room.events.tokenInvalid); }))
					.on(scEvents.participantsUpdated, proxy(function (data) {
						name = data.room;
						participants = data.connections;
						sortParticipants();

						this.trigger(xrtc.Room.events.participantsUpdated, { participants: this.getParticipants() });
					}))
					.on(scEvents.participantConnected, proxy(function (data) {
						name = data.room;
						participants.push(data.participantId);
						sortParticipants();

						this.trigger(xrtc.Room.events.participantConnected, { participantId: data.participantId });
					}))
					.on(scEvents.participantDisconnected, proxy(function (data) {
						name = data.room;
						participants.splice(participants.indexOf(data.participantId), 1);
						sortParticipants();

						this.trigger(xrtc.Room.events.participantDisconnected, { participantId: data.participantId });
					}))
					.on(scEvents.receiveOffer, proxy(onIncomingConnection));

				isServerConnectorSubscribed = true;
			}
		}

		function unsubscribeFromServerEvents() {
			if (isServerConnectorSubscribed) {
				serverConnector
					.off(scEvents.participantsUpdated)
					.off(scEvents.participantConnected)
					.off(scEvents.participantDisconnected);
				
				// todo: what about another events? (connectionOpen, connectionClose, tokenInvalid). Need to think about it later.

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
			if (!roomOptions.autoReply) {
				data.accept = proxy(onAcceptCall);
				data.decline = proxy(onDeclineCall);
			}

			this.trigger(xrtc.Room.events.incomingConnection, data);

			if (roomOptions.autoReply) {
				onAcceptCall.call(self);
			}

			function onAcceptCall() {
				//End the current active call, if any
				//this.endSession();

				remoteConnectionId = offerData.connectionId;
				iceServers = offerData.iceServers;

				initPeerConnection.call(this, offerData.senderId, function () {
					logger.debug('receiveOffer', offerData);
					iceFilter = new internal.IceCandidateFilter(offerData.connectionType, iceServers);

					// data channels doesn't work in case of interoperability Chrome and FireFox
					/*if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion <= 21) {
						offerData.offer = offerData.offer.substr(0, offerData.offer.indexOf("a=mid:data"));
					}*/

					var sdp = JSON.parse(offerData.offer);

					var remoteSessionDescription = new webrtc.RTCSessionDescription(sdp);
					peerConnection.setRemoteDescription(remoteSessionDescription);

					peerConnection.createAnswer(proxy(onCreateAnswerSuccess), proxy(onCreateAnswerError), xrtc.Connection.settings.answerOptions);

					function onCreateAnswerSuccess(answer) {
						peerConnection.setLocalDescription(answer);

						var request = {
							answer: JSON.stringify(answer)
						};

						logger.debug('sendAnswer', offerData, answer);
						handshakeController.sendAnswer(offerData.senderId, remoteConnectionId, request);

						this.trigger(xrtc.Connection.events.answerSent, offerData, answer);

						allowIceSending.call(this);
					}

					function onCreateAnswerError(err) {
						var error = new xrtc.CommonError('sendAnswer', "Cannot create WebRTC answer", err);

						logger.error('sendAnswer', error);
						this.trigger(xrtc.Connection.events.answerError, error);
					}
				});
			}

			function onDeclineCall() {
				serverConnector.sendBye(targetUserId, data.connectionId, { type: 'decline' });
			}
		}

		function createConnection(userData, participantId) {
			var hc = new xrtc.HandshakeController();

			var connection = new xRtc.Connection(userData, hc, authManager);
			var connectionId = connection.getId();

			handshakeControllers[connectionId] = hc;

			var eventsMapping = {};
			eventsMapping[scEvents.receiveOffer] = hcEvents.receiveOffer; // ???
			eventsMapping[scEvents.receiveAnswer] = hcEvents.receiveAnswer;
			eventsMapping[scEvents.receiveIce] = hcEvents.receiveIce;
			eventsMapping[scEvents.receiveBye] = hcEvents.receiveBye;
			for (var eventName in eventsMapping) {
				if (eventsMapping.hasOwnProperty(eventName)) {
					serverConnector.on(event, function (data) {
						if (data.connectionId) {
							var targetHc = handshakeControllers[data.connectionId];
							if (targetHc) {
								targetHc.trigger(eventsMapping[eventName], data);
							}
						}
					});
				}
			}

			var hcSendEvents = [hcEvents.sendOffer, hcEvents.sendAnswer, hcEvents.sendIce, hcEvents.sendBye];
			for (var i = 0, len = hcSendEvents.length; i < len; i++) {
				hc.on(hcSendEvents[i], proxy(function (data) {
					serverConnector.send(data);
				}));
			}

			self.trigger(xrtc.Room.events.connectionCreated, { participantId: participantId, connection: connection });

			connection.on(xrtc.Connection.events.connectionClosed, function () {
				connections.splice(getConnectionIndexById(connections, connectionId), 1);
				// todo: maybe need to unsubscribe this handshake controllers from all events
				delete handshakeControllers[connectionId];
			});

			connections.push(connection);

			return connection;
		}
	});

	xrtc.Room.extend({
		events: {
			join: 'join',
			leave: 'leave',

			incomingConnection: 'incomingconnection',
			connectionCreated: 'connectioncreated',
			connectionDeclined: 'connectiondeclined',

			receiveIce: 'receiveice',
			receiveOffer: 'receiveoffer',
			receiveAnswer: 'receiveanswer',
			receiveBye: 'receivebye',

			participantsUpdated: 'participantsupdated',
			participantConnected: 'participantconnected',
			participantDisconnected: 'participantdisconnected',
			tokenInvalid: 'tokeninvalid'
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