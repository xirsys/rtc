'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	
	xrtc.Class(xrtc, 'DataChannel', function (dataChannel, userId) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			events = xrtc.DataChannel.events;

		dataChannel.onopen = proxy(channelOnOpen);
		dataChannel.onmessage = proxy(channelOnMessage);
		dataChannel.onclose = proxy(channelOnClose);
		dataChannel.onerror = proxy(channelOnError);
		dataChannel.ondatachannel = proxy(channelOnDatachannel);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			send: function (message) {
				/// <summary>Sends a message to remote user</summary>
				/// <param name="mesage" type="object">Message to send</param>

				logger.info('send', arguments);

				var data = {
					userId: userId,
					message: message
				};

				dataChannel.send(JSON.stringify(data));
			}
		});

		function channelOnOpen(evt) {
			var data = { event: evt };
			logger.debug('open', data);
			this.trigger(events.open, data);
		};

		function channelOnMessage(evt) {
			var data = JSON.parse(evt.data);

			logger.debug('message', data);
			this.trigger(events.message, data);
		}

		function channelOnClose(evt) {
			var data = { event: evt };
			logger.debug('close', data);
			this.trigger(events.close, data);
		}

		function channelOnError(evt) {
			var error = new xrtc.CommonError('onerror', 'Error in DataChannel', evt);
			logger.error('error', error);
			this.trigger(events.error, error);
		}

		function channelOnDatachannel(evt) {
			var data = { event: evt };
			logger.debug('datachannel', data);
			this.trigger(events.dataChannel, data);
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