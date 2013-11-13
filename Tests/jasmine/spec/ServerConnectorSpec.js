///<reference path="~/Tests/jasmine/lib/jasmine-1.3.1/jasmine.js" />
///<reference path="~/Tests/jasmine/lib/sinon-1.7.3.js" />

///<reference path="~/Scripts/xRtc/ajax.js" />
///<reference path="~/Scripts/xRtc/authManager.js" />
///<reference path="~/Scripts/xRtc/class.js" />
///<reference path="~/Scripts/xRtc/common.js" />
///<reference path="~/Scripts/xRtc/commonError.js" />
///<reference path="~/Scripts/xRtc/connection.js" />
///<reference path="~/Scripts/xRtc/dataChannel.js" />
///<reference path="~/Scripts/xRtc/eventDispatcher.js" />
///<reference path="~/Scripts/xRtc/handshakeController.js" />
///<reference path="~/Scripts/xRtc/logger.js" />
///<reference path="~/Scripts/xRtc/room.js" />
///<reference path="~/Scripts/xRtc/serverConnector.js" />
///<reference path="~/Scripts/xRtc/stream.js" />
///<reference path="~/Scripts/xRtc/userMedia.js" />

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

	afterEach(function () {
		serverConnector = null;
		server.restore();
		webSocket.restore();
		webSocketStub = null;
		eventObject = null;
		eventSpy = null;
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

			expect(eventSpy.notCalled).toBeTruthy();
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

			expect(eventSpy.called).toBeTruthy();
		});
	});

	describe("can disconnect", function () {
		it("if connection with WS server is established then it will be broken", function () {
			serverConnector.connect('token');
			server.respond();
			var spy = sinon.spy(webSocketStub, 'close');

			serverConnector.disconnect();

			expect(spy.called).toBeTruthy();
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

			expect(spy.withArgs(JSON.stringify(message)).calledOnce).toBeTruthy();
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

			expect(eventSpy.withArgs({ event: {} }).calledOnce).toBeTruthy();
		});

		it("'onclose' and ServerConnector fires 'connectionClose' event", function () {
			serverConnector.on(xRtc.ServerConnector.events.connectionClose, eventObject.eventHandler);

			webSocketStub.onclose({});

			expect(eventSpy.withArgs({ event: {} }).calledOnce).toBeTruthy();
		});

		it("'onerror' and ServerConnector fires 'connectionError' event", function () {
			serverConnector.on(xRtc.ServerConnector.events.connectionError, eventObject.eventHandler);

			webSocketStub.onerror({});

			expect(eventSpy.calledOnce).toBeTruthy();
		});

		it("'onmessage' and ServerConnector fires 'message' event", function () {
			serverConnector.on(xRtc.ServerConnector.events.message, eventObject.eventHandler);

			webSocketStub.onmessage({data: ''});

			expect(eventSpy.withArgs({ event: { data: '' } }).calledOnce).toBeTruthy();
		});

		describe("'onmessage' and ServerConnector fires appropriate event", function () {
			var expectedArg;

			beforeEach(function () {
				expectedArg = {
					room: 'test_room',
					senderId: 'username'
				};
			});
			
			afterEach(function () {
				expectedArg = null;
			});

			var peers_message = '{"Type":"peers","UserId":"username","TargetUserId":"","Room":"test_room","Message":"[\\"username1\\", \\"username2\\"]"}';
			it("server generates 'peers' event, ServerConnector parses message and fires 'peers' event", function () {
				serverConnector.on(xRtc.ServerConnector.serverEvents.usersUpdated, eventObject.eventHandler);

				webSocketStub.onmessage({ data: peers_message });

				expectedArg.connections = ['username1', 'username2'];

				expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
			});

			var peer_connected = '{"Type":"peer_connected","UserId":"username","TargetUserId":"","Room":"test_room","Message":"username1"}';
			it("server generates 'peer_connected' event, ServerConnector parses message and fires 'peer_connected' event", function () {
				serverConnector.on(xRtc.ServerConnector.serverEvents.userConnected, eventObject.eventHandler);

				webSocketStub.onmessage({ data: peer_connected });
				
				expectedArg.participantId = 'username1';

				expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
			});

			var peer_removed = '{"Type":"peer_removed","UserId":"username","TargetUserId":"","Room":"test_room","Message":"username1"}';
			it("server generates 'peer_removed' event, ServerConnector parses message and fires 'peer_removed' event", function () {
				serverConnector.on(xRtc.ServerConnector.serverEvents.userDisconnected, eventObject.eventHandler);

				webSocketStub.onmessage({ data: peer_removed });

				expectedArg.participantId = 'username1';

				expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
			});

			var server_message = '{"Type":"message","UserId":"username","TargetUserId":"username2","Room":"test_room","Message":"{\\"data\\":{},\\"eventName\\":\\"receivebye\\",\\"targetUserId\\":\\"username2\\"}"}';
			it("server generates 'message' event, ServerConnector parses message and fires event which is contained in message", function () {
				serverConnector.on(xRtc.HandshakeController.events.receiveBye, eventObject.eventHandler);

				webSocketStub.onmessage({ data: server_message });
				expectedArg = {
					senderId: 'username',
					receiverId: 'username2'
				};

				expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
			});


			var server_bad_message = '{"Type":"username"}';
			it("server generates 'message' event with bad message, ServerConnector parses message and fires 'messageFormatError' event", function () {
				serverConnector.on(xRtc.ServerConnector.events.messageFormatError, eventObject.eventHandler);

				webSocketStub.onmessage({ data: server_bad_message });

				expect(eventSpy.calledOnce).toBeTruthy();
			});
		});
	});
});