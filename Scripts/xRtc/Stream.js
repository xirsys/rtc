'use strict';

(function (exports) {
	var xrtc = exports.xRtc,
		URL = exports.webkitURL || exports.msURL || exports.oURL || exports.URL,
		isFirefox = !!navigator.mozGetUserMedia;

	// todo: extract participantId from here
	xrtc.Class(xrtc, 'Stream', function Stream(stream, participantId) {
		var proxy = xrtc.Class.proxy(this),
			isLocal = stream.constructor.name === 'LocalMediaStream';

		xrtc.Class.property(this, 'videoEnabled', getVideoEnabled, setVideoEnabled);
		xrtc.Class.property(this, 'audioEnabled', getAudioEnabled, setAudioEnabled);
		
		xrtc.Class.extend(this, {
			getStream: function () {
				return stream;
			},

			getURL: function () {
				return URL.createObjectURL(stream);
			},

			getParticipantName: function () {
				return participantId;
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
			return stream.getVideoTracks()[0].enabled;
		}

		function setVideoEnabled(val) {
			stream.getVideoTracks()[0].enabled = val;
		}

		function getAudioEnabled() {
			return stream.getAudioTracks()[0].enabled;
		}

		function setAudioEnabled(val) {
			stream.getAudioTracks()[0].enabled = val;
		}
	});
})(window);