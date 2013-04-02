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
///<reference path="~/Scripts/xRtc/Logger.js" />
///<reference path="~/Scripts/xRtc/Room.js" />
///<reference path="~/Scripts/xRtc/ServerConnector.js" />
///<reference path="~/Scripts/xRtc/Stream.js" />


/* This file is used only like spec template */
describe("Connection", function () {
	//xRtc.Logger.level = true;

	var target;
	var eventObject;
	var eventSpy;

	beforeEach(function () {
		target = null;

		eventObject = { eventHandler: function () { } };
		eventSpy = sinon.spy(eventObject, 'eventHandler');
	});

	afterEach(function () {
		target = null;

		eventObject = null;
		eventSpy = null;
	});

	describe("", function () {
		it("", function () {

		});
	});
});