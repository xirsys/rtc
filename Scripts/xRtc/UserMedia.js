'use strict';

(function (exports) {
	var xrtc = exports.xRtc,
		webrtc = xrtc.webrtc,
		getUserMedia = function(options, successCallback, errorCallback) {
			webrtc.getUserMedia(options, onGetUserMediaSuccess, onGetUserMediaError);

			function onGetUserMediaSuccess(stream) {
				if (typeof successCallback === "function") {
					successCallback(new xrtc.Stream(stream));
				}
			}

			function onGetUserMediaError(err) {
				if (typeof errorCallback === "function") {
					errorCallback(err);
				}
			}
		};

	xrtc.getUserMedia = function (options, successCallback, errorCallback) {
		/// <summary>Asks user to allow use local devices, e.g. camera and microphone</summary>
		/// <param name="options" type="object">Optional param. Local media options</param>

		var mediaOptions = options || { video: true, audio: true };
		if (mediaOptions.video && mediaOptions.video.mandatory && mediaOptions.video.mandatory.mediaSource === "screen") {
			getUserMedia.call(this, { video: { mandatory: { chromeMediaSource: "screen" } } }, function (screenSharingStream) {
				if (mediaOptions.audio) {
					getUserMedia.call(this, { audio: true }, function (audioStream) {
						function addTracks(array, tracks) {
							for (var i = 0; i < tracks.length; i++) {
								array.push(tracks[i]);
							}
						}

						// Combine audio and video components of different streams in one stream
						var mediaStreamTracks = [];
						addTracks(mediaStreamTracks, audioStream.getAudioTracks());
						addTracks(mediaStreamTracks, screenSharingStream.getVideoTracks());

						successCallback(new webrtc.MediaStream(mediaStreamTracks));
					}, errorCallback);
				} else {
					successCallback(screenSharingStream);
				}
			}, errorCallback);
		} else {
			getUserMedia.call(this, mediaOptions, successCallback, errorCallback);
		}
	};
})(window);