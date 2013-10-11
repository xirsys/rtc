// #### Version 1.3.0 ####

// `xRtc.Stream` is one of the main objects of **xRtc** library.

'use strict';

(function (exports, xrtc) {
	var webrtc = xrtc.webrtc;

	// **Todo:** Possible we should wrap Video and Audio Tracks.
	xrtc.Class(xrtc, 'Stream', function Stream(stream) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			events = xrtc.Stream.events;

		xrtc.Class.property(this, 'videoEnabled', getVideoEnabled, setVideoEnabled);
		xrtc.Class.property(this, 'audioEnabled', getAudioEnabled, setAudioEnabled);
		xrtc.Class.property(this, 'videoAvailable', getVideoAvailable);
		xrtc.Class.property(this, 'audioAvailable', getAudioAvailable);

		stream.onended = proxy(onStreamEnded);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			// **[Public API]**
			getStream: function () {
				return stream;
			},

			// **[Public API]**
			stop: function() {
				stream.stop();
			},

			// **[Public API]**
			getId: function () {
				// **Note:** `id` property is actual only for *Chrome M26+*.
				// **Todo:** need to delete this property or generate own id in case of *FF* or *Chrome M25*.
				return stream.id;
			},

			// **[Public API]**
			getURL: function () {
				return webrtc.URL.createObjectURL(stream);
			},

			// **[Public API]**
			assignTo: function (videoDomElement) {
				// stream could not be started if it has not been downloaded yet
				if (this.videoAvailable || this.audioAvailable || stream.currentTime > 0) {
					assignTo.call(this, videoDomElement);
				} else {
					//This magic is needed for cross-browser support. Chrome works fine but in FF streams objects do not appear immediately
					exports.setTimeout(proxy(this.assignTo, videoDomElement), 100);
				}
			}
		});

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
			if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
				throw new xrtc.CommonError('setVideoEnabled', 'Media track muting is not supported by Firefox browser.');
			}
		}
	});

	// **Note:** Full list of events for the `xRtc.Stream` object.
	xrtc.Stream.extend({
		events: {
			ended: 'ended'
		}
	});
})(window, xRtc);