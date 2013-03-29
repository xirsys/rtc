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

describe("IceCandidateFilter", function () {
	//xRtc.Logger.level = true;

	var iceFilter;
	var iceCandidate;

	beforeEach(function() {
		iceCandidate = {
			sdpMLineIndex: 0,
			sdpMid: "audio"
		};
	});
	
	afterEach(function () {
		iceFilter = null;
		iceCandidate = null;
	});

	describe("Default", function () {
		beforeEach(function () {
			iceFilter = new xRtc.IceCandidateFilter();
		});

		it("passes and does not modify local udp ice candidate", function () {
			var candidate = "a=candidate:2378510017 1 udp 2113937151 192.168.33.81 61190 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify local tcp ice candidate", function () {
			var candidate = "a=candidate:3276198449 2 tcp 1509957375 192.168.33.81 59780 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify stun ice candidate", function () {
			var candidate = "a=candidate:210577525 1 udp 1845501695 86.57.152.230 61190 typ srflx raddr 192.168.33.81 rport 61190 generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify turn ice candidate", function () {
			var candidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 86.57.152.230 rport 61191 generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});
	});

	describe("Direct", function () {
		beforeEach(function () {
			iceFilter = new xRtc.IceCandidateFilter('direct');
		});

		it("passes and does not modify local udp ice candidate", function () {
			var candidate = "a=candidate:2378510017 1 udp 2113937151 192.168.33.81 61190 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify local tcp ice candidate", function () {
			var candidate = "a=candidate:3276198449 2 tcp 1509957375 192.168.33.81 59780 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify stun ice candidate", function () {
			var candidate = "a=candidate:210577525 1 udp 1845501695 86.57.152.230 61190 typ srflx raddr 192.168.33.81 rport 61190 generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("does not pass and does not modify turn ice candidate", function () {
			var candidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 86.57.152.230 rport 61191 generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeFalsy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});
	});

	describe("Server", function () {
		beforeEach(function () {
			iceFilter = new xRtc.IceCandidateFilter('server');
		});

		it("does not pass and does not modify local udp ice candidate", function () {
			var candidate = "a=candidate:2378510017 1 udp 2113937151 192.168.33.81 61190 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeFalsy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("does not pass and does not modify local tcp ice candidate", function () {
			var candidate = "a=candidate:3276198449 2 tcp 1509957375 192.168.33.81 59780 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeFalsy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and modifies stun ice candidate", function () {
			var candidate = "a=candidate:210577525 2 udp 1845501695 86.57.152.230 61190 typ srflx raddr 192.168.33.81 rport 61190 generation 0\r\n";
			var expectedCandidate = "a=candidate:210577525 2 udp 1845501695 50.97.63.12 61190 typ srflx raddr 50.97.63.12 rport 61190 generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(expectedCandidate);
		});

		it("passes and modifies turn ice candidate", function () {
			var candidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 86.57.152.230 rport 61191 generation 0\r\n";
			var expectedCandidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 50.97.63.12 rport 61191 generation 0\r\n";
			iceCandidate.candidate = candidate;

			expect(iceFilter.isAllowed(iceCandidate)).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(expectedCandidate);
		});
	});
});