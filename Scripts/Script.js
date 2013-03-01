'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	exports.chat = {
		_handshakeController: null,
		_connection: null,
		isLocalStreamAdded: false,

		init: function () {
			$('#join-form').on('submit', function (e) {
				e.preventDefault();

				var userData = $(this).serializeObject();
				exports.chat.joinRoom(userData);
			});

			$('#chat-form')
				.on('submit', function (e) {
					e.preventDefault();
					var $form = $(this);

					var message = $form.serializeObject();
					exports.chat.sendMessage(message);
					$form.find(':text').val('');
				});

			$(document)
				.on('click', '#contacts .buttons .connect', function(e) {
					e.preventDefault();

					$('#contacts').removeClass().addClass('connecting');
					var contact = $(this).parents('.contact').addClass('current').data();
					exports.chat.connect(contact.name);
				})
				.on('click', '#contacts .buttons .disconnect', function(e) {
					e.preventDefault();

					$('#contacts').removeClass().addClass(exports.chat.isLocalStreamAdded ? 'ready' : 'not-ready');
					var contact = $(this).parents('.contact').removeClass('current').data();
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
				})
				.on(xrtc.HandshakeController.events.participantDisconnected, function (data) {
					exports.chat.contactsList.removeParticipant(data.paticipantId);
				})
				.on(xrtc.HandshakeController.events.connectionClose, function (data) {
					exports.chat.contactsList.refreshParticipants([]);
				})
				.on(xrtc.HandshakeController.events.receiveBye, function (data) {
					exports.chat.removeParticipant(data.senderId);
					$('#contacts').removeClass().addClass('ready');
				});

			var connection = exports.chat._connection = new xRtc.Connection(userData, handshake);
			connection.connect();

			connection
				.on(xrtc.Connection.events.streamAdded, function (data) {
					exports.chat.addParticipant(data);
					if (data.isLocal) {
						exports.chat.isLocalStreamAdded = true;
						$('#contacts').removeClass().addClass('ready');
					}
				})
				.on(xrtc.Connection.events.peerConnectionCreation, function () {
					exports.chat._textChannel = connection.createDataChannel('textChat');
					if (exports.chat._textChannel) {
						exports.chat.subscribe(exports.chat._textChannel, xrtc.DataChannel.events);

						exports.chat._textChannel.on(xrtc.DataChannel.events.message, function (messageData) {
							var message = JSON.parse(messageData.message);
							exports.chat.addMessage(message.participantId, message.message);
						});
					}
				})
				.on(xrtc.Connection.events.connectionEstablished, function (participantId) {
					console.log('Connection is established.');
					$('#contacts')
						.removeClass().addClass('connected')
						.find('.contact[data-name="' + participantId + '"]').addClass('current');
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
				exports.chat.addMessage('SYSTEM', 'Failed to create data channel. You need Chrome M25 or later with --enable-data-channels flag');
			}
		},

		addMessage: function (name, message, isMy) {
			var messageData = { name: name, message: message, isMy: !!isMy };

			var $chat = $('#chat');
			$chat
				.append($('#chat-message-tmpl').tmpl(messageData))
				.scrollTop($chat.children(':last-child').position().top);
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
				$('#contacts').append($('#contact-info-tmpl').tmpl(participant));
			},

			removeParticipant: function (participant) {
				$('#contacts').find('.contact[data-name="' + participant.name + '"]').remove();
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

				$('#contacts-cell').empty().append($('#contacts-info-tmpl').tmpl(contactsData));

				for (var index = 0, len = contacts.length; index < len; index++) {
					this.addParticipant(contacts[index]);
				}

				$('#contacts').removeClass().addClass(exports.chat.isLocalStreamAdded? 'ready' : 'not-ready');
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
			}
		},

		addParticipant: function (streamData) {
			var data = {
				name: streamData.participantId,
				isMe: streamData.isLocal
			};

			var participantItem = $('#video-tmpl').tmpl(data);
			$('#video').append(participantItem);

			participantItem.find('video').attr('src', streamData.url).removeClass('hide');
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

$(document).ready(function () {
	$.fn.serializeObject = function () {
		var formArray = this.serializeArray(), formData = {};

		for (var i = 0, len = formArray.length; i < len; i++) {
			formData[formArray[i].name] = formArray[i].value;
		}

		return formData;
	};

	chat.init();

	var username = getParams().name;
	if (username) {
		$('#join-form').find(':text[name="name"]').val(username).end().trigger('submit');
	}

	/*chat.contactsList.refreshParticipants([
		{ name: 'Alex', isMe: true },
		{ name: 'Alex2', isMe: false },
		{ name: 'Alex3', isMe: false },
		{ name: 'Alex4', isMe: false },
		{ name: 'Alex5', isMe: false }
	]);*/
});