'use strict';

(function (exports) {
	var URL = exports.webkitURL || exports.msURL || exports.oURL || exports.URL;
	
	var xrtc = exports.xRtc;
	xrtc.Stream = xrtc.Class('Stream');

	xrtc.Stream.include({
		init: function (stream, participantId) {
			this._stream = stream,
			this._participantId = participantId;
		},
		
		getURL: function() {
			return URL.createObjectURL(this._stream);
		},
		
		getParticipantName: function() {
			return this._participantId;
		},
		
		isLocal: function() {
			return this._stream.constructor.name === 'LocalMediaStream';
		},

		assignTo: function (video) {
			if (this.isLocal()) {
				this._assignTo(video);
			} else {
				// stream could not be started if it has not been downloaded yet
				// todo: add for supporting of Firefox
				// this._stream.getRemoteStreams()[0].currentTime > 0
				if (this._stream.getVideoTracks().length > 0) {
					this._assignTo(video);
				} else {
					setTimeout(this.proxy(this.assignTo, video), 100);
				}
			}
		},
		
		_assignTo: function (video) {
			// currently for firefox 'src' does not work, in future it can be removed
			var isFirefox = !!navigator.mozGetUserMedia;
			if (isFirefox) {
				video.mozSrcObject = this._stream;
			} else {
				video.src = this.getURL();
			}
		}
	});
})(window);