'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	
	xrtc.Class(xrtc, 'DataChannel', function (dataChannel, userId) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			events = xrtc.DataChannel.events;

		dataChannel.onopen = proxy(channelOnOpen);
		dataChannel.onmessage = proxy(channelOnMessage);
		/* dataChannel.onclose tested in case of disconnect(close browser tab) of remote browser for Chrome M29 */
		// todo: need to test onclose event in case of remote client disconnection for Chrome M25-28.
		dataChannel.onclose = proxy(channelOnClose);
		dataChannel.onerror = proxy(channelOnError);
		dataChannel.ondatachannel = proxy(channelOnDatachannel);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			send: function (message) {
				/// <summary>Sends a message to remote user</summary>
				/// <param name="mesage" type="object">Message to send</param>

				logger.info('send', arguments);

				if (this.getState() === xrtc.DataChannel.states.open) {
					try {
						var messageContainer = { message: message };
						dataChannel.send(JSON.stringify(messageContainer));
						this.trigger(events.sentMessage, messageContainer);
					} catch(ex) {
						var sendingError = new xrtc.CommonError('onerror', 'DataChannel sending error.', ex);
						logger.error('error', sendingError);
						this.trigger(events.error, sendingError);
					}
				} else {
					var error = new xrtc.CommonError('onerror', 'DataChannel should be opened before sending.');
					logger.error('error', error);
					this.trigger(events.error, error);
				}
			},

			getUserId: function() {
				return userId;
			},

			getName: function() {
				return dataChannel.label;
			},

			getState: function () {
				/* W3C Editor's Draft 30 August 2013:
				enum RTCDataChannelState {
					"connecting",
					"open",
					"closing",
					"closed"
				};
				*/

				return dataChannel.readyState.toLowerCase();
			}
		});

		function channelOnOpen(evt) {
			var data = { event: evt };
			logger.debug('open', data);
			this.trigger(events.open, data);
		};

		function channelOnMessage(evt) {
			var messageContainer = JSON.parse(evt.data);

			logger.debug('message', messageContainer);
			this.trigger(events.receivedMessage, messageContainer);
		}

		function channelOnClose(evt) {
			var data = { event: evt };
			logger.debug('close', data);
			this.trigger(events.close, data);
		}

		function channelOnError(evt) {
			var error = new xrtc.CommonError('onerror', 'DataChannel error.', evt);
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
			sentMessage: 'sentMessage',
			receivedMessage: 'receivedMessage',
			close: 'close',
			error: 'error',
			dataChannel: 'datachannel'
		},

		states: {
			connecting: "connecting",
			open: "open",
			closing: "closing",
			closed: "closed"
		}
	});
})(window);