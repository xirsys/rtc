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

describe("IceCandidateFilter", function () {
	//xRtc.Logger.level = true;

	var stubs = {
		rtcPeerConnection: null,
		authManager: null,
		rtcSessionDescription: null
	};

	var connection;
	var handshake;
	var iceCandidate;
	var peerConnection;
	var iceSendSpy;
	var answerData = {
		receiverId: 'Me',
		senderId: 'username',
		answer: '{}'
	};

	beforeEach(function () {
		iceCandidate = {
			sdpMLineIndex: 0,
			sdpMid: "audio"
		};

		stubs.rtcSessionDescription = sinon.stub(xRtc.Connection.webrtc, 'RTCSessionDescription', function () { });

		stubs.rtcPeerConnection = sinon.stub(xRtc.Connection.webrtc, 'RTCPeerConnection', function () {
			peerConnection = this;

			this.createOffer = function (success, failure, options) { };
			this.setLocalDescription = function (description) { };
			this.setRemoteDescription = function (description) { };
			this.getRemoteStreams = function () {
				return [{}];
			};
		});

		stubs.authManager = sinon.stub(xRtc, 'AuthManager', function () {
			this.getToken = function (userData, fn) {
				fn('token');
			};

			this.getIceServers = function (token, fn) {
				fn({ iceServers: [{ url: 'stun:111.111.111.111' }, { url: 'turn:username@222.222.222.222', credential: 'free' }] });
			};
		});

		connection = new xRtc.Connection({}, new xRtc.AuthManager());
		handshake = connection.getHandshake();

		iceSendSpy = sinon.spy(handshake, 'sendIce');
	});

	afterEach(function () {
		connection = null;
		iceCandidate = null;
		handshake = null;
		peerConnection = null;
		iceSendSpy = null;

		for (var stubName in stubs) {
			stubs[stubName].restore();
			stubs[stubName] = null;
		}
	});

	describe("Default", function () {
		beforeEach(function () {
			connection.startSession('username');
			handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
		});

		it("passes and does not modify local udp ice candidate", function () {
			var candidate = "a=candidate:2378510017 1 udp 2113937151 192.168.33.81 61190 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify local tcp ice candidate", function () {
			var candidate = "a=candidate:3276198449 2 tcp 1509957375 192.168.33.81 59780 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify stun ice candidate", function () {
			var candidate = "a=candidate:210577525 1 udp 1845501695 86.57.152.230 61190 typ srflx raddr 192.168.33.81 rport 61190 generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify turn ice candidate", function () {
			var candidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 86.57.152.230 rport 61191 generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});
	});

	describe("Direct", function () {
		beforeEach(function () {
			connection.startSession('username', { connectionType: 'direct' });
			handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
		});

		it("passes and does not modify local udp ice candidate", function () {
			var candidate = "a=candidate:2378510017 1 udp 2113937151 192.168.33.81 61190 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify local tcp ice candidate", function () {
			var candidate = "a=candidate:3276198449 2 tcp 1509957375 192.168.33.81 59780 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("passes and does not modify stun ice candidate", function () {
			var candidate = "a=candidate:210577525 1 udp 1845501695 86.57.152.230 61190 typ srflx raddr 192.168.33.81 rport 61190 generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("does not pass and does not modify turn ice candidate", function () {
			var candidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 86.57.152.230 rport 61191 generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeFalsy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});
	});

	describe("Server", function () {
		beforeEach(function () {
			connection.startSession('username', { connectionType: 'server' });
			handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
		});

		it("does not pass and does not modify local udp ice candidate", function () {
			var candidate = "a=candidate:2378510017 1 udp 2113937151 192.168.33.81 61190 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeFalsy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		it("does not pass and does not modify local tcp ice candidate", function () {
			var candidate = "a=candidate:3276198449 2 tcp 1509957375 192.168.33.81 59780 typ host generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeFalsy();
			expect(iceCandidate.candidate).toEqual(candidate);
		});

		//todo: fix it
		xit("passes and modifies stun ice candidate", function () {
			var candidate = "a=candidate:210577525 2 udp 1845501695 86.57.152.230 61190 typ srflx raddr 192.168.33.81 rport 61190 generation 0\r\n";
			var expectedCandidate = "a=candidate:210577525 2 udp 1845501695 222.222.222.222 61190 typ srflx raddr 222.222.222.222 rport 61190 generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			//this is does not work, because Connection works with copy and does not change original object
			expect(iceCandidate.candidate).toEqual(expectedCandidate);
		});

		//todo: fix it
		xit("passes and modifies turn ice candidate", function () {
			var candidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 86.57.152.230 rport 61191 generation 0\r\n";
			var expectedCandidate = "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 50.97.63.12 rport 61191 generation 0\r\n";
			iceCandidate.candidate = candidate;

			peerConnection.onicecandidate({ candidate: iceCandidate });

			expect(iceSendSpy.called).toBeTruthy();
			//this is does not work, because Connection works with copy and does not change original object
			expect(iceCandidate.candidate).toEqual(expectedCandidate);
		});
	});
});