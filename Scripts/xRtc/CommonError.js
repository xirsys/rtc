// #### Version 1.3.0 ####

// Special class which used for all unhandled errors in the xRtc library.

'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	
	xrtc.Class(xrtc, 'CommonError', function CommonError(method, message, error) {
		this.method = method;
		this.message = message;
		this.error = error;
	});
})(window);