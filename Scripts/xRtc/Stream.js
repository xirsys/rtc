'use strict';

(function (exports) {
	var xrtc = exports.xRtc,
		URL = exports.webkitURL || exports.msURL || exports.oURL || exports.URL,
		MediaStream = exports.mozMediaStream || exports.webkitMediaStream || exports.MediaStream,
		isFirefox = !!navigator.mozGetUserMedia;

	//Cross-browser support: New syntax of getXXXTracks method in Chrome M26.
	if (!MediaStream.prototype.getVideoTracks) {
		if (isFirefox) {
			xrtc.Class.extend(MediaStream.prototype, {
				getVideoTracks: function () {
					return [];
				},

				getAudioTracks: function () {
					return [];
				}
			});
		} else {
			xrtc.Class.extend(MediaStream.prototype, {
				getVideoTracks: function () {
					return this.videoTracks;
				},

				getAudioTracks: function () {
					return this.audioTracks;
				}
			});
		}
	}

	//todo: possible we should wrap Video and Audio Tracks
	xrtc.Class(xrtc, 'Stream', function Stream(stream) {
		var proxy = xrtc.Class.proxy(this),
			isLocal = stream.constructor.name === 'LocalMediaStream';

		xrtc.Class.property(this, 'videoEnabled', getVideoEnabled, setVideoEnabled);
		xrtc.Class.property(this, 'audioEnabled', getAudioEnabled, setAudioEnabled);
		xrtc.Class.property(this, 'videoAvailable', getVideoAvailable);
		xrtc.Class.property(this, 'audioAvailable', getAudioAvailable);

		xrtc.Class.extend(this, {
			getURL: function () {
				return URL.createObjectURL(stream);
			},

			isLocal: function () {
				return isLocal;
			},

			assignTo: function (videoDOMElement) {
				if (this.isLocal()) {
					assignTo.call(this, videoDOMElement);
				} else {
					// stream could not be started if it has not been downloaded yet
					// todo: add for support of Firefox
					// stream.getRemoteStreams()[0].currentTime > 0
					if (this.videoAvailable || this.audioAvailable) {
						assignTo.call(this, videoDOMElement);
					} else {
						//This magic is needed for cross-browser support. Chrome works fine but in FF streams objects do not appear immediately
						setTimeout(proxy(this.assignTo, videoDOMElement), 100);
					}
				}
			}
		});

		function assignTo(videoDOMElement) {
			// currently for firefox 'src' does not work, in future it can be removed
			if (isFirefox) {
				videoDOMElement.mozSrcObject = stream;
			} else {
				videoDOMElement.src = this.getURL();
			}

			videoDOMElement.play();
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
})(window);