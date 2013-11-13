// #### Version 1.4.0 ####

// `xRtc.Stream` is one of the main objects of **xRtc** library. It is wrapper to native browser's `MediaStream`.
// All instances of this object should be created by `xRtc.getUserMedia(options, successCallback, errorCallback)` method.

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.stream');

goog.require('xRtc.baseClass');
goog.require('xRtc.eventDispatcher');
goog.require('xRtc.logger');
goog.require('xRtc.common');
goog.require('xRtc.commonError');

(function (exports, xrtc) {
	'use strict';

	var webrtc = xrtc.webrtc;

	// **Todo:** Possible we should wrap Video and Audio Tracks.
	xrtc.Class(xrtc, 'Stream', function Stream(stream) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			events = xrtc.Stream.events,
			id = null;

		xrtc.Class.property(this, 'videoEnabled', getVideoEnabled, setVideoEnabled);
		xrtc.Class.property(this, 'audioEnabled', getAudioEnabled, setAudioEnabled);
		xrtc.Class.property(this, 'videoAvailable', getVideoAvailable);
		xrtc.Class.property(this, 'audioAvailable', getAudioAvailable);

		stream.onended = proxy(onStreamEnded);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			// **[Public API]:** Returns native instanse of browser's `MediaStream`.
			// It is will be helpful if `xRtc.Stream` doesn't provide some functionality but this functionality exists in `MediaStream`.
			getStream: function () {
				return stream;
			},

			// **[Public API]:** Stops the stream. After stopping some native resources will be released and the stream can't be used further.
			stop: function() {
				stream.stop();
			},

			// **[Public API]:** Returns unique `id` of the stream.
			getId: function () {
				if (!id) {
					id = generateStreamId();
				}

				return id;
			},

			// **[Public API]: ** Returns `URL` of the stream which provides access to the stream.
			// E.g. The `URL` can be used for assigning to any html 'video' element.
			getURL: function () {
				return webrtc.URL.createObjectURL(stream);
			},

			// **[Public API]:** The method will be helpful if you want to assign the stream to html 'video' element.
			assignTo: function (videoDomElement) {
				// Stream could not be started if it has not been downloaded yet.
				if (this.videoAvailable || this.audioAvailable || stream.currentTime > 0) {
					assignTo.call(this, videoDomElement);
				} else {
					// This magic is needed for cross-browser support. Chrome works fine but in FF streams objects do not appear immediately.
					exports.setTimeout(proxy(this.assignTo, videoDomElement), 100);
				}
			}
		});

		function generateStreamId() {
			var resultId;
			if (stream.id) {
				// **Note:** `id` property is actual only for *Chrome M26+*. At the current moment FireFOxe doesn't support it.
				resultId = stream.id;
			} else {
				resultId = xrtc.utils.newGuid();
			}

			return resultId;
		}

		function assignTo(videoDomElement) {
			// Currently for *FireFox* `src` does not work, in future it can be removed.
			if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
				videoDomElement.mozSrcObject = stream;
			} else {
				videoDomElement.src = this.getURL();
			}

			videoDomElement.play();
		}

		function onStreamEnded(evt) {
			var data = { id: evt.srcElement.id };
			logger.debug('ended', data);
			this.trigger(events.ended, data);
		}

		function getVideoEnabled() {
			var videoTracks = stream.getVideoTracks();
			return this.videoAvailable && videoTracks[0].enabled;
		}

		function setVideoEnabled(val) {
			checkPossibilityToMuteMediaTrack();

			var videoTracks = stream.getVideoTracks();
			for (var i = 0, len = videoTracks.length; i < len; i++) {
				videoTracks[i].enabled = val;
			}
		}

		function getAudioEnabled() {
			var audioTracks = stream.getAudioTracks();
			return this.audioAvailable && audioTracks[0].enabled;
		}

		function setAudioEnabled(val) {
			checkPossibilityToMuteMediaTrack();

			var audioTracks = stream.getAudioTracks();
			for (var i = 0, len = audioTracks.length; i < len; i++) {
				audioTracks[i].enabled = val;
			}
		}

		function getVideoAvailable() {
			return stream.getVideoTracks().length > 0;
		}

		function getAudioAvailable() {
			return stream.getAudioTracks().length > 0;
		}

		function checkPossibilityToMuteMediaTrack() {
			if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion < 22) {
				throw new xrtc.CommonError('setVideoEnabled', 'Media track muting is not supported if your Firefox browser version less then 22.');
			}
		}
	});

	xrtc.Stream.extend({
		// **Note:** Full list of events for the `xRtc.Stream` object.
		events: {
			ended: 'ended'
		}
	});
})(window, xRtc);