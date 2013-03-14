///<reference path="~/Tests/jasmine/lib/jasmine-1.3.1/jasmine.js" />
///<reference path="~/Tests/jasmine/lib/sinon-1.6.0.js" />
///<reference path="~/Scripts/xRtc/Class.js" />
///<reference path="~/Scripts/xRtc/CommonError.js" />
///<reference path="~/Scripts/xRtc/Logger.js" />
///<reference path="~/Scripts/xRtc/EventDispatcher.js" />
///<reference path="~/Scripts/xRtc/Ajax.js" />
///<reference path="~/Scripts/xRtc/DataChannel.js" />
///<reference path="~/Scripts/xRtc/HandshakeController.js" />
///<reference path="~/Scripts/xRtc/Connection.js" />

describe("HandshakeController", function () {
	//xRtc.Logger.level = true;
	
	var handshakeController;
	var server;
	var webSocket;
	var webSocketStub;
	
	beforeEach(function () {
		handshakeController = new xRtc.HandshakeController();
		
		webSocket = sinon.stub(window, "WebSocket", function (url) {
			webSocketStub = this;
		});
		
		server = sinon.fakeServer.create();
		server.respondWith([200, {}, '{"P":"/ws","S":200,"D":{"value":"ws://turn.influxis.com:8003"},"E":null}']);
	});

	afterEach(function() {
		server.restore();
		webSocket.restore();
		webSocketStub = null;
	});
	

	it("can get WebSocket URL and establish connection", function () {
		handshakeController.connect('token');
		server.respond();

		expect(handshakeController._socket).not.toBeNull();
	});
	
	it("can get WebSocket URL recognise errors and serverError will be fired", function () {
		var obj = { eventHandler: function () { } };
		var spy = sinon.spy(obj, 'eventHandler');
		handshakeController.on(xRtc.HandshakeController.events.serverError, obj.eventHandler);
		
		handshakeController.connect('token');
		server.respondWith([200, {}, '{"P":"/ws","S":200,"E":["some error happened"],"D":null}']);
		server.respond();

		expect(handshakeController._socket).toBeNull();
		expect(spy.calledOnce);
	});

	it("can disconnect", function () {
		handshakeController.disconnect();
		expect(handshakeController._socket).toBeNull();
	});

	describe("Server (WebSocket) generates event", function () {
		var obj;
		var spy;

		beforeEach(function() {
			obj = { eventHandler: function () { } };
			spy = sinon.spy(obj, 'eventHandler');

			handshakeController.connect('token');
			server.respond();
		});

		afterEach(function() {
		});

		it("onopen and HanshakeController fires 'connectionOpen' event", function () {
			handshakeController.on(xRtc.HandshakeController.events.connectionOpen, obj.eventHandler);

			webSocketStub.onopen({});

			expect(spy.calledOnce);
		});

		it("onclose and HanshakeController fires 'connectionClose' event", function () {
			handshakeController.on(xRtc.HandshakeController.events.connectionClose, obj.eventHandler);

			webSocketStub.onclose({});

			expect(spy.calledOnce);
		});

		it("onerror and HanshakeController fires 'connectionError' event", function () {
			handshakeController.on(xRtc.HandshakeController.events.connectionError, obj.eventHandler);

			webSocketStub.onerror({});

			expect(spy.calledOnce);
		});

		describe("onmessage and HanshakeController fires appropriate event", function () {
			var peers_message = '{"Type":"peers","UserId":"username","TargetUserId":"","Room":"www.example.com/test_app/test_room","Message":"[\"username1\", \"username2\"]"}';
			it("server fires 'peers' event and HanshakeController fires 'participantsUpdated'. Server message: " + peers_message, function () {
				handshakeController.on(xRtc.HandshakeController.events.participantsUpdated, obj.eventHandler);

				webSocketStub.onmessage({ data: peers_message });

				expect(spy.calledOnce);
			});

			var peer_connected = '{"Type":"peer_connected","UserId":"username","TargetUserId":"","Room":"www.example.com/test_app/test_room","Message":"username1"}';
			it("server fires 'peer_connected' event and HanshakeController fires 'participantConnected'. Server message: " + peer_connected, function () {
				handshakeController.on(xRtc.HandshakeController.events.participantConnected, obj.eventHandler);

				webSocketStub.onmessage({ data: peer_connected });

				expect(spy.calledOnce);
			});

			var peer_removed = '{"Type":"peer_removed","UserId":"username","TargetUserId":"","Room":"www.example.com/test_app/test_room","Message":"username1"}';
			it("server fires 'peer_removed' event and HanshakeController fires 'participantDisconnected'. Server message: " + peer_removed, function () {
				handshakeController.on(xRtc.HandshakeController.events.participantDisconnected, obj.eventHandler);

				webSocketStub.onmessage({ data: peer_removed });

				expect(spy.calledOnce);
			});
		});
	});

	describe("should throw an exception if connection is not established", function () {
		it("on sendIce", function () {
			expect(function () {
				handshakeController.sendIce('username', {});
			}).toThrow();
		});

		it("on sendOffer", function () {
			expect(function () {
				handshakeController.sendOffer('username', {});
			}).toThrow();
		});

		it("on sendAnswer", function () {
			expect(function () {
				handshakeController.sendAnswer('username', {});
			}).toThrow();
		});

		it("on sendBye", function () {
			expect(function () {
				handshakeController.sendBye('username', {});
			}).toThrow();
		});
	});

	/*

	// demonstrates use of spies to intercept and test method calls
	it("tells the current song if the user has made it a favorite", function () {
		spyOn(song, 'persistFavoriteStatus');

		player.play(song);
		player.makeFavorite();

		expect(song.persistFavoriteStatus).toHaveBeenCalledWith(true);
	});*/
});