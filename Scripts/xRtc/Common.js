// #### Version 1.3.0 ####

'use strict';

(function (exports) {
	exports.xRtc = {};
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
})(window);