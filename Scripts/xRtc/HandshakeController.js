'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'HandshakeController', function HandshakeController() {
		var logger = new xrtc.Logger(this.className);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			sendIce: function (targetUserId, iceCandidate) {
				/// <summary>Sends ICE servers to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="iceCandidate" type="object">WebRTC internal object. Will be converted to JSON</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveIce,
					receiverId: targetUserId,
					data: { iceCandidate: iceCandidate }
				};

				this.trigger(xrtc.HandshakeController.events.sendIce, request);
			},

			sendOffer: function (targetUserId, offerData) {
				/// <summary>Sends offer to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="offer" type="object">WebRTC internal object. Will be converted to JSON</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveOffer,
					receiverId: targetUserId,
					data: offerData
				};

				this.trigger(xrtc.HandshakeController.events.sendOffer, request);
			},

			sendAnswer: function (targetUserId, answerData) {
				/// <summary>Sends answer to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="answer" type="object">WebRTC internal object. Will be converted to JSON</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveAnswer,
					receiverId: targetUserId,
					data: answerData
				};

				this.trigger(xrtc.HandshakeController.events.sendAnswer, request);
			},

			sendBye: function (targetUserId, options) {
				/// <summary>Sends disconnection message to remote user</summary>
				/// <param name="targetUserId" type="string">Name of remote user (receiver)</param>
				/// <param name="options" type="object">Additional request parameters</param>

				var request = {
					eventName: xrtc.HandshakeController.events.receiveBye,
					receiverId: targetUserId
				};

				if (options) {
					request.data = options;
				}

				this.trigger(xrtc.HandshakeController.events.sendBye, request);
			}
		});
	});

	xrtc.HandshakeController.extend({
		events: {
			sendIce: 'sendice',
			receiveIce: 'receiveice',

			sendOffer: 'sendoffer',
			receiveOffer: 'receiveoffer',

			sendAnswer: 'sendanswer',
			receiveAnswer: 'receiveanswer',

			sendBye: 'sendbye',
			receiveBye: 'receivebye'
		}
	});
})(window);