(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.Logger = new xrtc.Class();

	xrtc.Logger.include({
		info: function () {
			console.log("Info: ", arguments);
		},

		debug: function () {
			console.log("Debug: ", arguments);
		},

		warning: function () {
			console.log("Warning: ", arguments);
		}
	});
})(window);