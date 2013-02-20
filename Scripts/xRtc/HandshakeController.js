(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.HandshakeController = new xrtc.Class();

	xrtc.HandshakeController.include({
		init: function (peerConnection, name) {
			this._logger = new xrtc.Logger();
			this._eventDispatcher = new xrtc.EventDispatcher();

			this._channel = new exports.DataChannel(peerConnection, name);

			this._channel.onopen = function (event) {
				self._eventDispatcher.trigger(xrtc.events.open, event);
			};
			this._channel.onmessage = function (event) {
				self._eventDispatcher.trigger(xrtc.events.message, event);
			};
			this._channel.onclose = function (event) {
				self._eventDispatcher.trigger(xrtc.events.close, event);
			};
			this._channel.onerror = function (event) {
				self._eventDispatcher.trigger(xrtc.events.error, event);
			};
			this._channel.ondatachannel = function () {
				self._eventDispatcher.trigger(xrtc.events.datachannel, event);
			};
		},

		conect: function () {
		},

		setToken: function (token) {
		},

		sendIce: function (token) {
		},

		sendOffer: function (token) {
		},

		sendAnswer: function (token) {
		},

		on: function (eventName, eventHandler) {
			this._logger.info('HandshakeController.on', arguments);

			this._eventDispatcher.on(arguments);
		},

		off: function (eventName) {
			this._logger.info('HandshakeController.off', arguments);

			this._eventDispatcher.off(arguments);
		},

		trigger: function (eventName) {
			this._logger.info('HandshakeController.trigger', arguments);

			this._eventDispatcher.trigger(arguments);
		}
	});

	xrtc.HandshakeController.extend({
		events: {
			connected: "connected",
			recieveIce: "recieveIce",
			recieveOffer: "recieveOffer",
			recieveAnswer: "recieveAnswer",
			sendIce: "sendIce",
			sendOffer: "sendOffer",
			sendAnswer: "sendAnswer"
		}
	});
})(window);