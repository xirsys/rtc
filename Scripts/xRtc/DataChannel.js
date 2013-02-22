(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.DataChannel = new xrtc.Class('DataChannel');

	xrtc.DataChannel.include(xrtc.EventDispatcher);
	xrtc.DataChannel.include({
		init: function (peerConnection, name) {
			this._logger = new xrtc.Logger();
			var self = this;

			this._channel = new exports.DataChannel(peerConnection, name);
			
			this._channel.onopen = function (event) {
				self.trigger(xrtc.events.open, event);
			};
			this._channel.onmessage = function (event) {
				self.trigger(xrtc.events.message, event);
			};
			this._channel.onclose = function (event) {
				self.trigger(xrtc.events.close, event);
			};
			this._channel.onerror = function (event) {
				self.trigger(xrtc.events.error, event);
			};
			this._channel.ondatachannel = function () {
				self.trigger(xrtc.events.datachannel, event);
			};
		},
		
		send: function () {
			this._logger.info('DataChannel.send', Array.prototype.slice.call(arguments));
			//_channel
		}
	});

	xrtc.DataChannel.extend({
		events: {
			open: 'open',
			message: 'message',
			close: 'close',
			error: 'error',
			datachannel: 'datachannel'
		}
	});
})(window);