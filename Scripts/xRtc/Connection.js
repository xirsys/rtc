(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.Connection = new xrtc.Class();

	xrtc.Connection.include({
		init: function (userData, handshakeController) {
			this._logger = new xrtc.Logger();
			this._peerConnection = null;
			this._eventDispatcher = new xrtc.EventDispatcher();
		},

		addMedia: function (options) {

		},

		createDataChannel: function () {

		},

		connect: function () {
		},

		on: function (eventName, eventHandler) {
			this._logger.info('Connection.on', arguments);

			this._eventDispatcher.on(arguments);
		},

		off: function (eventName) {
			this._logger.info('Connection.off', arguments);

			this._eventDispatcher.off(arguments);
		},

		trigger: function (eventName) {
			this._logger.info('Connection.trigger', arguments);

			this._eventDispatcher.trigger(arguments);
		},

		_getToken: function () {

		},

		_getIceServers: function () {

		}
	});

	xrtc.DataChannel.extend({
		events: {
			addstream: "addstream", //this._peerConnection.onaddstream
			icecandidate: "icecandidate", //this._peerConnection.onicecandidate
			createOffer: "createOffer",
			createOfferError: "createOfferError",
			createAnswer: "createAnswer",
			createAnswerError: "createAnswerError"
		}
	});
})(window);