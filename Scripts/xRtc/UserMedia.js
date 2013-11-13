// #### Version 1.4.0 ####

// `xRtc.getUserMedia` is the special functions for accessing media data:

// * audio
// * video
// * screen sharing

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.userMedia');

goog.require('xRtc.common');
goog.require('xRtc.commonError');
goog.require('xRtc.logger');
goog.require('xRtc.stream');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

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

	// **[Public API]:** Asks user to allow use local devices, e.g. **camera**, **microphone**, **screen**.

	// **Note:** Screen sharing available only for *Chrome 25+* with special flag `#enable-usermedia-screen-capture` and only in case
	// when application (app which uses xRtc) was loaded by **HTTPS** protocol.

	// **Simple examples:**

	// * `xRtc.getUserMedia({ audio: true, video: true }, function(stream){}, function(error){});`
	// * `xRtc.getUserMedia({ audio: true }, function(stream){}, function(error){});`
	// * `xRtc.getUserMedia({ video: true }, function(stream){}, function(error){});`
	// * `xRtc.getUserMedia({ video: { mandatory: { mediaSource: "screen" } } }, function(stream){}, function(error){});`
	// * `xRtc.getUserMedia({ video: { mandatory: { mediaSource: "screen" } }, audio: true }, function(stream){}, function(error){});`
	// * `xRtc.getUserMedia({ video: { mandatory: { minWidth: 1280, maxWidth: 1280, minHeight: 720, maxHeight: 720, minFrameRate: 30 }}, function(stream){}, function(error){});`

	// **Note:** xRtc.getUserMedia uses the same option as native browser's getUserMedia. Some examples of otions you can find here:
	// <http://webrtc.googlecode.com/svn/trunk/samples/js/demos/html/constraints-and-stats.html>
	xrtc.getUserMedia = function (options, successCallback, errorCallback) {
		if (options && !options.video && !options.audio) {
			var error = new xrtc.CommonError('getUserMedia', "video or audio property of the options parameter should be specified. No sense to create media stream without video and audio components.");
			logger.error('onCreateOfferError', error);
		}

		var mediaOptions = options || { video: true, audio: true };
		if (mediaOptions.video && mediaOptions.video.mandatory && mediaOptions.video.mandatory.mediaSource === "screen") {
			getUserMedia.call(this, { video: { mandatory: { chromeMediaSource: "screen" } } }, function (screenSharingStream) {
				if (mediaOptions.audio) {
					// *FF 20.0.1: (Not shure about other version, FF 21 works fine)*
					// reduces the overall sound of the computer (playing using *Chrome* and maybe another *FF*) after calling this functionality.
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