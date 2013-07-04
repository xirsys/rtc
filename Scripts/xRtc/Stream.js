'use strict';

(function (xrtc) {
	var webrtc = xrtc.Connection.webrtc;

	//todo: possible we should wrap Video and Audio Tracks
	xrtc.Class(xrtc, 'Stream', function Stream(stream) {
		var proxy = xrtc.Class.proxy(this),
			isLocal = stream.constructor.name === 'LocalMediaStream';

		xrtc.Class.property(this, 'videoEnabled', getVideoEnabled, setVideoEnabled);
		xrtc.Class.property(this, 'audioEnabled', getAudioEnabled, setAudioEnabled);
		xrtc.Class.property(this, 'videoAvailable', getVideoAvailable);
		xrtc.Class.property(this, 'audioAvailable', getAudioAvailable);

		xrtc.Class.extend(this, {
			getStream: function () {
				return stream;
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
						setTimeout(proxy(this.assignTo, videoDomElement), 100);
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

		function reassign(to, from) {
			if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
				to.mozSrcObject = from.mozSrcObject;
			} else {
				to.src = from.src;
			}

			to.play();
		}

		function getVideoEnabled() {
			var videoTracks = stream.getVideoTracks();
			return this.videoAvailable && videoTracks[0].enabled;
		}

		function setVideoEnabled(val) {
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
	});
})(xRtc);