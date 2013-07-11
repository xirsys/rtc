'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	/// <summary>HandshakeController is internal object of xirsys library</summary>
	xrtc.Class(xrtc, 'HandshakeController', function HandshakeController() {
		var logger = new xrtc.Logger(this.className);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			sendIce: function (targetUserId, targetConnectionId, iceCandidate) {
				/// <summary>Sends ICE servers to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="iceCandidate" type="object">WebRTC internal object. Will be converted to JSON</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveIce,
					targetUserId: targetUserId,
					data: {
						connectionId: targetConnectionId,
						iceCandidate: iceCandidate
					}
				};

				this.trigger(xrtc.HandshakeController.events.sendIce, request);
			},

			sendOffer: function (targetUserId, targetConnectionId, offerData) {
				/// <summary>Sends offer to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="offer" type="object">WebRTC internal object. Will be converted to JSON</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveOffer,
					targetUserId: targetUserId,
					data: {
						connectionId: targetConnectionId,
						offer: offerData
					}
				};

				this.trigger(xrtc.HandshakeController.events.sendOffer, request);
			},

			sendAnswer: function (targetUserId, targetConnectionId, answerData) {
				/// <summary>Sends answer to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="answer" type="object">WebRTC internal object. Will be converted to JSON</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveAnswer,
					targetUserId: targetUserId,
					data: {
						connectionId: targetConnectionId,
						answer: answerData
					}
				};

				this.trigger(xrtc.HandshakeController.events.sendAnswer, request);
			},

			sendBye: function (targetUserId, targetConnectionId, options) {
				/// <summary>Sends disconnection message to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="options" type="object">Additional request parameters</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveBye,
					targetUserId: targetUserId,
					data: { connectionId: targetConnectionId }
				};

				if (options) {
					request.data.options = options;
				}

				this.trigger(xrtc.HandshakeController.events.sendBye, request);
			}
		});
	});

	xrtc.HandshakeController.extend({
		events: {
			sendIce: 'sendice',
			sendOffer: 'sendoffer',
			sendAnswer: 'sendanswer',
			sendBye: 'sendbye',

			// note: these events of handshakeController object can be initiated by another object
			receiveIce: 'receiveice',
			receiveOffer: 'receiveoffer',
			receiveAnswer: 'receiveanswer',
			receiveBye: 'receivebye'
		}
	});
})(window);