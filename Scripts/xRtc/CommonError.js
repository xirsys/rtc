'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.CommonError = xrtc.Class('CommonError');

	xrtc.CommonError.include({
		init: function (method, message, error) {
			this.method = method;
			this.message = message;
			this.error = error;
		}
	});
})(window);