'use strict';

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

(function ($) {
	$.fn.toggleMediaStream = function (buttonClass, selector, property) {
		this.on('click', selector, function (e) {
			var btn = $(this);
			btn.parent().children(buttonClass).toggleClass('hide');

			var stream = btn.closest('.person').data('stream');

			stream[property] = !btn.hasClass('disable');
		});

		return this;
	};

	$.fn.serializeObject = function () {
		var formArray = this.serializeArray(), formData = {};

		for (var i = 0, len = formArray.length; i < len; i++) {
			formData[formArray[i].name] = formArray[i].value;
		}

		return formData;
	};
})(jQuery);

var wsTest = {};
(function (wsTest, xrtc) {
	xrtc.Class.extend(wsTest, {
		init: function () {
			$('#ws-test').removeClass('hide');
			$('#ws-form').on('submit', function (e) {
				e.preventDefault();
				var $form = $(this);

				chat.getServerConnector[$(".ws-message-type select").val()](
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
	});
})(wsTest, xRtc);


var chat = {};
(function (chat, xrtc) {
	var connection = null,
		room = null,
		serverConnector = null,
		textChannel = null,
		userData = null,
		systemName = 'SYSTEM',
		logger = false,
		settings = {
			autoAcceptCall: (getParams().autoaccept || 'false').toLowerCase() === 'true'
		};

	xrtc.Class.extend(chat, {
		init: function () {
			/// <summary>The method for the initializing of chat</summary>

			$('#join-form').on('submit', function (e) {
				e.preventDefault();

				var ud = $(this).serializeObject();
				chat.joinRoom(ud);
			});

			$('#chat-form').on('submit', function (e) {
				e.preventDefault();
				var $form = $(this);

				var messageObj = $form.serializeObject();
				chat.sendMessage(messageObj.message);
				$form.find(':text').val('');
			});

			$(document)
				.on('click', '#contacts .buttons .connect', function (e) {
					e.preventDefault();

					var contact = $(this).parents('.contact').addClass('current').data();
					chat.connect(contact.name);
				})
				.on('click', '#contacts .buttons .disconnect', function (e) {
					e.preventDefault();

					var contact = $(this).parents('.contact').data();
					chat.disconnect(contact.name);
				})
				.toggleMediaStream('.mute-video', '#video-cell .person .mute-video', 'videoEnabled')
				.toggleMediaStream('.mute-audio', '#video-cell .person .mute-audio', 'audioEnabled');
		},

		joinRoom: function (ud) {
			$('#step1, #step2').toggle();
			userData = ud;

			var authManager = new xRtc.AuthManager();

			//connection = new xRtc.Connection(userData.name)
			connection = new xRtc.Connection(userData, { autoReply: settings.autoAcceptCall }, authManager)
				.on(xrtc.Connection.events.streamAdded, function (data) {
					chat.addVideo(data);
					chat.contactsList.updateState();
				})
				.on(xrtc.Connection.events.initialized, function() {
				})
				.on(xrtc.Connection.events.offerCreating, function () {
					textChannel = connection.createDataChannel('textChat');

					if (textChannel) {
						chat.subscribe(textChannel, xrtc.DataChannel.events);

						textChannel.on(xrtc.DataChannel.events.message, function (msgData) {
							chat.addMessage(msgData.userId, msgData.message);
						});
					} else {
						chat.addSystemMessage('Failed to create data channel. You need Chrome M25 or later with --enable-data-channels flag.');
					}
				})
				.on(xrtc.Connection.events.dataChannelCreated, function (data) {
					textChannel = data.channel;
					chat.subscribe(textChannel, xrtc.DataChannel.events);

					textChannel.on(xrtc.DataChannel.events.message, function (msgData) {
						chat.addMessage(msgData.userId, msgData.message);
					});
				})
				.on(xrtc.Connection.events.connectionEstablished, function (participantId) {
					console.log('Connection is established.');
					chat.addSystemMessage('p2p connection has been established with ' + participantId + '.');
				})
				.on(xrtc.Connection.events.connectionClosed, function (participantId) {
					chat.contactsList.refreshParticipants();
					chat.removeVideo(participantId);
					chat.addSystemMessage('p2p connection with ' + participantId + ' has been closed.');
				})
				.on(xrtc.Connection.events.offerDeclined, function (participantId) {
					chat.contactsList.refreshParticipants();
					chat.addSystemMessage(participantId + ' has declined your call');
				})
				.on(xrtc.Connection.events.stateChanged, function (state) {
					chat.contactsList.updateState(state);
				});

			if (!settings.autoAcceptCall) {
				connection.on(xrtc.Connection.events.incomingCall, function(call) {
					chat.acceptCall(call);
				});
			}

			userData = connection.getUserData();

			// heartbeat interval is 30sec
			//serverConnector = new xRtc.ServerConnector({ pingInterval: 30000 });

			// heartbeat interval is not defined (infinite)
			//serverConnector = new xRtc.ServerConnector({ pingInterval: null });

			//heartbeat interval is 5sec (default value)
			serverConnector = new xRtc.ServerConnector();

			room = new xRtc.Room(serverConnector)
				.on(xrtc.Room.events.participantsUpdated, function (data) {
					chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.participantConnected, function (data) {
					chat.addSystemMessage(data.participantId + ' entered the room.');

					chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.participantDisconnected, function (data) {
					chat.addSystemMessage(data.participantId + ' left the room.');

					chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.join, function () {
					chat.addSystemMessage('You have connected to the server.');
				})
				.on(xrtc.Room.events.leave, function () {
					chat.addSystemMessage('You have been disconnectod by the server.');
					chat.addSystemMessage('Trying reconnect with the server.');

					//todo: possible this is redundant
					authManager.getToken(userData, function (token) {
						room.join(token);
					});
				})
				.on(xrtc.Room.events.tokenExpired, function (data) {
					chat.addSystemMessage('Your token is expired.');
				});

			room.addHandshake(connection.getHandshake());

			/*connection.addMedia({
				video: {
					mandatory: {
						mediaSource: 'screen'
					}
				},
				audio: true
			});*/

			/*connection.addMedia({
				audio: true
			});*/

			/*connection.addMedia({
				video: true
				audio: true
			});*/

			/*connection.addMedia({
				video: true
				audio: true
			});*/

			/*connection.addMedia({
				video: {
					mandatory: {
						maxWidth: 320,
						maxHeight: 180
					}
				},
				audio: true
			});*/

			/*connection.addMedia({
				video: {
					mandatory: {
						maxWidth: 640,
						maxHeight: 360
					}
				},
				audio: true
			});*/

			/*connection.addMedia({
				video: {
					mandatory: {
						maxWidth: 1280,
						maxHeight: 720
					}
				},
				audio: true
			});*/

			connection.addMedia();

			chat.subscribe(serverConnector, xrtc.ServerConnector.events);
			chat.subscribe(connection, xrtc.Connection.events);
			chat.subscribe(connection.getHandshake(), xrtc.HandshakeController.events);
			chat.subscribe(room, xrtc.Room.events);

			authManager.getToken(userData, function (token) {
				room.join(token);
			});
		},

		leaveRoom: function () {
			room.leave();
			$('#step1, #step2').toggle();
		},

		acceptCall: function (incomingCall) {
			/*
			//todo: possible to decline call if any connection already is established
			if (connection.getState() === 'connected') {
				incomingCall.decline();
				return;
			}*/

			//todo: make it more pretty
			if (confirm('User "' + incomingCall.participantName + '" is calling to you. Would you like to answer?')) {
				incomingCall.accept();
			} else {
				incomingCall.decline();
			}
		},

		sendMessage: function (message) {
			console.log('Sending message...', message);
			if (textChannel) {
				textChannel.send(message);
				chat.addMessage(userData.name, message, true);
			} else {
				chat.addSystemMessage('DataChannel is not created. Please, see log.');
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
			chat.addMessage(systemName, message);
		},

		connect: function (contact) {
			console.log('Connecting to participant...', contact);

			var options = $('#connection-form').serializeObject();
			connection.startSession(contact, options);
		},

		disconnect: function (contact) {
			console.log('Disconnection from participant...', contact);

			connection.endSession();
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
					roomName: room.getName()
				};
				$('#contacts-cell').empty().append($('#contacts-info-tmpl').tmpl(contactsData));

				var contacts = this.convertContacts(room.getParticipants());
				for (var index = 0, len = contacts.length; index < len; index++) {
					this.addParticipant(contacts[index]);
				}

				this.updateState();
			},

			convertContacts: function (participants) {
				var contacts = [],
					currentName = userData.name;

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

				state = state || connection.getState();

				//var contacts = $('#contacts').removeClass().addClass(state != 'not-ready' ? state : 'ready').find('.contact').removeClass('current');
				var contacts = $('#contacts').removeClass().addClass(state).find('.contact').removeClass('current');

				if (!freeStates[state]) {
					contacts.filter('[data-name="' + connection.getRemoteParticipantName() + '"]').addClass('current');
				}
			}
		},

		addVideo: function (data) {
			var stream = data.stream;
			var participantId = data.participantId;

			stream.on(xrtc.Stream.events.ended, function (streamData) {
				chat.removeVideoById(streamData.id);
			});

			var videoData = {
				name: participantId,
				isMe: stream.isLocal(),
				isVideoAvailable: stream.videoAvailable,
				isAudioAvailable: stream.audioAvailable,
				id: stream.getId()
			};

			var participantItem = $('#video-tmpl').tmpl(videoData);
			$('#video').append(participantItem);

			var video = participantItem.find('video')
				.removeClass('hide')
				.get(0);
			stream.assignTo(video);

			participantItem.data('stream', stream);
		},

		removeVideo: function (participantId) {
			$('#video .person[data-name="' + participantId + '"]').remove();
		},

		removeVideoById: function (id) {
			$('#' + id).closest('.person').remove();
		},

		clearStreams: function () {
			$('#video .person').each(function () {
				var item = $(this);
				if (!item.hasClass('my')) {
					chat.removeVideo(item.data('name'));
				}
			});
		},

		setLogger: function (value) {
			logger = value;
		},

		getServerConnector: function () {
			return serverConnector;
		},

		subscribe: function (eventDispatcher, events) {
			if (typeof eventDispatcher.on === "function") {
				for (var eventPropertyName in events) {
					(function (eventName) {
						eventDispatcher.on(eventName, function () {
							if (logger) {
								console.log('CHAT', eventDispatcher.className, eventName, Array.prototype.slice.call(arguments));
							}
						});
					})(events[eventPropertyName]);
				}
			}
		}
	});

})(chat, xRtc);

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
	xRtc.Logger.enable({ info: true, debug: true, warning: true, error: true, test: true });

	chat.init();
	chat.setLogger(true);
	//wsTest.init();

	xRtc.AuthManager.settings.tokenHandler = "getToken.php";
	xRtc.AuthManager.settings.iceHandler = "getIceServers.php";

	var pageParams = getParams();
	setIceServers(pageParams);

	var username = pageParams.name;
	if (username) {
		$('#join-form').find(':text[name="name"]').val(username).end().trigger('submit');
	}
});
