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
	var _room = null,
		_connection = null,
		_localMediaStream = null,
		_remoteParticipantId = null;

	xrtc.Class.extend(utils, {

		init : function() {
			// set middle tier service proxies (on server).
			// this is the server pages which handle the calls 
			// to the xirsys services.
			xrtc.AuthManager.settings.tokenHandler = "/getToken.php";
			xrtc.AuthManager.settings.iceHandler = "/getIceServers.php";

			xrtc.Logger.enable({ debug: true, warning: true, error: true, test: true });
		},

		// accessors / properties
		room : function(r) {
			if (!!r) _room = r;
			return _room;
		},

		connection : function(c) {
			if (!!c) _connection = c;
			return _connection;
		},

		localMediaStream : function(l) {
			if (!!l) _localMediaStream = l;
			return _localMediaStream;
		},

		remoteParticipantId : function(r) {
			if (!!r) _remoteParticipantId = r;
			return _remoteParticipantId;
		},

		// utility functions

		// once connection created, assign necessary events
		connectionCreated : function(connectionData) {
			_connection = connectionData.connection;
			_remoteParticipantId = connectionData.userId;

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
				.on( xrtc.Connection.events.stateChanged, function (state) {
					utils.refreshRoom();
				});
				// assign empty handlers. you may wish to add real functionality, here.
				.on( xrtc.Connection.events.localStreamAdded, function (data) { })
				.on( xrtc.Connection.events.connectionEstablished, function (data) { })
				.on( xrtc.Connection.events.connectionClosed, function (data) { })

			_connection.addStream(_localMediaStream);
		},
		
		// assign stream to a video DOM tag
		addVideo : function(data) {
			var stream = data.stream;
			var userId = data.userId;

			var video = (data.isLocalStream) ? $('#vid1').get(0) : $('#vid2').get(0);

			stream.assignTo(video);

			if ( data.isLocalStream ) {
				video.volume = 0;
			}
		},

		// update drop down list of remote peers
		refreshRoom : function() {
			roomInfo = _room.getInfo();

			$('#userlist').empty();

			var contacts = utils.convertContacts(_room.getParticipants());
			for (var index = 0, len = contacts.length; index < len; index++) {
				utils.addParticipant(contacts[index]);
			}
		},

		// call accept on incoming stream
		acceptCall : function(incomingConnectionData) {
			incomingConnectionData.accept();
		},

		// return a list of participants excluding local users name
		convertContacts : function(participants) {
			var contacts = [];

			for (var i = 0, len = participants.length; i < len; i++) {
				var name = participants[i];
				if ( !!name && name != $("#username").val() )
					contacts.push(name);
			}

			return contacts;
		},

		// add remote peer name to contacts drop down list
		addParticipant : function(participant) {
			$('#userlist').append(
				'<option value="' + participant + '">' + participant + '</option>'
			);
		},

		// remove remote peer from contacts drop down list
		removeParticipant : function(participant) {
			$('#userlist').find('.option[value="' + participant + '"]').remove();
		},

		// subscribe to events on object eventDispatcher
		subscribe : function(eventDispatcher, events) {
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