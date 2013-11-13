// #### Version 1.4.0 ####

// `xRtc.DataChannel` is one of the main objects of **xRtc** library. This object can be used for trenferring any information to remote side.

// **Note:** xRtc 1.4.0 supports only `text` messages. If `object` will be used then it will be serialized to `text` (JSON).

//**xRtc 1.4.0 restrictions:**

// * Message should be less then ~1000 symbols.
// * Interoperablity between *FireFox* and *Chrome* doesn't supported.

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.dataChannel');

goog.require('xRtc.baseClass');
goog.require('xRtc.eventDispatcher');
goog.require('xRtc.logger');
goog.require('xRtc.common');
goog.require('xRtc.commonError');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'DataChannel', function (dataChannel, remoteUser) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			events = xrtc.DataChannel.events;

		dataChannel.onopen = proxy(channelOnOpen);
		dataChannel.onmessage = proxy(channelOnMessage);
		// `dataChannel.onclose` tested in case of disconnect(close browser tab) of remote browser for *Chrome M29*
		// **Todo:** Need to test onclose event in case of remote client disconnection for *Chrome M25-28*.
		dataChannel.onclose = proxy(channelOnClose);
		dataChannel.onerror = proxy(channelOnError);
		dataChannel.ondatachannel = proxy(channelOnDatachannel);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			// **[Public API]:** Sends a message to remote user where `mesage` is message to send.

			// **Note:** `mesage` can be as a `object` and as a `string`. In any case it is will be serialized to JSON and transferre to remote side
			// using p2p connection.
			send: function (message) {
				var self = this;
				logger.info('send', arguments);

				// **Note:** Sometimes data channel state is closed but it is works fine. So no need to check data channel status before sending.
				try {
					var messageContainer = { message: message };
					dataChannel.send(JSON.stringify(messageContainer));
					self.trigger(events.sentMessage, messageContainer);
				} catch (ex) {
					var sendingError = new xrtc.CommonError('onerror', 'DataChannel sending error. Channel state is "' + self.getState() + '"', ex);
					logger.error('error', sendingError);
					self.trigger(events.error, sendingError);
				}
			},

			// **[Public API]:** Returns remote user for this data channel.
			getRemoteUser: function () {
				return remoteUser;
			},

			// **[Public API]:** Returns unique `name` of the data channel.
			// This `name` should be specified on `createDataChannel(name)` method of `xRtc.Connection` object.
			getName: function () {
				return dataChannel.label;
			},

			// **[Public API]:** Returns the `state` of the data channel. Full list of states you can see below.
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
		// **Note:** Full list of events for the `xRtc.DataChannel` object.
		events: {
			open: 'open',
			sentMessage: 'sentMessage',
			receivedMessage: 'receivedMessage',
			close: 'close',
			error: 'error',
			dataChannel: 'datachannel'
		},

		// **Note:** Full list of states of the `xRtc.DataChannel` object.
		states: {
			connecting: "connecting",
			open: "open",
			closing: "closing",
			closed: "closed"
		}
	});
})(window);