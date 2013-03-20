///<reference path="~/Tests/jasmine/lib/jasmine-1.3.1/jasmine.js" />
///<reference path="~/Tests/jasmine/lib/sinon-1.6.0.js" />

///<reference path="~/Scripts/xRtc/Ajax.js" />
///<reference path="~/Scripts/xRtc/AuthManager.js" />
///<reference path="~/Scripts/xRtc/Class.js" />
///<reference path="~/Scripts/xRtc/CommonError.js" />
///<reference path="~/Scripts/xRtc/Connection.js" />
///<reference path="~/Scripts/xRtc/DataChannel.js" />
///<reference path="~/Scripts/xRtc/EventDispatcher.js" />
///<reference path="~/Scripts/xRtc/Logger.js" />
///<reference path="~/Scripts/xRtc/Room.js" />
///<reference path="~/Scripts/xRtc/ServerConnector.js" />
///<reference path="~/Scripts/xRtc/Stream.js" />

describe("ServerConnector", function () {
	//xRtc.Logger.level = true;
	
	var serverConnector;
	var server;
	var webSocket;
	var webSocketStub;
	var eventObject;
	var eventSpy;
	
	beforeEach(function () {
		serverConnector = new xRtc.ServerConnector();
		
		webSocket = sinon.stub(window, "WebSocket", function (url) {
			webSocketStub = this;

			this.close = function() {};
			this.send = function() {};
		});
		
		server = sinon.fakeServer.create();
		server.respondWith([200, {}, '{"P":"/ws","S":200,"D":{"value":"ws://turn.influxis.com:8003"},"E":null}']);
		
		eventObject = { eventHandler: function () { } };
		eventSpy = sinon.spy(eventObject, 'eventHandler');
	});

	afterEach(function() {
		server.restore();
		webSocket.restore();
		webSocketStub = null;
	});


	describe("can connect to server by getting WS URL with Ajax", function () {
		it("if response doesn't contain errors then WebSocket object will be created", function () {
			serverConnector.connect('token');
			server.respond();

			expect(webSocketStub).not.toBeNull();
		});

		it("if response doesn't contain errors then 'serverError' event won't be fired", function () {
			serverConnector.on(xRtc.ServerConnector.events.serverError, eventObject.eventHandler);
			serverConnector.connect('token');
			server.respond();

			expect(eventSpy.notCalled);
		});

		it("if response contains errors then WebSocket object won't be created", function () {
			serverConnector.connect('token');
			server.respondWith([200, {}, '{"P":"/ws","S":200,"E":["some error happened"],"D":null}']);
			server.respond();

			expect(webSocketStub).toBeNull();
		});
		
		it("if response contains errors then 'serverError' event will be fired", function () {
			serverConnector.on(xRtc.ServerConnector.events.serverError, eventObject.eventHandler);

			serverConnector.connect('token');
			server.respondWith([200, {}, '{"P":"/ws","S":200,"E":["some error happened"],"D":null}']);
			server.respond();

			expect(eventSpy.called);
		});
	});

	describe("can disconnect", function () {
		it("if connection with WS server is established then it will be broken", function () {
			serverConnector.connect('token');
			server.respond();
			var spy = sinon.spy(webSocketStub, 'close');

			serverConnector.disconnect();

			expect(spy.called);
		});

		it("if connection with WS server isn't established then nothing will happen", function () {
			serverConnector.disconnect();
		});
	});

	describe("can send messages", function () {
		it("if connection with WS server is established then it will be sent to server via WebSocket connection", function () {
			var message = { data: 'message' };
			
			serverConnector.connect('token');
			server.respond();
			var spy = sinon.spy(webSocketStub, 'send');

			serverConnector.send(message);

			expect(spy.withArgs(JSON.stringify(message)).calledOnce);
		});

		it("if connection with WS server isn't established then exception will be thrown", function () {
			var message = { data: 'message' };
			
			expect(function () {
				serverConnector.send(message);
			}).toThrow();
		});
	});

	describe("WebSocket server generates event", function () {
		beforeEach(function() {
			serverConnector.connect('token');
			server.respond();
		});

		afterEach(function() {
		});

		it("'onopen' and ServerConnector fires 'connectionOpen' event", function () {
			serverConnector.on(xRtc.ServerConnector.events.connectionOpen, eventObject.eventHandler);

			webSocketStub.onopen({});

			expect(eventSpy.calledOnce);
		});

		it("'onclose' and ServerConnector fires 'connectionClose' event", function () {
			serverConnector.on(xRtc.ServerConnector.events.connectionClose, eventObject.eventHandler);

			webSocketStub.onclose({});

			expect(eventSpy.calledOnce);
		});

		it("'onerror' and ServerConnector fires 'connectionError' event", function () {
			serverConnector.on(xRtc.ServerConnector.events.connectionError, eventObject.eventHandler);

			webSocketStub.onerror({});

			expect(eventSpy.calledOnce);
		});

		describe("'onmessage' and ServerConnector fires appropriate event", function () {
			var peers_message = '{"Type":"peers","UserId":"username","TargetUserId":"","Room":"test_room","Message":"[\"username1\", \"username2\"]"}';
			it("server generates 'peers' event, ServerConnector parses message and fires 'peers' event", function () {
				serverConnector.on(xRtc.Room.serverEvents.participantsUpdated, eventObject.eventHandler);

				webSocketStub.onmessage({ data: peers_message });
				
				expect(eventSpy.calledOnce);
			});

			var peer_connected = '{"Type":"peer_connected","UserId":"username","TargetUserId":"","Room":"test_room","Message":"username1"}';
			it("server generates 'peer_connected' event, ServerConnector parses message and fires 'peer_connected' event", function () {
				serverConnector.on(xRtc.Room.serverEvents.participantConnected, eventObject.eventHandler);

				webSocketStub.onmessage({ data: peer_connected });

				expect(eventSpy.calledOnce);
			});

			var peer_removed = '{"Type":"peer_removed","UserId":"username","TargetUserId":"","Room":"test_room","Message":"username1"}';
			it("server generates 'peer_removed' event, ServerConnector parses message and fires 'peer_removed' event", function () {
				serverConnector.on(xRtc.Room.serverEvents.participantDisconnected, eventObject.eventHandler);

				webSocketStub.onmessage({ data: peer_removed });

				expect(eventSpy.calledOnce);
			});

			var server_message = '{"Type":"message","UserId":"username","TargetUserId":"ivan","Room":"test_room","Message":"{\"data\":{\"iceCandidate\":\"{\\\"sdpMLineIndex\\\":1,\\\"sdpMid\\\":\\\"video\\\",\\\"candidate\\\":\\\""}\"},\"eventName\":\"receiveice\",\"targetUserId\":\"username2\"}"}';
			it("server generates 'message' event, ServerConnector parses message and fires event which is contained in message", function () {
				serverConnector.on(xRtc.HandshakeController.events.receiveIce, eventObject.eventHandler);

				webSocketStub.onmessage({ data: server_message });

				expect(eventSpy.calledOnce);
			});
		});
	});
});