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

	xrtc.Class(xrtc, 'Stream', function Stream(stream) {
		var proxy = xrtc.Class.proxy(this),
			isLocal = stream.constructor.name === 'LocalMediaStream';

		xrtc.Class.property(this, 'videoEnabled', getVideoEnabled, setVideoEnabled);
		xrtc.Class.property(this, 'audioEnabled', getAudioEnabled, setAudioEnabled);

		xrtc.Class.extend(this, {
			getURL: function () {
				return URL.createObjectURL(stream);
			},

			isLocal: function () {
				return isLocal;
			},

			assignTo: function (video) {
				if (this.isLocal()) {
					assignTo.call(this, video);
				} else {
					// stream could not be started if it has not been downloaded yet
					// todo: add for support of Firefox
					// stream.getRemoteStreams()[0].currentTime > 0
					if (stream.getVideoTracks().length > 0) {
						assignTo.call(this, video);
					} else {
						//This magic is needed for cross-browser support. Chrome works fine but in FF streams objects do not appear immediately.
						setTimeout(proxy(this.assignTo, video), 100);
					}
				}
			}
		});

		function assignTo(video) {
			// currently for firefox 'src' does not work, in future it can be removed
			if (isFirefox) {
				video.mozSrcObject = stream;
			} else {
				video.src = this.getURL();
			}
		}

		function getVideoEnabled() {
			var videoTracks = stream.getVideoTracks();
			return videoTracks.length > 0 && videoTracks[0].enabled;
		}

		function setVideoEnabled(val) {
			var videoTracks = stream.getVideoTracks();
			for (var i = 0, len = videoTracks.length; i < len; i++) {
				videoTracks[i].enabled = val;
			}
		}

		function getAudioEnabled() {
			var audioTracks = stream.getAudioTracks();
			return audioTracks.length > 0 && audioTracks[0].enabled;
		}

		function setAudioEnabled(val) {
			var audioTracks = stream.getAudioTracks();
			for (var i = 0, len = audioTracks.length; i < len; i++) {
				audioTracks[i].enabled = val;
			}
		}
	});
})(window);