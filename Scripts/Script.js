'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	exports.wsTest = {
		init: function () {
			$('#ws-test').removeClass('hide');
			$('#ws-form').on('submit', function(e) {
				e.preventDefault();
				var $form = $(this);

				exports.chat._handshakeController[$(".ws-message-type select").val()](
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
		
		_handshakeController: null,
		_connection: null,
		isLocalStreamAdded: false,
		systemName: 'SYSTEM',

		/// <summary>The method for the initializing of chat</summary>
		init: function () {
			$('#join-form').on('submit', function (e) {
				e.preventDefault();

				var userData = $(this).serializeObject();
				exports.chat.joinRoom(userData);
			});

			$('#chat-form').on('submit', function(e) {
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

			var handshake = exports.chat._handshakeController = new xRtc.HandshakeController();
			handshake
				.on(xrtc.HandshakeController.events.participantsUpdated, function (data) {
					exports.chat.contactsList.refreshParticipants(exports.chat.contactsList.convertContacts(data));
				})
				.on(xrtc.HandshakeController.events.participantConnected, function (data) {
					exports.chat.contactsList.addParticipant({ name: data.paticipantId, isMe: false });
					exports.chat.addSystemMessage(data.paticipantId + '  entered the room.');
				})
				.on(xrtc.HandshakeController.events.participantDisconnected, function (data) {
					exports.chat.contactsList.removeParticipant(data.paticipantId);
					exports.chat.addSystemMessage(data.paticipantId + ' left the room.');
				})
				.on(xrtc.HandshakeController.events.connectionClose, function (data) {
					exports.chat.contactsList.refreshParticipants([]);
					exports.chat.addSystemMessage('You was disconnected by the server.');
				})
				.on(xrtc.HandshakeController.events.receiveBye, function (data) {
					exports.chat.removeParticipant(data.senderId);
					exports.chat.addSystemMessage(data.senderId + ' closed p2p connection.');
				});

			var connection = exports.chat._connection = new xRtc.Connection(userData, handshake);
			connection.connect();

			connection
				.on(xrtc.Connection.events.streamAdded, function(data) {
					exports.chat.addParticipant(data);
					if (data.isLocal) {
						exports.chat.isLocalStreamAdded = true;
						exports.chat.contactsList.updateState();
					}
				})
				.on(xrtc.Connection.events.initialized, function () {
					exports.chat._textChannel = connection.createDataChannel('textChat');
					
					if (exports.chat._textChannel) {
						exports.chat.subscribe(exports.chat._textChannel, xrtc.DataChannel.events);

						exports.chat._textChannel.on(xrtc.DataChannel.events.message, function(messageData) {
							var message = JSON.parse(messageData.message);
							exports.chat.addMessage(message.userId, message.message);
						});
					} else {
						exports.chat.addSystemMessage('Failed to create data channel. You need Chrome M25 or later with --enable-data-channels flag.');
					}
				})
				.on(xrtc.Connection.events.connectionEstablished, function(participantId) {
					console.log('Connection is established.');
					exports.chat.addSystemMessage('p2p connection has been established with ' + participantId + '.');
				})
				.on(xrtc.Connection.events.connectionClosed, function (participantId) {
					exports.chat.removeParticipant(participantId);
					exports.chat.addSystemMessage('p2p connection with ' + participantId + ' has been closed.');
				})
				.on(xrtc.Connection.events.stateChanged, function (state) {
					exports.chat.contactsList.updateState(state);
				});

			connection.addMedia();

			exports.chat.subscribe(connection, xrtc.Connection.events);
			exports.chat.subscribe(handshake, xrtc.HandshakeController.events);
		},

		leaveRoom: function () {

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

			//todo: need to fix chat scrolling behaviour
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
			this.removeParticipant(contact);
		},

		contactsList: {
			addParticipant: function (participant) {
				//todo: sort participants
				$('#contacts').append($('#contact-info-tmpl').tmpl(participant));
			},

			removeParticipant: function (participantId) {
				$('#contacts').find('.contact[data-name="' + participantId + '"]').remove();
			},

			refreshParticipants: function (contacts) {
				var userData = exports.chat._userData,
					contactsData = {
						roomInfo: {
							domain: userData.domain,
							application: userData.application,
							room: userData.room
						}
					};
				
				contacts.sort(function(a, b) {
					if (a.name < b.name)
						return -1;
					if (a.name > b.name)
						return 1;
					return 0;
				});

				$('#contacts-cell').empty().append($('#contacts-info-tmpl').tmpl(contactsData));

				for (var index = 0, len = contacts.length; index < len; index++) {
					this.addParticipant(contacts[index]);
				}

				this.updateState();
			},

			convertContacts: function (data) {
				var contacts = [],
					currentName = exports.chat._userData.name;

				for (var i = 0, len = data.connections.length; i < len; i++) {
					var name = data.connections[i];
					contacts[i] = {
						name: name,
						isMe: name === currentName
					};
				}

				return contacts;
			},
			
			updateState: function(state) {
				state = state || exports.chat._connection.getState();
				//todo: move to Connection and unify it
				var states = {
					'notinitialized': exports.chat.isLocalStreamAdded ? 'ready' : 'not-ready',
					'new': exports.chat.isLocalStreamAdded ? 'ready' : 'not-ready',
					'opening': 'connecting',
					'active': 'connected',
					'closing': 'disconnecting',
					'closed': exports.chat.isLocalStreamAdded ? 'ready' : 'not-ready',
					'stable': 'connected', // Chrome M26
					'have-local-offer': 'ready', // Chrome M26
					'have-remote-offer': 'connecting' // Chrome M26
				};

				var cssClass = states[state];
				$('#contacts').removeClass().addClass(cssClass);

				if ((cssClass === 'ready') || (cssClass === 'not-ready')) {
					$('#contacts .contact').removeClass('current');
				} else {
					$('#contacts .contact').filter('[data-name="' + exports.chat._connection._remoteParticipant + '"]').addClass('current');
				}
			}
		},

		addParticipant: function (streamData) {
			var data = {
				name: streamData.participantId,
				isMe: streamData.isLocal
			};

			$.each($('#video .person'), function (index, value) {
				if (!$(value).hasClass('my')) {
					value.remove();
				}
			});

			var participantItem = $('#video-tmpl').tmpl(data);
			$('#video').append(participantItem);
			


			//todo: for firefox 'src' does not work, in future remove it
			//todo: move this logic into Connection class, e.g. create method 'attach'
			//todo: set timeout (look at adapter.js)
			setTimeout(function () {
				var video = participantItem.find('video').removeClass('hide').get(0);
				var isFirefox = !!navigator.mozGetUserMedia;
				if (isFirefox) {
					video.mozSrcObject = streamData.stream;
				} else {
					video.src = streamData.url;
				}
			}, 100);
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
		var settings = xRtc.Connection.settings;
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