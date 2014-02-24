// #### Version 1.5.0####

// It is internal object of xRtc library.

// **Dependencies:**

// class.js;
// logger.js.

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'HandshakeController', function HandshakeController() {
		var logger = new xrtc.Logger(this.className);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			sendIce: function (targetUserId, connectionId, iceCandidateData) {
				this.trigger(xrtc.HandshakeController.events.sendIce, targetUserId, connectionId, iceCandidateData);
			},

			sendOffer: function (targetUserId, connectionId, offerData) {
				this.trigger(xrtc.HandshakeController.events.sendOffer, targetUserId, connectionId, offerData);
			},

			sendAnswer: function (targetUserId, connectionId, answerData) {
				this.trigger(xrtc.HandshakeController.events.sendAnswer, targetUserId, connectionId, answerData);
			},

			sendBye: function (targetUserId, connectionId, byeData) {
				this.trigger(xrtc.HandshakeController.events.sendBye, targetUserId, connectionId, byeData);
			}
		});
	});

	xrtc.HandshakeController.extend({
		events: {
			sendIce: 'sendice',
			sendOffer: 'sendoffer',
			sendAnswer: 'sendanswer',
			sendBye: 'sendbye',

			// **Note:** These events of HandshakeController object can be initiated by another object.
			receiveIce: 'receiveice',
			receiveOffer: 'receiveoffer',
			receiveAnswer: 'receiveanswer',
			receiveBye: 'receivebye'
		}
	});
})(window);