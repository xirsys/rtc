'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class2(xrtc, 'Room', function Room(serverConnector, handshkeController) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			name = null,
			participants = [];

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			join: function (token) {
				serverConnector.connect(token);

				serverConnector
					.on(xrtc.Room.serverEvents.participantsUpdated, proxy(onParticipantsUpdated))
					.on(xrtc.Room.serverEvents.participantConnected, proxy(onParticipantConnected))
					.on(xrtc.Room.serverEvents.participantDisconnected, proxy(onParticipantDisconnected));
			},

			leave: function () {
				name = null;
				participants = [];
				
				serverConnector
					.off(xrtc.Room.serverEvents.participantsUpdated)
					.off(xrtc.Room.serverEvents.participantConnected)
					.off(xrtc.Room.serverEvents.participantDisconnected);
			},

			getName: function () {
				return name;
			},
			
			getParticipants: function () {
				//return copy of array
				return participants.map(function (participant) {
					return participant;
				});
			}
		});

		function onParticipantsUpdated(data) {
			name = data.room;
			participants = data.connections;
			orderParticipants();
			
			this.trigger(xrtc.Room.events.participantsUpdated, { paticipants: this.getParticipants() });
		}
		
		function onParticipantConnected(data) {
			name = data.room;
			participants.push(data.paticipantId);
			orderParticipants();
			
			this.trigger(xrtc.Room.events.participantConnected, { paticipantId: data.paticipantId });
		}
		
		function onParticipantDisconnected(data) {
			name = data.room;
			participants.pop(data.paticipantId);
			orderParticipants();

			this.trigger(xrtc.Room.events.participantDisconnected, { paticipantId: data.paticipantId });
		}

		function orderParticipants() {
			participants.sort();
		}
		

		// handshakeController handling
		var hcEvents = xrtc.HandshakeController.events;
		handshkeController
			.on(hcEvents.sendIce, proxy(onHandshakeSendMessage))
			.on(hcEvents.sendOffer, proxy(onHandshakeSendMessage))
			.on(hcEvents.sendAnswer, proxy(onHandshakeSendMessage))
			.on(hcEvents.sendBye, proxy(onHandshakeSendMessage));
		
		serverConnector
			.on(hcEvents.receiveIce, proxy(onHandshakeReceiveMessage, hcEvents.receiveIce))
			.on(hcEvents.receiveOffer, proxy(onHandshakeReceiveMessage, hcEvents.receiveOffer))
			.on(hcEvents.receiveAnswer, proxy(onHandshakeReceiveMessage, hcEvents.receiveAnswer))
			.on(hcEvents.receiveBye, proxy(onHandshakeReceiveMessage, hcEvents.receiveBye));

		function onHandshakeSendMessage(data) {
			serverConnector.send(data);
		}
		
		function onHandshakeReceiveMessage(data, event) {
			handshkeController.trigger(event, data);
		}
	});
	
	xrtc.Room.extend({
		events: {
			participantsUpdated: 'participantsupdated',
			participantConnected: 'participantconnected',
			participantDisconnected: 'participantdisconnected',
		},
		
		serverEvents: {
			participantsUpdated: 'peers',
			participantConnected: 'peer_connected',
			participantDisconnected: 'peer_removed',
		}
	});
})(window);