// #### Version 1.3.0 ####

// `xRtc.getUserMedia` is the special functions for accessing media (audio, video, screen) information.

'use strict';

(function (exports) {
	var xrtc = exports.xRtc,
		webrtc = xrtc.webrtc,
		logger = new xrtc.Logger("UserMedia"),
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

	// **[Public API]:** Asks user to allow use local devices, e.g. camera and microphone.
	xrtc.getUserMedia = function (options, successCallback, errorCallback) {
		if (options && !options.video && !options.audio) {
			var error = new xrtc.CommonError('getUserMedia', "video or audio property of the options parameter should be specified. No sense to create media stream without video and audio components.");
			logger.error('onCreateOfferError', error);
		}

		var mediaOptions = options || { video: true, audio: true };
		if (mediaOptions.video && mediaOptions.video.mandatory && mediaOptions.video.mandatory.mediaSource === "screen") {
			getUserMedia.call(this, { video: { mandatory: { chromeMediaSource: "screen" } } }, function (screenSharingStream) {
				if (mediaOptions.audio) {
					// *FF 20.0.1: (Not shure about other version, FF 21 works fine)* reduces the overall sound of the computer (playing using *Chrome* and maybe another *FF*) after calling this functionality.
					getUserMedia.call(this, { audio: true }, function (audioStream) {
						function addTracks(array, tracks) {
							for (var i = 0; i < tracks.length; i++) {
								array.push(tracks[i]);
							}
						}

						// Combine audio and video components of different streams in one stream.
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