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
		supportedBrowsers: { chrome: "chrome", firefox: "firefox" }
	};

	xrtc.webrtc.detectedBrowser = navigator.mozGetUserMedia ? xrtc.webrtc.supportedBrowsers.firefox : xrtc.webrtc.supportedBrowsers.chrome;
	xrtc.webrtc.detectedBrowserVersion = xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.firefox
		? parseInt(exports.navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1])
		: parseInt(exports.navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);

	// Features which supported by current browser.
	xrtc.webrtc.supports = function() {
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
				pc.createDataChannel('_XRTCTEST', {reliable: false});
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
			sctp: sctp
		};
	}();

	xrtc.binarySerializer = {
		// **Note:** External reference to BinaryPack library.
		pack: function(data, successCallback, errorCallback) {
			toArrayBuffer(BinaryPack.pack(data), successCallback, errorCallback);
		},
		unpack: BinaryPack.unpack
	};

	function toArrayBuffer(source, successCallback, errorCallback) {
		if (source instanceof ArrayBuffer) {
			if (typeof successCallback === 'function') {
				successCallback(source);
			}
		} else if (source instanceof Blob /*Blob or File*/) {
			var reader = new FileReader();

			reader.onerror = function (evt) {
				if (typeof errorCallback === 'function') {
					errorCallback(evt.target.error);
				}
			};

			reader.onloadend = function (loadedEvt) {
				if (loadedEvt.target.readyState == FileReader.DONE
					&& !loadedEvt.target.error
					&& typeof successCallback === 'function') {
					successCallback(loadedEvt.target.result);
				}
			};

			reader.readAsArrayBuffer(source);
		} else if (typeof errorCallback === 'function') {
			errorCallback("Can't parse 'source' to ArrayBuffer. 'source' should be from following list: Blob, File, ArrayBuffer.");
		}
	}

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