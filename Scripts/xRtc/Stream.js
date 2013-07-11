'use strict';

(function (exports, xrtc) {
	var webrtc = xrtc.webrtc;

	//todo: possible we should wrap Video and Audio Tracks
	xrtc.Class(xrtc, 'Stream', function Stream(stream) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			events = xrtc.Stream.events,
			isLocal = stream.constructor.name === 'LocalMediaStream';

		xrtc.Class.property(this, 'videoEnabled', getVideoEnabled, setVideoEnabled);
		xrtc.Class.property(this, 'audioEnabled', getAudioEnabled, setAudioEnabled);
		xrtc.Class.property(this, 'videoAvailable', getVideoAvailable);
		xrtc.Class.property(this, 'audioAvailable', getAudioAvailable);

		stream.onended = proxy(onStreamEnded);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			getStream: function () {
				return stream;
			},

			getId: function() {
				return stream.id;
			},

			getURL: function () {
				return webrtc.URL.createObjectURL(stream);
			},

			isLocal: function () {
				return isLocal;
			},

			assignTo: function (videoDomElement) {
				if (this.isLocal()) {
					assignTo.call(this, videoDomElement);
				} else {
					// stream could not be started if it has not been downloaded yet
					if (this.videoAvailable || this.audioAvailable || stream.currentTime > 0) {
						assignTo.call(this, videoDomElement);
					} else {
						//This magic is needed for cross-browser support. Chrome works fine but in FF streams objects do not appear immediately
						exports.setTimeout(proxy(this.assignTo, videoDomElement), 100);
					}
				}
			}
		});

		function assignTo(videoDomElement) {
			// currently for firefox 'src' does not work, in future it can be removed
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

	xrtc.Stream.extend({
		events: {
			ended: 'ended'
		}
	});
})(window, xRtc);