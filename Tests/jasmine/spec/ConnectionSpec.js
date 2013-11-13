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

describe("Connection", function () {
	//xRtc.Logger.level = true;

	describe("Ice candidate filtering functionality", function () {
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
		var handshakeIceSend;

		beforeEach(function () {
			stubs.rtcSessionDescription = sinon.stub(xRtc.Connection.webrtc, 'RTCSessionDescription', function () { });

			stubs.rtcPeerConnection = sinon.stub(xRtc.Connection.webrtc, 'RTCPeerConnection', function () {
				peerConnection = this;

				this.createOffer = function (success, failure, options) { };
				this.createAnswer = function (success, failure, options) {
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

			handshakeIceSend = sinon.spy(handshake, 'sendIce');
		});

		afterEach(function () {
			connection = null;
			handshake = null;
			peerConnection = null;
			handshakeIceSend = null;

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
					connection.open('username');
					handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
				});

				it("passes and does not modify any ice candidate", function () {
					var count = 0;

					for (var type in iceCandidates) {
						var ice = getIceCandidate(iceCandidates[type]);
						peerConnection.onicecandidate({ candidate: ice });

						expect(ice.candidate).toEqual(iceCandidates[type]);
						expect(handshakeIceSend.args[count][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates[type])));

						count++;
					}

					expect(handshakeIceSend.callCount).toEqual(count);
				});
			});

			describe("Direct", function () {
				beforeEach(function () {
					connection.open('username', { connectionType: 'direct' });
					handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
				});

				it("passes and does not modify local ice candidate", function () {
					var ice = getIceCandidate(iceCandidates.local);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.local);
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.local)));
				});

				it("passes and does not modify stun ice candidate", function () {
					var ice = getIceCandidate(iceCandidates.stun);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.stun);
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.stun)));
				});

				it("does not pass and does not modify turn ice candidate", function () {
					var ice = getIceCandidate(iceCandidates.turn);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.turn);
					expect(handshakeIceSend.called).toBeFalsy();
				});
			});

			describe("Server", function () {
				beforeEach(function () {
					connection.open('username', { connectionType: 'server' });
					handshake.trigger(xRtc.HandshakeController.events.receiveAnswer, answerData);
				});

				it("does not pass and does not modify local ice candidate", function () {
					var ice = getIceCandidate(iceCandidates.local);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.local);
					expect(handshakeIceSend.called).toBeFalsy();
				});

				it("passes and modifies stun ice candidate", function () {
					var expectedIce = getIceCandidate("a=candidate:210577525 1 udp 1845501695 222.222.222.222 61190 typ srflx raddr 222.222.222.222 rport 61190 generation 0\r\n");
					var ice = getIceCandidate(iceCandidates.stun);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.stun);
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(expectedIce));
				});

				it("passes and modifies turn ice candidate", function () {
					var expectedIce = getIceCandidate("a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 50.97.63.12 rport 61191 generation 0\r\n");
					var ice = getIceCandidate(iceCandidates.turn);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.turn);
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(expectedIce));
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

			afterEach(function () {
				offerData = null;
			});

			describe("Default", function () {
				beforeEach(function () {
					offerData.connectionType = 'default';
					handshake.trigger(xRtc.HandshakeController.events.receiveOffer, offerData);
				});

				it("passes and does not modify any ice candidate", function () {
					var count = 0;

					for (var type in iceCandidates) {
						var ice = getIceCandidate(iceCandidates[type]);
						peerConnection.onicecandidate({ candidate: ice });

						expect(ice.candidate).toEqual(iceCandidates[type]);
						expect(handshakeIceSend.args[count][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates[type])));

						count++;
					}

					expect(handshakeIceSend.callCount).toEqual(count);
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
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.local)));
				});

				it("passes and does not modify stun ice candidate", function () {
					var ice = getIceCandidate(iceCandidates.stun);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.stun);
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(getIceCandidate(iceCandidates.stun)));
				});

				it("does not pass and does not modify turn ice candidate", function () {
					var ice = getIceCandidate(iceCandidates.turn);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.turn);
					expect(handshakeIceSend.called).toBeFalsy();
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
					expect(handshakeIceSend.called).toBeFalsy();
				});

				it("passes and modifies stun ice candidate", function () {
					var expectedIce = getIceCandidate("a=candidate:210577525 1 udp 1845501695 222.222.222.222 61190 typ srflx raddr 222.222.222.222 rport 61190 generation 0\r\n");
					var ice = getIceCandidate(iceCandidates.stun);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.stun);
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(expectedIce));
				});

				it("passes and modifies turn ice candidate", function () {
					var expectedIce = getIceCandidate("a=candidate:3801838492 1 udp 7935 50.97.63.12 50592 typ relay raddr 50.97.63.12 rport 61191 generation 0\r\n");
					var ice = getIceCandidate(iceCandidates.turn);
					peerConnection.onicecandidate({ candidate: ice });

					expect(ice.candidate).toEqual(iceCandidates.turn);
					expect(handshakeIceSend.called).toBeTruthy();
					expect(handshakeIceSend.args[0][1]).toEqual(JSON.stringify(expectedIce));
				});
			});
		});
	});
});