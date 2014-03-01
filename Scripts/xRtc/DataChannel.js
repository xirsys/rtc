// #### Version 1.5.0####

// `xRtc.DataChannel` is one of the main objects of **xRtc** library. This object can be used for trenferring any information to remote side.

//** Supported browsers:**

// * Chrome 25+;
// * FireFox 22+;
// * Opera 17+ (Chromium).

//** Restrictions:**

// * Reliable channels and possibility to transfer files (sctp protocol) supported only by FireFox 22+, Chrome 31+, Opera 19+;
// * Following types can be sended via data channels (All types which supported by BinaryPack library (binarypack.js)).
//   Simple types: `string`, `number`, `boolean`, `undefined`.
//   Object types: `Array`, `Blob`, `File`, `ArrayBuffer`, `Date`, `Object`.

//** Interoperability cases which works:**

// * Chrome 25-31 to Chrome 25-31;
// * Chrome 25-31 to Opera 17;
// * Chrome 32+ to Chrome 32+;
// * Chrome 32+ to FireFox 26+;

// * FireFox 22+ to FireFox 22+;
// * FireFox 26+ to Chrome 32+;

// * Opera 17 to Opera 17;
// * Opera 17 to Chrome 25-31;
// * Opera 18 to Opera 18;
// * Opera 19 to Opera 19.

// **Todo: Need to test it and created interoperability table. E.g. Opera didn't teste almost in interoperability mode.**

// **Dependencies:**

// * class.js;
// * eventDispatcher.js;
// * logger.js;
// * common.js;
// * commonError.js.

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'DataChannel', function (dataChannel, connection) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			events = xrtc.DataChannel.events,
			transferringProgressInterval = 10, /*In packets, 1Mb ~ 64 packets if packet size is 16300 bytes*/
			// The original 60000 bytes setting does not work when sending data from Firefox to Chrome, which is "cut off" after 16384 bytes and delivered individually.
			chunkSize = 16300, /*bytes*/
			attemptsMaxCount = 100,
			// Phases of data sending:

			// * Data will be serialized to binary format;
			// * Data will be chunked to small pieces because Chrome doesn't support large messages;
			// * Each chunk will be serialized to binary format;
			// * Each serilized chunk will be transformed to ArrayBuffer because only this data format supported by all browsers which supports WebRTC;
			// * Sending using buffer. If during sending error will be fired then sending will be repeated little bit later until it will be sent.
			sender = new BinarySender(new ChunkedSender(new BinarySender(new ArrayBufferSender(new BufferedSender(dataChannel, attemptsMaxCount))), chunkSize)),
			receivedChunks = {};

		dataChannel.onopen = proxy(channelOnOpen);
		dataChannel.onmessage = proxy(channelOnMessage);
		// `dataChannel.onclose` tested in case of disconnect(close browser tab) of remote browser for *Chrome M29*
		// **Todo:** Need to test onclose event in case of remote client disconnection for *Chrome M25-28*.
		dataChannel.onclose = proxy(channelOnClose);
		dataChannel.onerror = proxy(channelOnError);
		dataChannel.ondatachannel = proxy(channelOnDatachannel);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			// **[Public API]:** Returns unique data channel id.
			getId: function () {
				return connection.getId() + this.getName();
			},

			// **[Public API]:** Returns remote user for this data channel.
			getRemoteUser: function () {
				return connection.getRemoteUser();
			},

			// **[Public API]:** Returns parent connection.
			getConnection: function () {
				return connection;
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
			},

			// **[Public API]:** Sends a message to remote user where `msg` is message to send.
			send: function (msg, successCallback, failCallback, options /*{ messageId }*/) {
				var self = this;

				var currentState = self.getState();
				if (currentState !== xrtc.DataChannel.states.open) {
					var incorrectStateError = new xrtc.CommonError('send', 'DataChannel should be opened before sending some data. Current channel state is "' + currentState + '"');
					logger.error('error', incorrectStateError);
					self.trigger(events.error, incorrectStateError);
				}

				logger.info('send', msg);

				sender.send(
					msg,
					function () {
						var evt = { data: msg };
						if (typeof successCallback === "function") {
							successCallback(evt);
						}

						self.trigger(events.sentMessage, evt);
					},
					function (evt) {
						var sendError = new xrtc.CommonError('send', 'DataChannel error.', evt);
						logger.error('error', sendError);

						if (typeof failCallback === "function") {
							failCallback(sendError);
						}

						self.trigger(events.error, sendError);
					},
					function (evt) {
						if (evt.count % transferringProgressInterval === 0 || evt.count === evt.total) {
							self.trigger(events.progress, { messageId: evt.messageId, percent: 100 * evt.count / evt.total });
						}
					},
					options && options.messageId ? { messageId: options.messageId } : null);
			}
		});

		function channelOnOpen(evt) {
			var data = { event: evt };
			logger.debug('open', data);
			this.trigger(events.open, data);
		};

		function channelOnMessage(evt) {
			var self = this;

			logger.debug('message', evt.data);

			var dataType = evt.data.constructor;
			if (dataType === exports.ArrayBuffer) {
				handleIncomingArrayBuffer.call(self, evt.data);
			} else if (dataType === exports.Blob) {
				blobToArrayBuffer(evt.data, function (arrayBuffer) {
					handleIncomingArrayBuffer.call(self, arrayBuffer);
				});
			}
		}

		function handleIncomingArrayBuffer(arrayBuffer) {
			var self = this;

			var chunk = xrtc.blobSerializer.unpack(arrayBuffer);
			if (chunk.total === 1) {
				self.trigger(events.receivedMessage, { data: xrtc.blobSerializer.unpack(chunk.data) });
			} else {
				if (!receivedChunks[chunk.messageId]) {
					receivedChunks[chunk.messageId] = { data: [], count: 0, total: chunk.total };
				}

				var blobChunks = receivedChunks[chunk.messageId];
				blobChunks.data[chunk.index] = chunk.data;
				blobChunks.count += 1;

				if (blobChunks.count % transferringProgressInterval === 0 || blobChunks.total === blobChunks.count) {
					self.trigger(events.progress, { messageId: chunk.messageId, percent: 100 * blobChunks.count / blobChunks.total });
				}

				if (blobChunks.total === blobChunks.count) {
					blobToArrayBuffer(new exports.Blob(blobChunks.data), function (ab) {
						self.trigger(events.receivedMessage, { data: xrtc.blobSerializer.unpack(ab) });
						delete blobChunks[chunk.messageId];
					});
				}
			}
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
			progress: 'progress',
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


	// BEGIN Binary Sender

	function BinarySender(sender) {
		this._sender = sender;
	}

	BinarySender.prototype.send = function (message, successCallback, failCallback, progressCallback, options) {
		this._sender.send(xrtc.blobSerializer.pack(message), successCallback, failCallback, progressCallback, options);
	};

	// END Binary Sender

	function blobToArrayBuffer(blob, callback) {
		var fileReader = new exports.FileReader();
		fileReader.onload = function (evt) {
			callback(evt.target.result);
		};

		fileReader.readAsArrayBuffer(blob);
	}

	// BEGIN Chunked Sender

	function ChunkedSender(sender, chunkSize) {
		this._sender = sender;
		this.chunkSize = chunkSize;
	}

	ChunkedSender.prototype.send = function (blob, successCallback, failCallback, progressCallback, options) {
		this._sendChunks(this._splitToChunks(blob, options), successCallback, failCallback, progressCallback);
	};

	ChunkedSender.prototype._splitToChunks = function (blob, options) {
		var messageId = options && options.messageId ? options.messageId : xRtc.utils.newGuid(),
			chunks = [],
			size = blob.size,
			start = 0,
			index = 0,
			total = Math.ceil(size / this.chunkSize);

		while (start < size) {
			var end = Math.min(size, start + this.chunkSize);

			var chunk = {
				messageId: messageId,
				index: index,
				data: blob.slice(start, end),
				total: total
			};

			chunks.push(chunk);

			start = end;
			index += 1;
		}

		return chunks;
	};

	ChunkedSender.prototype._sendChunks = function (chunks, successCallback, failCallback, progressCallback) {
		var self = this;

		if (chunks.length === 0) {
			if (typeof successCallback === "function") {
				successCallback();
			}

			return;
		}

		var firstChunk = chunks.shift();

		this._sender.send(
			firstChunk,
			function () {
				if (typeof progressCallback === "function") {
					progressCallback({ messageId: firstChunk.messageId, count: firstChunk.index + 1, total: firstChunk.total });
				}

				self._sendChunks(chunks, successCallback, failCallback, progressCallback);
			},
			failCallback);
	};

	// END Chunked Sender

	// BEGIN ArrayBuffer Sender

	function ArrayBufferSender(sender) {
		this._sender = sender;
	}

	ArrayBufferSender.prototype.send = function (blob, successCallback, failCallback) {
		var self = this;
		blobToArrayBuffer(blob, function (arrayBuffer) {
			self._sender.send(arrayBuffer, successCallback, failCallback);
		});
	};

	// END ArrayBuffer Sender

	// BEGIN Buffered Sender

	function BufferedSender(sender, attemptsMaxCount) {
		this._sender = sender;
		this._attemptsMaxCount = attemptsMaxCount;
		this._buffer = [];
		this._sendImmediately = true;
	}

	BufferedSender.prototype.send = function (message, successCallback, failCallback) {
		this._buffer.push(message);
		this._sendBuffer(this._buffer, successCallback, failCallback, 0);
	};

	BufferedSender.prototype._sendBuffer = function (buffer, successCallback, failCallback, attemptCounter) {
		var self = this;

		var attemptsExceeded = function (ex) {
			if (attemptCounter === self._attemptsMaxCount && typeof failCallback === "function") {
				failCallback(ex);
			}
		};

		if (self._sendImmediately) {
			if (!self._trySendBuffer(buffer, successCallback, attemptsExceeded, attemptCounter)) {
				if (attemptCounter < self._attemptsMaxCount) {
					self._sendImmediately = false;

					exports.setTimeout(function () {
						self._sendImmediately = true;
						self._sendBuffer(buffer, successCallback, failCallback, ++attemptCounter);
					}, 100);
				} else {

				}
			}
		}
	};

	BufferedSender.prototype._trySendBuffer = function (buffer, successCallback, failCallback) {
		if (buffer.length === 0) {
			return true;
		}

		if (this._trySend(buffer[0], successCallback, failCallback)) {
			buffer.shift();
			return this._trySendBuffer(buffer, successCallback, failCallback);
		} else {
			return false;
		}
	};

	BufferedSender.prototype._trySend = function (message, successCallback, failCallback) {
		try {
			this._sender.send(message);
		} catch (ex) {
			failCallback(ex);
			return false;
		}

		if (typeof successCallback === "function") {
			successCallback();
		}
		return true;
	};

	// END Buffered Sender
})(window);