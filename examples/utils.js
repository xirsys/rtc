/**
 * @author : Lee Sylvester
 * @copyright : XirSys 2013
 * 
 * @desc this utilities file encapsulates the users list functionality. it is
 * contained within this file so as to not clutter the important steps required
 * to establish connections as detailed in the demo html files.
 **/

var utils = {};
(function (utils, xrtc) {
	var _av = false,
		_room = null,
		_userName = null,
		_textChannel = null,
		_connection = null,
		_localMediaStream = null,
		_remoteUsertId = null;

	xrtc.Class.extend(utils, {

		init: function() {
			// set middle tier service proxies (on server).
			// this is the server pages which handle the calls 
			// to the xirsys services.
			xrtc.AuthManager.settings.tokenHandler = "../getToken.php";
			xrtc.AuthManager.settings.iceHandler = "../getIceServers.php";

			// enable logging, for sanities sake.
			xrtc.Logger.enable({ debug: true, warning: true, error: true, test: true });
		},

		// accessors / properties
		room: function(r) {
			if (!!r) _room = r;
			return _room;
		},

		username: function(u) {
			if (!!u) _userName = u;
			return _userName;
		},

		connection: function(c) {
			if (!!c) _connection = c;
			return _connection;
		},

		localMediaStream: function(l) {
			if (!!l) _localMediaStream = l;
			return _localMediaStream;
		},

		remoteUserId: function(r) {
			if (!!r) _remoteUsertId = r;
			return _remoteUsertId;
		},

		// utility functions

		// proxy getUserMedia, so we can log if video/audio is being requested
		getUserMedia: function(data, success, fail) {
			xrtc.getUserMedia(
				data,
				success,
				fail
			);
			_av = true;
		},

		// once connection created, assign necessary events
		connectionCreated: function(connectionData) {
			_connection = connectionData.connection;
			_remoteUsertId = connectionData.user.id;

			utils.subscribe( _connection, xrtc.Connection.events );

			var data = _connection.getData();

			_connection
				// on remote stream, assign to video DOM object and refresh users list
				.on( xrtc.Connection.events.remoteStreamAdded, function (data) {
					data.isLocalStream = false;
					console.log("adding remote stream");
					utils.addVideo(data);
					utils.refreshRoom();
				})
				// update users list on state change
				.on( xrtc.Connection.events.stateChanged, function (stateData) {
					utils.refreshRoom();
				})
				// handler for simple chat demo's data channel
				.on( xrtc.Connection.events.dataChannelCreated, function (data) {
					_textChannel = data.channel;
					utils.subscribe(_textChannel, xrtc.DataChannel.events);
					_textChannel.on(xrtc.DataChannel.events.sentMessage, function (msgData) {
						utils.addMessage(_userName, msgData.message, true);
					}).on(xrtc.DataChannel.events.receivedMessage, function (msgData) {
						utils.addMessage(_textChannel.getRemoteUser().name, msgData.message);
					});
					utils.addMessage("SYSTEM", "You are now connected.");

					// sending 'Hello world' message
					//textChannel.send('Hello world');
				}).on(xrtc.Connection.events.dataChannelCreationError, function(data) {
					console.log('Failed to create data channel ' + data.channelName + '. Make sure that your Chrome M25 or later with --enable-data-channels flag.');
				})
				// assign empty handlers. you may wish to add real functionality, here.
				.on( xrtc.Connection.events.localStreamAdded, function (data) { })
				.on( xrtc.Connection.events.connectionEstablished, function (data) { })
				.on( xrtc.Connection.events.connectionClosed, function (data) { });

			if (_av)
				_connection.addStream(_localMediaStream);
		},

		// assign stream to a video DOM tag
		addVideo: function(data) {
			var stream = data.stream;

			var video = (data.isLocalStream) ? $('#vid1').get(0) : $('#vid2').get(0);

			stream.assignTo(video);

			if ( data.isLocalStream ) {
				video.volume = 0;
			}
		},

		sendMessage: function (message) {
			console.log('Sending message...', message);
			if (_textChannel) {
				_textChannel.send(message);
			} else {
				console.log('DataChannel is not created. Please, see log.');
			}
		},

		addMessage: function (name, message, isMy) {
			var $chat = $('#chatwindow');

			//todo: need to fix chat scrolling behavior
			$chat
				.append("<div><span>" + name + " : </span>" + message + "</div>")
				.scrollTop($chat.children().last().position().top + $chat.children().last().height());
		},

		// update drop down list of remote peers
		refreshRoom: function() {
			roomInfo = _room.getInfo();

			$('#userlist').empty();

			var contacts = utils.convertContacts(_room.getUsers());
			for (var index = 0, len = contacts.length; index < len; index++) {
				utils.addUser(contacts[index]);
			}
		},

		// call accept on incoming stream
		acceptCall: function(incomingConnectionData) {
			incomingConnectionData.accept();
		},

		// return a list of users excluding local users name
		convertContacts: function(users) {
			var contacts = [];

			for (var i = 0, len = users.length; i < len; i++) {
				var name = users[i].name;
				if ( !!name && name != $("#username").val() )
					contacts.push(users[i]);
			}

			return contacts;
		},

		// add remote peer name to contacts drop down list
		addUser: function(user) {
			$('#userlist').append(
				'<option value="' + user.name + '">' + user.name + '</option>'
			);
		},

		// remove remote peer from contacts drop down list
		removeUser: function(user) {
			$('#userlist').find('.option[value="' + user.name + '"]').remove();
		},

		// subscribe to events on object eventDispatcher
		subscribe: function(eventDispatcher, events) {
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

	});

})(utils, xRtc);