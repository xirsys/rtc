﻿'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	exports.wsTest = {
		init: function () {
			$('#ws-test').removeClass('hide');
			$('#ws-form').on('submit', function (e) {
				e.preventDefault();
				var $form = $(this);

				exports.chat._serverConnector[$(".ws-message-type select").val()](
					$(".ws-targetUser input").val(),
					$form.find('.ws-message textarea').val());
			});

			var testMessages = {
				sendAnswer: '{"sdp":"v=0\r\no=- 3874791739 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video data\r\na=msid-semantic: WMS sOgD2pf8Xowrauq7sHYGsPljbiBEPHENGfR4\r\nm=audio 1 RTP/SAVPF 103 104 111 0 8 107 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:zRKq8SCBdGu29Vhf\r\na=ice-pwd:Pv20ls9jSJFmQkf+pPZ2FZZu\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:7DAXeeCikIi0PXEXIRpLqn1U3iBFY+Xy1B8CyqUU\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:111 opus/48000/2\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:107 CN/48000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:4184440986 cname:rgVnvNfHQXXKpYCY\r\na=ssrc:4184440986 msid:sOgD2pf8Xowrauq7sHYGsPljbiBEPHENGfR4 a0\r\na=ssrc:4184440986 mslabel:sOgD2pf8Xowrauq7sHYGsPljbiBEPHENGfR4\r\na=ssrc:4184440986 label:sOgD2pf8Xowrauq7sHYGsPljbiBEPHENGfR4a0\r\nm=video 1 RTP/SAVPF 100 116 117\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:zRKq8SCBdGu29Vhf\r\na=ice-pwd:Pv20ls9jSJFmQkf+pPZ2FZZu\r\na=recvonly\r\na=mid:video\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:7DAXeeCikIi0PXEXIRpLqn1U3iBFY+Xy1B8CyqUU\r\na=rtpmap:100 VP8/90000\r\na=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\nm=application 1 RTP/SAVPF 101\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:zRKq8SCBdGu29Vhf\r\na=ice-pwd:Pv20ls9jSJFmQkf+pPZ2FZZu\r\na=sendrecv\r\na=mid:data\r\nb=AS:30\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:7DAXeeCikIi0PXEXIRpLqn1U3iBFY+Xy1B8CyqUU\r\na=rtpmap:101 google-data/90000\r\na=ssrc:1707929458 cname:+bmREs1Qepw4c9FC\r\na=ssrc:1707929458 msid:textChat d0\r\na=ssrc:1707929458 mslabel:textChat\r\na=ssrc:1707929458 label:textChat\r\n","type":"answer"}',
				sendOffer: '{"sdp":"v=0\r\no=- 3476052623 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\na=group:BUNDLE audio video data\r\na=msid-semantic: WMS MIKP49Gp5fqJBxNGbA13gSKpxEViiVVjNX4l\r\nm=audio 1 RTP/SAVPF 103 104 111 0 8 107 106 105 13 126\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:S51L1CbtzX0NzGGf\r\na=ice-pwd:BcvUBCDADcvDWdV7WYmJORkQ\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:audio\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:l8UDq0/qo5pR7DdInimHXedTZiVBa7BlaU6+wxE6\r\na=rtpmap:103 ISAC/16000\r\na=rtpmap:104 ISAC/32000\r\na=rtpmap:111 opus/48000/2\r\na=rtpmap:0 PCMU/8000\r\na=rtpmap:8 PCMA/8000\r\na=rtpmap:107 CN/48000\r\na=rtpmap:106 CN/32000\r\na=rtpmap:105 CN/16000\r\na=rtpmap:13 CN/8000\r\na=rtpmap:126 telephone-event/8000\r\na=ssrc:1245217794 cname:BxYTUPbmbbvzEuJy\r\na=ssrc:1245217794 msid:MIKP49Gp5fqJBxNGbA13gSKpxEViiVVjNX4l a0\r\na=ssrc:1245217794 mslabel:MIKP49Gp5fqJBxNGbA13gSKpxEViiVVjNX4l\r\na=ssrc:1245217794 label:MIKP49Gp5fqJBxNGbA13gSKpxEViiVVjNX4la0\r\nm=video 1 RTP/SAVPF 100 116 117\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:S51L1CbtzX0NzGGf\r\na=ice-pwd:BcvUBCDADcvDWdV7WYmJORkQ\r\na=ice-options:google-ice\r\na=recvonly\r\na=mid:video\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:l8UDq0/qo5pR7DdInimHXedTZiVBa7BlaU6+wxE6\r\na=rtpmap:100 VP8/90000\r\na=rtpmap:116 red/90000\r\na=rtpmap:117 ulpfec/90000\r\nm=application 1 RTP/SAVPF 101\r\nc=IN IP4 0.0.0.0\r\na=rtcp:1 IN IP4 0.0.0.0\r\na=ice-ufrag:S51L1CbtzX0NzGGf\r\na=ice-pwd:BcvUBCDADcvDWdV7WYmJORkQ\r\na=ice-options:google-ice\r\na=sendrecv\r\na=mid:data\r\nb=AS:30\r\na=rtcp-mux\r\na=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:l8UDq0/qo5pR7DdInimHXedTZiVBa7BlaU6+wxE6\r\na=rtpmap:101 google-data/90000\r\na=ssrc:1463801293 cname:UAq0/+pApC4+YgAX\r\na=ssrc:1463801293 msid:textChat d0\r\na=ssrc:1463801293 mslabel:textChat\r\na=ssrc:1463801293 label:textChat\r\n","type":"offer"}',
				sendIce: '{\"sdpMLineIndex\":0,\"sdpMid\":\"audio\",\"candidate\":\"a=candidate:704553097 1 udp 2113937151 192.168.1.3 58675 typ host generation 0\\r\\n\"}"}}',
			};

			$(".ws-message-type select")
				.on("change", function () {
					var val = $(this).val();
					var $txt = $('#ws-form .ws-message textarea');
					switch (val) {
						case "sendOffer":
						case "sendAnswer":
						case "sendIce":
							$txt.val(testMessages[val]);
							break;
						default:
							alert("Unknown message type.");
							break;
					}
				});

			$('#ws-form .ws-message textarea').val(testMessages[$(".ws-message-type select").val()]);
		}
	};

	exports.chat = {
		settings: {
			autoAcceptCall: (getParams().autoaccept || 'false').toLowerCase() === 'true'
		},
		
		_connection: null,
		_room: null,
		_serverConnector: null,
		systemName: 'SYSTEM',

		init: function () {
			/// <summary>The method for the initializing of chat</summary>
			
			$('#join-form').on('submit', function (e) {
				e.preventDefault();

				var userData = $(this).serializeObject();
				exports.chat.joinRoom(userData);
			});

			$('#chat-form').on('submit', function (e) {
				e.preventDefault();
				var $form = $(this);

				var message = $form.serializeObject();
				exports.chat.sendMessage(message);
				$form.find(':text').val('');
			});

			$(document)
				.on('click', '#contacts .buttons .connect', function (e) {
					e.preventDefault();

					var contact = $(this).parents('.contact').addClass('current').data();
					exports.chat.connect(contact.name);
				})
				.on('click', '#contacts .buttons .disconnect', function (e) {
					e.preventDefault();

					var contact = $(this).data();
					exports.chat.disconnect(contact.name);
				});
		},

		joinRoom: function (userData) {
			$('#step1, #step2').toggle();
			exports.chat._userData = userData;

			var authManager = new xRtc.AuthManager();

			var connection = exports.chat._connection = new xRtc.Connection(userData, authManager)
				.on(xrtc.Connection.events.streamAdded, function (data) {
					exports.chat.addParticipant(data);
					exports.chat.contactsList.updateState();
				})
				.on(xrtc.Connection.events.initialized, function () {
					exports.chat._textChannel = connection.createDataChannel('textChat');

					if (exports.chat._textChannel) {
						exports.chat.subscribe(exports.chat._textChannel, xrtc.DataChannel.events);

						exports.chat._textChannel.on(xrtc.DataChannel.events.message, function (messageData) {
							var message = JSON.parse(messageData.message);
							exports.chat.addMessage(message.userId, message.message);
						});
					} else {
						exports.chat.addSystemMessage('Failed to create data channel. You need Chrome M25 or later with --enable-data-channels flag.');
					}
				})
				.on(xrtc.Connection.events.incomingCall, function (call) {
					exports.chat.acceptCall(call);
				})
				.on(xrtc.Connection.events.connectionEstablished, function (participantId) {
					console.log('Connection is established.');
					exports.chat.addSystemMessage('p2p connection has been established with ' + participantId + '.');
				})
				.on(xrtc.Connection.events.connectionClosed, function (participantId) {
					exports.chat.contactsList.refreshParticipants();
					exports.chat.removeParticipant(participantId);
					exports.chat.addSystemMessage('p2p connection with ' + participantId + ' has been closed.');
				})
				.on(xrtc.Connection.events.stateChanged, function (state) {
					exports.chat.contactsList.updateState(state);
				});

			var serverConnector = exports.chat._serverConnector = new xRtc.ServerConnector()
				.on(xrtc.ServerConnector.events.connectionClose, function (data) {
					exports.chat.contactsList.refreshParticipants([]);
					exports.chat.addSystemMessage('You was disconnected by the server.');
				})
				.on(xrtc.HandshakeController.events.receiveBye, function (data) {
					exports.chat.removeParticipant(data.senderId);
					exports.chat.addSystemMessage(data.senderId + ' closed p2p connection.');
				});

			var room = exports.chat._room = new xRtc.Room(serverConnector, connection.getHandshake())
				.on(xrtc.Room.events.participantsUpdated, function (data) {
					exports.chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.participantConnected, function (data) {
					exports.chat.addSystemMessage(data.paticipantId + ' entered the room.');

					exports.chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.participantDisconnected, function (data) {
					exports.chat.addSystemMessage(data.paticipantId + ' left the room.');

					exports.chat.contactsList.refreshParticipants();
				});

			connection.addMedia();

			exports.chat.subscribe(serverConnector, xrtc.ServerConnector.events);
			exports.chat.subscribe(connection, xrtc.Connection.events);
			exports.chat.subscribe(connection.getHandshake(), xrtc.HandshakeController.events);
			exports.chat.subscribe(room, xrtc.Room.events);

			authManager.getToken(exports.chat._userData, function (token) {
				room.join(token);
			});
		},

		leaveRoom: function () {
			exports.chat._room.leave();
			$('#step1, #step2').toggle();
		},
		
		acceptCall: function(incomingCall) {
			if (exports.chat.settings.autoAcceptCall) {
				incomingCall.accept();
			} else {
				//todo: make it more pretty
				if (confirm('User "' + incomingCall.participantName + '" is calling to you. Would you like to answer?')) {
					incomingCall.accept();
				} else {
					incomingCall.decline();
				}
			}
		},

		sendMessage: function (message) {
			console.log('Sending message...', message);
			if (exports.chat._textChannel) {
				exports.chat._textChannel.send(message.message);
				exports.chat.addMessage(exports.chat._userData.name, message.message, true);
			} else {
				exports.chat.addSystemMessage('DataChannel is not created. Please, see log.');
			}
		},

		addMessage: function (name, message, isMy) {
			var messageData = { name: name, message: message, isMy: !!isMy };

			var $chat = $('#chat');

			//todo: need to fix chat scrolling behavior
			$chat
				.append($('#chat-message-tmpl').tmpl(messageData))
				.scrollTop($chat.children().last().position().top + $chat.children().last().height());
		},

		addSystemMessage: function (message) {
			this.addMessage(exports.chat.systemName, message);
		},

		connect: function (contact) {
			console.log('Connecting to participant...', contact);
			this._connection.startSession(contact);
		},

		disconnect: function (contact) {
			console.log('Disconnection from participant...', contact);
			this._connection.endSession();
		},

		contactsList: {
			addParticipant: function (participant) {
				$('#contacts').append($('#contact-info-tmpl').tmpl(participant));
			},

			removeParticipant: function (participantId) {
				$('#contacts').find('.contact[data-name="' + participantId + '"]').remove();
			},

			refreshParticipants: function () {
				var contactsData = {
					roomName: exports.chat._room.getName()
				};
				$('#contacts-cell').empty().append($('#contacts-info-tmpl').tmpl(contactsData));

				var contacts = this.convertContacts(exports.chat._room.getParticipants());
				for (var index = 0, len = contacts.length; index < len; index++) {
					this.addParticipant(contacts[index]);
				}

				this.updateState();
			},

			convertContacts: function (participants) {
				var contacts = [],
					currentName = exports.chat._userData.name;

				for (var i = 0, len = participants.length; i < len; i++) {
					var name = participants[i];
					contacts[i] = {
						name: name,
						isMe: name === currentName
					};
				}

				return contacts;
			},

			updateState: function (state) {
				var freeStates = {
					'ready': true,
					'not-ready': true
				};

				state = state || chat._connection.getState();

				var contacts = $('#contacts').removeClass().addClass(state).find('.contact').removeClass('current');

				if (!freeStates[state]) {
					contacts.filter('[data-name="' + chat._connection.getRemoteParticipantName() + '"]').addClass('current');
				}
			}
		},

		addParticipant: function (stream) {
			var data = {
				name: stream.getParticipantName(),
				isMe: stream.isLocal()
			};

			$.each($('#video .person'), function (index, value) {
				if (!$(value).hasClass('my')) {
					value.remove();
				}
			});

			var participantItem = $('#video-tmpl').tmpl(data);
			$('#video').append(participantItem);

			var video = participantItem.find('video').removeClass('hide').get(0);
			stream.assignTo(video);
		},

		removeParticipant: function (participantId) {
			$('#video .person[data-name="' + participantId + '"]').remove();
		},

		subscribe: function (eventDispatcher, events) {
			if (typeof eventDispatcher.on === "function") {
				for (var eventPropertyName in events) {
					(function (eventName) {
						eventDispatcher.on(eventName, function () {
							console.log('CHAT', eventDispatcher.className, eventName, Array.prototype.slice.call(arguments));
						});
					})(events[eventPropertyName]);
				}
			}
		}
	};
})(window);

function getParams() {
	var params = {};
	var paramsArr = location.href.split('?');

	if (paramsArr.length > 1) {
		paramsArr = paramsArr[1].split('&');
		for (var i = 0; i < paramsArr.length; i++) {
			var paramData = paramsArr[i].split('=');
			params[paramData[0]] = paramData[1];
		}
	}

	return params;
}

var setIceServers = function (params) {
	if (params.stun || params.turn) {
		var settings = xRtc.AuthManager.settings;
		settings.iceServers = {
			iceServers: []
		};

		if (params.stun) {
			settings.iceServers.iceServers.push({ url: "stun:" + params.stun });
		}

		if (params.turn) {
			settings.iceServers.iceServers.push({ url: "turn:" + params.turn, credential: params.credential || '' });
		}
	}
};

$(document).ready(function () {
	$.fn.serializeObject = function () {
		var formArray = this.serializeArray(), formData = {};

		for (var i = 0, len = formArray.length; i < len; i++) {
			formData[formArray[i].name] = formArray[i].value;
		}

		return formData;
	};

	xRtc.Logger.enable({ info: true, debug: true, warning: true, error: true });

	chat.init();
	//wsTest.init();

	var pageParams = getParams();
	setIceServers(pageParams);

	var username = pageParams.name;
	if (username) {
		$('#join-form').find(':text[name="name"]').val(username).end().trigger('submit');
	}
});