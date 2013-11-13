// #### Version 1.4.0 ####

// Special class which used for all unhandled errors in the xRtc library.

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.commonError');

goog.require('xRtc.baseClass');

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