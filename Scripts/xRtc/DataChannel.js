(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.DataChannel = new xrtc.Class();

	xrtc.DataChannel.include({
		init: function (peerConnection, name) {
			this._logger = new xrtc.Logger();
			var self = this;
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
		
		send: function () {
			this._logger.info('DataChannel.send', arguments);
			//_channel
		},

		on: function (eventName, eventHandler) {
			this._logger.info('DataChannel.on', arguments);

			this._eventDispatcher.on(arguments);
		},
		
		off: function (eventName) {
			this._logger.info('DataChannel.off', arguments);
			
			this._eventDispatcher.off(arguments);
		},
		
		trigger: function (eventName) {
			this._logger.info('DataChannel.trigger', arguments);
			
			this._eventDispatcher.trigger(arguments);
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