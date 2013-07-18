﻿'use strict';

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
			try {
				stream[property] = !btn.hasClass('disable');
			} catch (ex) {
				chat.addSystemMessage(ex.message);
			}
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
		remoteParticipantId = null,
		localMediaStreamObtained = null,
		localMediaStream = null,
		authManager = null,
		serverConnector = null,
		room = null,
		textChannel = null,
		userName = null,
		roomInfo = null,
		systemName = 'APP',
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
			userName = ud.name;
			roomInfo = {
				domain: ud.domain,
				application: ud.application,
				name: ud.room
			};

			xrtc.getUserMedia({ video: true, audio: true },
				function (stream) {
					chat.addVideo({ stream: stream, isLocalStream: true, userId: userName });
					localMediaStreamObtained = true;
					localMediaStream = stream;
					chat.contactsList.updateState();
				},
				function (err) {
					chat.addSystemMessage('Get media stream error. ' + err);
				});

			authManager = new xrtc.AuthManager();

			// heartbeat interval is 30sec
			//serverConnector = new xrtc.ServerConnector({ pingInterval: 30000 });

			// heartbeat interval is not defined (infinite)
			//serverConnector = new xrtc.ServerConnector({ pingInterval: null });

			//heartbeat interval is 5sec (default value)
			//serverConnector = new xrtc.ServerConnector();
			serverConnector = new xrtc.ServerConnector();

			room = new xrtc.Room(roomInfo, authManager, serverConnector)
				.on(xrtc.Room.events.participantsUpdated, function (data) {
					chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.participantConnected, function (data) {
					chat.addSystemMessage("'" + data.participantId + "' entered the room.");

					chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.participantDisconnected, function (data) {
					chat.addSystemMessage("'" + data.participantId + ' left the room.');

					chat.contactsList.refreshParticipants();
				})
				.on(xrtc.Room.events.enter, function () {
					roomInfo = room.getInfo();
					chat.addSystemMessage('You have connected to the server.');
				})
				.on(xrtc.Room.events.leave, function () {
					chat.addSystemMessage('You have been disconnectod by the server.');

					chat.addSystemMessage('Trying reconnect with the server.');
					room.enter(userName, { autoReply: settings.autoAcceptCall });
				})
				.on(xrtc.Room.events.tokenInvalid, function (data) {
					chat.addSystemMessage('Your token is invalid. Maybe the token is expired.');
				})
				.on(xrtc.Room.events.connectionCreated, function (connectionData) {
					connection = connectionData.connection;
					remoteParticipantId = connectionData.userId;

					chat.subscribe(connection, xrtc.Connection.events);

					// user specific data which was used in room.connect method
					var data = connection.getData();

					connection
						.on(xrtc.Connection.events.localStreamAdded, function (data) { })
						.on(xrtc.Connection.events.remoteStreamAdded, function (data) {
							data.isLocalStream = false;
							chat.addVideo(data);
							chat.contactsList.updateState();
						})
						.on(xrtc.Connection.events.dataChannelCreated, function (data) {
							textChannel = data.channel;
							chat.subscribe(textChannel, xrtc.DataChannel.events);

							textChannel.on(xrtc.DataChannel.events.message, function (msgData) {
								chat.addMessage(msgData.userId, msgData.message);
							});
						})
						.on(xrtc.Connection.events.dataChannelCreationError, function (data) {
							chat.addSystemMessage('Failed to create data channel ' + data.channelName + '. Make sure that your Chrome M25 or later with --enable-data-channels flag.');
						})
						.on(xrtc.Connection.events.connectionOpening, function (data) {
							//connection.createDataChannel('textChat');
						})
						.on(xrtc.Connection.events.connectionEstablished, function (data) {
							console.log('Connection is established.');
							chat.addSystemMessage("p2p connection has been established with '" + data.userId + "'.");
						})
						.on(xrtc.Connection.events.connectionClosed, function (data) {
							chat.contactsList.refreshParticipants();
							chat.removeVideo(data.userId);
							chat.addSystemMessage("p2p connection with '" + data.userId + "' has been closed.");
							connection = null;
							remoteParticipantId = null;
						})
						.on(xrtc.Connection.events.stateChanged, function (state) {
							chat.contactsList.updateState(state);
						});

					connection.addStream(localMediaStream);
				})
				.on(xrtc.Room.events.incomingConnection, function (data) {
					chat.acceptCall(data);
				})
				.on(xrtc.Room.events.connectionDeclined, function (data) {
					chat.contactsList.refreshParticipants();
					chat.addSystemMessage("'" + data.userId +  "' has declined your call.");
					connection = null;
					remoteParticipantId = null;
				});

			chat.subscribe(authManager, xrtc.AuthManager.events);
			chat.subscribe(serverConnector, xrtc.ServerConnector.events);
			chat.subscribe(room, xrtc.Room.events);

			room.enter(userName, { autoReply: settings.autoAcceptCall });
		},

		/*leaveRoom: function () {
			room.leave();
			$('#step1, #step2').toggle();
		},*/

		acceptCall: function (incomingConnectionData) {
			//todo: possible to decline call if any connection already is established
			if (connection && connection.getState() === 'connected') {
				incomingConnectionData.decline();
				return;
			}

			//todo: need to think about senderId property name
			if (confirm('User "' + incomingConnectionData.userId + '" is calling to you. Would you like to answer?')) {
				incomingConnectionData.accept();
			} else {
				incomingConnectionData.decline();
			}
		},

		sendMessage: function (message) {
			console.log('Sending message...', message);
			if (textChannel) {
				textChannel.send(message);
				chat.addMessage(userName, message, true);
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
			options.createDataChannel = 'auto';

			// any user data object
			options.data = { roomConnection: true, myMessage: "hello world" };

			room.connect(contact, options);
		},

		disconnect: function (contact) {
			console.log('Disconnection from participant...', contact);

			connection.close();
		},

		contactsList: {
			addParticipant: function (participant) {
				$('#contacts').append($('#contact-info-tmpl').tmpl(participant));
			},

			removeParticipant: function (participantId) {
				$('#contacts').find('.contact[data-name="' + participantId + '"]').remove();
			},

			refreshParticipants: function () {
				roomInfo = room.getInfo();
				var contactsData = {
					roomName: roomInfo.name
				};

				$('#contacts-cell').empty().append($('#contacts-info-tmpl').tmpl(contactsData));

				var contacts = this.convertContacts(room.getParticipants());
				for (var index = 0, len = contacts.length; index < len; index++) {
					this.addParticipant(contacts[index]);
				}

				this.updateState();
			},

			convertContacts: function (participants) {
				var contacts = [];

				for (var i = 0, len = participants.length; i < len; i++) {
					var name = participants[i];
					contacts[i] = {
						name: name,
						isMe: name === userName
					};
				}

				return contacts;
			},

			updateState: function (state) {
				var freeStates = {
					'ready': true,
					'not-ready': false
				};

				if (connection) {
					state = state || connection.getState();
				} else if (localMediaStreamObtained) {
					state = 'ready';
				}

				var contacts = $('#contacts').removeClass().addClass(state).find('.contact').removeClass('current');

				if (!freeStates[state] && remoteParticipantId) {
					contacts.filter('[data-name="' + remoteParticipantId + '"]').addClass('current');
				}
			}
		},

		addVideo: function (data) {
			var stream = data.stream;
			var userId = data.userId;

			stream.on(xrtc.Stream.events.ended, function (streamData) {
				chat.removeVideoById(streamData.id);
			});

			var videoData = {
				name: userId,
				isMe: data.isLocalStream,
				isVideoAvailable: stream.videoAvailable,
				isAudioAvailable: stream.audioAvailable,
				id: stream.getId()
			};

			var participantItem = $('#video-tmpl').tmpl(videoData);
			$('#video').append(participantItem);

			var video = participantItem.find('video')
				.removeClass('hide')
				.get(0);

			/*
			if (xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.chrome) {
				if (!data.isLocalStream) {
					window.setInterval(function() {
						chat.addSystemMessage(
							"Frames='" + video.webkitDecodedFrameCount +
								//"', AudioBytes='" + video.webkitAudioDecodedByteCount +
								//"', VideoBytes='" + video.webkitVideoDecodedByteCount +
								"', DroppedFrames='" + video.webkitDroppedFrameCount + "'.");
					}, 3000);
				}
			} else if (xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.firefox) {
				if (!data.isLocalStream) {
					window.setInterval(function () {
						chat.addSystemMessage(
							"PaintedFrames='" + video.mozPaintedFrames +
								//"', Frames='" + video.mozDecodedFrames +
								//"', FrameDelay='" + video.mozFrameDelay + 
								//"', ParsedFrames='" + video.mozParsedFrames +
								//"', PresentedFrames='" + video.mozPresentedFrames + "'.");
								"'.");
					}, 3000);
				}
			}
			*/

			stream.assignTo(video);

			if (data.isLocalStream) {
				// automatically setting volume to zero, so that no echoing / feedback occurs
				// volume == 1 if enabled, volume == 0 if disabled
				video.volume = 0;
			}

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
	//xRtc.Logger.enable({ info: true, debug: true, warning: true, error: true, test: true });
	xRtc.Logger.enable({ debug: true, warning: true, error: true, test: true });

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
