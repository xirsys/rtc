'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	/// <summary>HandshakeController is internal object of xirsys library</summary>
	xrtc.Class(xrtc, 'HandshakeController', function HandshakeController() {
		var logger = new xrtc.Logger(this.className);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			sendIce: function (targetUserId, targetConnectionId, iceCandidate) {
				this.trigger(xrtc.HandshakeController.events.sendIce, targetUserId, targetConnectionId, iceCandidate);
			},

			sendOffer: function (targetUserId, targetConnectionId, offerData) {
				this.trigger(xrtc.HandshakeController.events.sendOffer, targetUserId, targetConnectionId, offerData);
			},

			sendAnswer: function (targetUserId, targetConnectionId, answerData) {
				this.trigger(xrtc.HandshakeController.events.sendAnswer, targetUserId, targetConnectionId, answerData);
			},

			sendBye: function (targetUserId, targetConnectionId, options) {
				this.trigger(xrtc.HandshakeController.events.sendBye, targetUserId, targetConnectionId, options);
			}
		});
	});

	xrtc.HandshakeController.extend({
		events: {
			sendIce: 'sendice',
			sendOffer: 'sendoffer',
			sendAnswer: 'sendanswer',
			sendBye: 'sendbye',

			// note: these events of HandshakeController object can be initiated by another object
			receiveIce: 'receiveice',
			receiveOffer: 'receiveoffer',
			receiveAnswer: 'receiveanswer',
			receiveBye: 'receivebye'
		}
	});
})(window);