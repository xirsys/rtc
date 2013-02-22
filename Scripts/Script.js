(function (exports) {
	var xrtc = exports.xRtc;

	exports.chat = {
		_handshakeController: null,
		_connection: null,

		init: function () {
			$('#join-form').on('submit', function (e) {
				e.preventDefault();

				var userData = $(this).serializeObject();
				exports.chat.joinRoom(userData);
			});

			$('#chat-form').on('submit', function(e) {
				e.preventDefault();
				
				var message = $(this).serializeObject();
				exports.chat.sendMessage(message);
			});

			$(document).on('click', '#contacts .button button', function (e) {
				e.preventDefault();
				

				var contact = $(this).parents('.contact').data();
				exports.chat.connect(contact.name);
			});
		},
		
		joinRoom: function (userData) {
			$('#step1, #step2').toggle();
			exports.chat._userData = userData;

			var handshake = exports.chat._handshakeController = new xRtc.HandshakeController();
			handshake.on(xrtc.HandshakeController.events.participantsUpdated, function (data) {
				var contacts = [],
					currentName = exports.chat._userData.name;
				
				for (var i = 0, len = data.connections.length; i < len; i++) {
					var name = data.connections[i];
					contacts[i] = {
						name: name,
						isMe: name === currentName
					};
				}

				exports.chat.refreshContactsList(contacts);
			});

			var connection = exports.chat._connection = new xRtc.Connection(userData, handshake);
			connection.connect();

			connection.on(xrtc.Connection.events.streamAdded, function (localStream) {
				$('#video .video:first video').show().attr('src', exports.webkitURL.createObjectURL(localStream));
			});

			connection.addMedia();
		},
		
		leaveRoom: function() {
			
		},
		
		sendMessage: function (message) {
			//todo: send message
			console.log('Sending message...' ,message);
		},
		
		addMessage: function (name, message, isMy) {
			var messageData = { name: name, message: message, isMy: isMy };
			
			var $chat = $('#chat');
			$chat
				.append($('#chat-message-tmpl').tmpl(messageData))
				.scrollTop($chat.children(':last-child').position().top);
		},
		
		connect: function (contact) {
			console.log('Connecting to participant...', contact);
			this._connection.startSession(contact);
		},
		
		refreshContactsList: function(contacts) {
			var contactsData = {
				roomInfo: {
					domain: exports.chat._userData.domain,
					application: exports.chat._userData.application,
					room: exports.chat._userData.room
				},
				contacts: contacts
			};

			$('#contacts-cell')
				.empty()
				.append($('#contacts-info-tmpl').tmpl(contactsData));
		}
	};
})(window);

$(document).ready(function () {
	$.fn.serializeObject = function() {
		var formArray = this.serializeArray(), formData = {};

		for (var i = 0, len = formArray.length; i < len; i++) {
			formData[formArray[i].name] = formArray[i].value;
		}

		return formData;
	};

	chat.init();

	//$('#join-form').trigger('submit');

	//chat.addMessage('Alex', 'Hello! How are you?', true);
	//chat.addMessage('Peter', 'I am fine!', false);
	//chat.addMessage('Peter', 'What is about you?', false);
	//chat.addMessage('Alex', 'Great! I have got a new car!', true);
	//chat.addMessage('Alex', 'Hello! How are you?', true);
	//chat.addMessage('Peter', 'I am fine!', false);
	//chat.addMessage('Peter', 'What is about you?', false);
	//chat.addMessage('Alex', 'Great! I have got a new car!', true);
	//chat.addMessage('Alex', 'Hello! How are you?', true);
	//chat.addMessage('Peter', 'I am fine!', false);
	//chat.addMessage('Peter', 'What is about you?', false);
	//chat.addMessage('Alex', 'Great! I have got a new car!', true);
	//chat.addMessage('Alex', 'Hello! How are you?', true);
	//chat.addMessage('Peter', 'I am fine!', false);
	//chat.addMessage('Peter', 'What is about you?', false);
	//chat.addMessage('Alex', 'Great! I have got a new car!', true);
	//chat.addMessage('Alex', 'Hello! How are you?', true);
	//chat.addMessage('Peter', 'I am fine!', false);
	//chat.addMessage('Peter', 'What is about you?', false);
	//chat.addMessage('Alex', 'Great! I have got a new car!', true);
});