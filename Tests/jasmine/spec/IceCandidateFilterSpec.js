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

	function getIceCandidate(candidate) {
		var iceCandidate = {
			candidate: candidate,
			sdpMLineIndex: 0,
			sdpMid: "audio"
		};

		return iceCandidate;
	}


	var iceCandidates = {
		local: "a=candidate:2378510017 1 udp 2113937151 192.168.33.81 61190 typ host generation 0\r\n",
		stun: "a=candidate:210577525 1 udp 1845501695 86.57.152.230 61190 typ srflx raddr 192.168.33.81 rport 61190 generation 0\r\n",
		turn: "a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 86.57.152.230 rport 61191 generation 0\r\n"
	};

	var stubs = {
		rtcPeerConnection: null,
		authManager: null,
		rtcSessionDescription: null
	};

	var connection;
	var handshake;
	var peerConnection;
	var iceSendSpy;


	beforeEach(function () {
		stubs.rtcSessionDescription = sinon.stub(xRtc.Connection.webrtc, 'RTCSessionDescription', function () { });

		stubs.rtcPeerConnection = sinon.stub(xRtc.Connection.webrtc, 'RTCPeerConnection', function () {
			peerConnection = this;

			this.createOffer = function (success, failure, options) { };
			this.createAnswer = function(success, failure, options) {
				success({});
			};
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

		connection = new xRtc.Connection({ name: 'username' }, new xRtc.AuthManager());
		handshake = connection.getHandshake();

		iceSendSpy = sinon.spy(handshake, 'sendIce');
	});

	afterEach(function () {
		connection = null;
		handshake = null;
		peerConnection = null;
		iceSendSpy = null;

		for (var stubName in stubs) {
			stubs[stubName].restore();
			stubs[stubName] = null;
		}
	});

	describe("Client starts session", function () {
		var answerData;

		beforeEach(function () {
			answerData = {
				receiverId: 'Me',
				senderId: 'username',
				answer: '{}'
			};
		});
		
		afterEach(function () {
			answerData = null;
		});

		describe("Default", function () {
			beforeEach(function () {
				connection.startSession('username');
				handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
			});

			it("passes and does not modify local ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.local);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.local);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.local)));
			});

			it("passes and does not modify stun ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.stun);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.stun);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.stun)));
			});

			it("passes and does not modify turn ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.turn);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.turn);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.turn)));
			});
		});

		describe("Direct", function () {
			beforeEach(function () {
				connection.startSession('username', { connectionType: 'direct' });
				handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
			});

			it("passes and does not modify local ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.local);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.local);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.local)));
			});

			it("passes and does not modify stun ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.stun);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.stun);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.stun)));
			});

			it("does not pass and does not modify turn ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.turn);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.turn);
				expect(iceSendSpy.called).toBeFalsy();
			});
		});

		describe("Server", function () {
			beforeEach(function () {
				connection.startSession('username', { connectionType: 'server' });
				handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
			});

			it("does not pass and does not modify local ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.local);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.local);
				expect(iceSendSpy.called).toBeFalsy();
			});

			it("passes and modifies stun ice candidate", function () {
				var expectedIce = getIceCandidate("a=candidate:210577525 1 udp 1845501695 222.222.222.222 61190 typ srflx raddr 222.222.222.222 rport 61190 generation 0\r\n");
				var ice = getIceCandidate(iceCandidates.stun);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.stun);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(expectedIce));
			});

			it("passes and modifies turn ice candidate", function () {
				var expectedIce = getIceCandidate("a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 50.97.63.12 rport 61191 generation 0\r\n");
				var ice = getIceCandidate(iceCandidates.turn);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.turn);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(expectedIce));
			});
		});
	});

	describe("Client accepts offer", function () {
		var offerData;

		beforeEach(function () {
			offerData = {
				offer: '{}',
				receiverId: 'username',
				senderId: 'username2',
				iceServers: { iceServers: [{ url: 'stun:111.111.111.111' }, { url: 'turn:username@222.222.222.222', credential: 'free' }] }
			};

			connection.on(xRtc.Connection.events.incomingCall, function (offer) {
				offer.accept();
			});
		});

		afterEach(function() {
			offerData = null;
		});

		describe("Default", function () {
			beforeEach(function () {
				offerData.connectionType = 'default';
				handshake.trigger(xRtc.HandshakeController.events.receiveOffer, offerData);
			});

			it("passes and does not modify local ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.local);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.local);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.local)));
			});

			it("passes and does not modify stun ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.stun);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.stun);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.stun)));
			});

			it("passes and does not modify turn ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.turn);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.turn);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.turn)));
			});
		});

		describe("Direct", function () {
			beforeEach(function () {
				offerData.connectionType = 'direct';
				handshake.trigger(xRtc.HandshakeController.events.receiveOffer, offerData);
			});

			it("passes and does not modify local ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.local);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.local);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.local)));
			});

			it("passes and does not modify stun ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.stun);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.stun);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.stun)));
			});

			it("does not pass and does not modify turn ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.turn);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.turn);
				expect(iceSendSpy.called).toBeFalsy();
			});
		});

		describe("Server", function () {
			beforeEach(function () {
				offerData.connectionType = 'server';
				handshake.trigger(xRtc.HandshakeController.events.receiveOffer, offerData);
			});

			it("does not pass and does not modify local ice candidate", function () {
				var ice = getIceCandidate(iceCandidates.local);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.local);
				expect(iceSendSpy.called).toBeFalsy();
			});

			it("passes and modifies stun ice candidate", function () {
				var expectedIce = getIceCandidate("a=candidate:210577525 1 udp 1845501695 222.222.222.222 61190 typ srflx raddr 222.222.222.222 rport 61190 generation 0\r\n");
				var ice = getIceCandidate(iceCandidates.stun);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.stun);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(expectedIce));
			});

			it("passes and modifies turn ice candidate", function () {
				var expectedIce = getIceCandidate("a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 50.97.63.12 rport 61191 generation 0\r\n");
				var ice = getIceCandidate(iceCandidates.turn);
				peerConnection.onicecandidate({ candidate: ice });

				expect(ice.candidate).toEqual(iceCandidates.turn);
				expect(iceSendSpy.called).toBeTruthy();
				expect(iceSendSpy.args[0][1]).toEqual(JSON.stringify(expectedIce));
			});
		});
	});
});