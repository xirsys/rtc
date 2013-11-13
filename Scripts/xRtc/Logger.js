// #### Version 1.4.0 ####

// This class used by xRtc for logging all events which can happen in the library:

// * info
// * debug
// * test
// * warning
// * error

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.logger');

goog.require('xRtc.baseClass');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;
	xrtc.Class(xrtc, 'Logger', function Logger(className) {
		xrtc.Class.extend(this, {
			info: function(method) {
				if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" && xrtc.Logger.level.info)) {
					if (typeof method === "string") {
						console.info('Info:\t\t', className + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
					} else {
						console.info('Info:\t\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
					}
				}
			},

			debug: function(method) {
				if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" && xrtc.Logger.level.debug)) {
					if (typeof method === "string") {
						console.debug('Debug:\t\t', className + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
					} else {
						console.debug('Debug:\t\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
					}
				}
			},

			test: function(method) {
				if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" && xrtc.Logger.level.test)) {
					if (typeof method === "string") {
						console.debug('Test:\t\t', className + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
					} else {
						console.debug('Test:\t\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
					}
				}
			},

			warning: function(method) {
				if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" && xrtc.Logger.level.warning)) {
					if (typeof method === "string") {
						console.warn('Warning:\t', className + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
					} else {
						console.warn('Warning:\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
					}

				}
			},

			error: function(method) {
				if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" && xrtc.Logger.level.error)) {
					if (typeof method === "string") {
						console.error('Error:\t\t', className + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
					} else {
						console.error('Error:\t\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
					}
				}
			}
		});

		function convertArgumentsToArray() {
			var args = [], arg,
				index = 0,
				len = arguments.length;

			for (; index < len; index++) {
				arg = arguments[index];

				if ((typeof arg === 'object') && (arg instanceof Object) && (typeof arg.length !== 'undefined')) {
					var subArgs = convertArgumentsToArray.apply(null, Array.prototype.slice.call(arg)),
						subIndex = 0,
						subLen = subArgs.length;

					for (; subIndex < subLen; subIndex++) {
						args.push(subArgs[subIndex]);
					}
				} else {
					args.push(arg);
				}
			}

			return args;
		}
	});

	// **[Public API]:** This functionality can be used for ebabling/disabling (by default logging is disabled) logging for the xRtc library.

	// **Simple examples**

	// * `xRtc.Logger.enable({ debug: true, warning: true, error: true, test: true });`
	// * `xRtc.Logger.disable();`
	xrtc.Logger.extend({
		level: false,

		enable: function (level) {
			this.level = typeof level === "undefined" ? true : level;
		},

		disable: function () {
			this.level = false;
		}
	});
})(window);