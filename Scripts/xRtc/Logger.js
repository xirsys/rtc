(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.Logger = new xrtc.Class('Logger');

	xrtc.Logger.include({
		info: function () {
			console.log("Info: ", Array.prototype.slice.call(arguments));
		},

		debug: function () {
			console.log("Debug: ", Array.prototype.slice.call(arguments));
		},

		warning: function () {
			console.log("Warning: ", Array.prototype.slice.call(arguments));
		},
		
		error: function () {
			console.log("Error: ", Array.prototype.slice.call(arguments));
		}
	});
})(window);