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
	xRtc.Logger.level = true;
	
	var handshakeController;
	var server;
	var webSocket;
	
	beforeEach(function () {
		handshakeController = new xRtc.HandshakeController();
		
		webSocket = sinon.stub(window, "WebSocket", function (url) {
			//var that = this;
			//
			//setTimeout(function () {
			//	that.onopen({});
			//}, 100);
		});
		
		server = sinon.fakeServer.create();
	});
	

	afterEach(function() {
		server.restore();
		webSocket.restore();
	});
	

	it("can get WebSocket URL and establish connection", function () {
		handshakeController.connect('token');
		server.respondWith([200, {}, '{"P":"/ws","S":200,"D":{"value":"ws://turn.influxis.com:8003"},"E":null}']);
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