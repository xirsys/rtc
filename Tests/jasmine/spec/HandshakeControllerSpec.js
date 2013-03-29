///<reference path="~/Tests/jasmine/lib/jasmine-1.3.1/jasmine.js" />
///<reference path="~/Tests/jasmine/lib/sinon-1.6.0.js" />

///<reference path="~/Scripts/xRtc/Ajax.js" />
///<reference path="~/Scripts/xRtc/AuthManager.js" />
///<reference path="~/Scripts/xRtc/Class.js" />
///<reference path="~/Scripts/xRtc/CommonError.js" />
///<reference path="~/Scripts/xRtc/Connection.js" />
///<reference path="~/Scripts/xRtc/DataChannel.js" />
///<reference path="~/Scripts/xRtc/EventDispatcher.js" />
///<reference path="~/Scripts/xRtc/HandshakeController.js" />
///<reference path="~/Scripts/xRtc/IceCandidateFilter.js" />
///<reference path="~/Scripts/xRtc/Logger.js" />
///<reference path="~/Scripts/xRtc/Room.js" />
///<reference path="~/Scripts/xRtc/ServerConnector.js" />
///<reference path="~/Scripts/xRtc/Stream.js" />

describe("HandshakeController", function () {
	//xRtc.Logger.level = true;
	
	var handshakeController;
	var eventObject;
	var eventSpy;
	var expectedArg;
	
	beforeEach(function () {
		handshakeController = new xRtc.HandshakeController();
		
		eventObject = { eventHandler: function () { } };
		eventSpy = sinon.spy(eventObject, 'eventHandler');
		
		expectedArg = {
			receiverId: 'username',
			data: {}
		};
	});

	afterEach(function () {
		handshakeController = null;
		
		eventObject = null;
		eventSpy = null;
	});

	describe("should fire", function () {
		it("'sendIce' event if sendIce method is called", function () {
			handshakeController.on(xRtc.HandshakeController.events.sendIce, eventObject.eventHandler);
			
			handshakeController.sendIce('username', {});

			expectedArg.eventName = xRtc.HandshakeController.events.receiveIce;
			expectedArg.data.iceCandidate = {};

			expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
		});

		it("'sendOffer' event if sendOffer method is called", function () {
			handshakeController.on(xRtc.HandshakeController.events.sendOffer, eventObject.eventHandler);

			handshakeController.sendOffer('username', { offer: 'offer' });

			expectedArg.eventName = xRtc.HandshakeController.events.receiveOffer;
			expectedArg.data.offer = 'offer';
			
			expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
		});

		it("'sendAnswer' event if sendAnswer method is called", function () {
			handshakeController.on(xRtc.HandshakeController.events.sendAnswer, eventObject.eventHandler);

			handshakeController.sendAnswer('username', { answer: 'answer' });

			expectedArg.eventName = xRtc.HandshakeController.events.receiveAnswer;
			expectedArg.data.answer = 'answer';

			expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
		});

		it("'sendBye' event if sendBye method is called", function () {
			handshakeController.on(xRtc.HandshakeController.events.sendBye, eventObject.eventHandler);

			handshakeController.sendBye('username');

			expectedArg.eventName = xRtc.HandshakeController.events.receiveBye;
			delete expectedArg.data;

			expect(eventSpy.withArgs(expectedArg).calledOnce).toBeTruthy();
		});
	});
});