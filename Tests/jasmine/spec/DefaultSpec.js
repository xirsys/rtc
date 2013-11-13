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