// #### Version 1.4.0 ####

// Some common information. E.g. current browser, current browser version, etc.

// **Simple examples:**

// * `var currentBrowser = xRtc.webrtc.detectedBrowser;`
// * `var currentBrowserVersion = xRtc.webrtc.detectedBrowserVersion;`

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.common');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;

	xrtc.webrtc = {
		getUserMedia: (navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia || navigator.getUserMedia).bind(navigator),
		RTCPeerConnection: exports.mozRTCPeerConnection || exports.webkitRTCPeerConnection || exports.RTCPeerConnection,
		RTCIceCandidate: exports.mozRTCIceCandidate || exports.RTCIceCandidate,
		RTCSessionDescription: exports.mozRTCSessionDescription || exports.RTCSessionDescription,
		URL: exports.webkitURL || exports.msURL || exports.oURL || exports.URL,
		MediaStream: exports.mozMediaStream || exports.webkitMediaStream || exports.MediaStream,
		supportedBrowsers: { chrome: "chrome", firefox: "firefox" }
	};

	xrtc.webrtc.detectedBrowser = navigator.mozGetUserMedia ? xrtc.webrtc.supportedBrowsers.firefox : xrtc.webrtc.supportedBrowsers.chrome;
	xrtc.webrtc.detectedBrowserVersion = xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.firefox
		? parseInt(exports.navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1])
		: parseInt(exports.navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);

	xRtc.utils = {
		newGuid: function() {
			var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
			return guid;
		}
	};
})(window);