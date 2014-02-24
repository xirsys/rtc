// #### Version 1.5.0####

// Special class which used for all unhandled errors in the xRtc library.

// **Dependencies:**

// class.js.

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;
	
	xrtc.Class(xrtc, 'CommonError', function CommonError(method, message, error) {
		this.method = method;
		this.message = message;
		this.error = error;
	});
})(window);