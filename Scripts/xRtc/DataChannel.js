'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.DataChannel = new xrtc.Class('DataChannel');

	xrtc.DataChannel.include(xrtc.EventDispatcher);
	xrtc.DataChannel.include({
		init: function (dataChannel, participantId) {
			this._logger = new xrtc.Logger();
			this._channel = dataChannel;
			this._participantId = participantId;
			
			var self = this,
				events = xrtc.DataChannel.events;
			
			this._channel.onopen = function (evt) {
				var data = { event: evt };
				self._logger.debug('DataChannel.open', data);
				self.trigger(events.open, data);
			};
			
			this._channel.onmessage = function (evt) {
				var data = {
					event: evt,
					message: evt.data
				};
				self._logger.debug('DataChannel.message', data);
				self.trigger(events.message, data);
			};
			
			this._channel.onclose = function (evt) {
				var data = { event: evt };
				self._logger.debug('DataChannel.close', data);
				self.trigger(events.close, data);
			};
			
			this._channel.onerror = function (evt) {
				var data = { event: evt };
				self._logger.debug('DataChannel.error', data);
				self.trigger(events.error, data);
			};
			
			this._channel.ondatachannel = function (evt) {
				var data = { event: evt };
				self._logger.debug('DataChannel.datachannel', data);
				self.trigger(events.dataChannel, data);
			};
		},
		
		send: function (message) {
			this._logger.info('DataChannel.send', arguments);

			var data = {
				message: message,
				participantId: this._participantId
			};

			this._channel.send(JSON.stringify(data));
		}
	});

	xrtc.DataChannel.extend({
		events: {
			open: 'open',
			message: 'message',
			close: 'close',
			error: 'error',
			dataChannel: 'datachannel'
		}
	});
})(window);