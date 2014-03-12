// #### Version 1.5.0####

// Some common information. E.g. current browser, current browser version, etc.

// **Simple examples:**

// * `var currentBrowser = xRtc.webrtc.detectedBrowser;`
// * `var currentBrowserVersion = xRtc.webrtc.detectedBrowserVersion;`

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
		supportedBrowsers: { chrome: "chrome", firefox: "firefox", opera: "opera" /*18+*/ }
	};

	// FireFox will be detedcted using "feature detection" approach,
	// Opera will be detected by `navigator`string because Opera 18+ uses Chromium engine and can't be detected(difficult to choose appropriate feature) by feature.
	// **Note:** Some existed `navigator` strings can be found here <http://www.useragentstring.com/>
	xrtc.webrtc.detectedBrowser = navigator.mozGetUserMedia
		? xrtc.webrtc.supportedBrowsers.firefox
		: ((exports.navigator.userAgent.match(/Opera|OPR\//) ? xrtc.webrtc.supportedBrowsers.opera : xrtc.webrtc.supportedBrowsers.chrome));

	xrtc.webrtc.detectedBrowserVersion = xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.firefox
		? parseInt(exports.navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1])
		: (xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.opera
			? parseInt(exports.navigator.userAgent.match(/(Opera|OPR)\/([0-9]+)\./)[2])
			: parseInt(exports.navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]));

	// Features which supported by current browser.
	xrtc.webrtc.supports = function () {
		if (typeof xrtc.webrtc.RTCPeerConnection === 'undefined') {
			return {};
		}

		var media = false;
		var data = false;
		var sctp = false;

		var pc;
		try {
			pc = new xrtc.webrtc.RTCPeerConnection(null, { optional: [{ RtpDataChannels: true }] });
			media = true;
			try {
				pc.createDataChannel('_XRTCTEST', { reliable: false });
				data = true;

				var reliablePC = new xrtc.webrtc.RTCPeerConnection(null, {});
				try {
					var reliableDC = reliablePC.createDataChannel('_XRTCRELIABLETEST', { reliable: true });
					sctp = reliableDC.reliable;
				} catch (e) {
				}
				reliablePC.close();
			} catch (ignore) {
			}
		} catch (ignore) {
		}

		if (pc) {
			pc.close();
		}

		return {
			media: media,
			data: data,
			sctp: sctp,
			screen: xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.chrome && xrtc.webrtc.detectedBrowserVersion > 25
		};
	}();

	xrtc.binarySerializer = {
		// **Note:** External reference to BinaryPack library.
		pack: BinaryPack.pack,
		unpack: BinaryPack.unpack
	};

	xRtc.utils = {
		newGuid: function () {
			var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
			return guid;
		},

		clone: function (obj) {
			// Handle the 3 simple types, and null or undefined
			if (null == obj || "object" != typeof obj) return obj;

			// Handle Date
			if (obj instanceof Date) {
				var dateCopy = new Date();
				dateCopy.setTime(obj.getTime());
				return dateCopy;
			}

			// Handle Array
			if (obj instanceof Array) {
				var arrayCopy = [];
				for (var i = 0, len = obj.length; i < len; i++) {
					arrayCopy[i] = xRtc.utils.clone(obj[i]);
				}
				return arrayCopy;
			}

			// Handle Object
			if (obj instanceof Object) {
				var objectCopy = {};
				for (var attr in obj) {
					if (obj.hasOwnProperty(attr)) objectCopy[attr] = xRtc.utils.clone(obj[attr]);
				}
				return objectCopy;
			}

			throw new Error("Unable to copy obj! Its type isn't supported.");
		}
	};
})(window);