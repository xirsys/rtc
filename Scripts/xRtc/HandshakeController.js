'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	/// <summary>HandshakeController is internal object of xirsys library</summary>
	xrtc.Class(xrtc, 'HandshakeController', function HandshakeController() {
		var logger = new xrtc.Logger(this.className);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			sendIce: function (targetUserId, targetConnectionId, connectionId, iceCandidateData) {
				this.trigger(xrtc.HandshakeController.events.sendIce, targetUserId, targetConnectionId, connectionId, iceCandidateData);
			},

			sendOffer: function (targetUserId, targetConnectionId, connectionId, offerData) {
				this.trigger(xrtc.HandshakeController.events.sendOffer, targetUserId, targetConnectionId, connectionId, offerData);
			},

			sendAnswer: function (targetUserId, targetConnectionId, connectionId, answerData) {
				this.trigger(xrtc.HandshakeController.events.sendAnswer, targetUserId, targetConnectionId, connectionId, answerData);
			},

			sendBye: function (targetUserId, targetConnectionId, connectionId) {
				this.trigger(xrtc.HandshakeController.events.sendBye, targetUserId, targetConnectionId, connectionId);
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