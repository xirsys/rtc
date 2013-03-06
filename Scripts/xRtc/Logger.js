﻿'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.Logger = xrtc.Class('Logger');
	
	xrtc.Logger.extend({
		level: false,

		enable: function (level) {
			this.level = typeof level === "undefined" ? true : level;
		},

		disable: function () {
			this.level = false;
		}
	});

	xrtc.Logger.include({
		init: function(className) {
			this.baseClassName = className;
		},

		info: function (method) {
			if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" && xrtc.Logger.level.info)) {
				if (typeof method === "string") {
					console.info('Info:\t\t', this.baseClassName + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
				} else {
					console.info('Info:\t\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
				}
			}
		},

		debug: function (method) {
			if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" &&  xrtc.Logger.level.debug)) {
				if (typeof method === "string") {
					console.debug('Debug:\t\t', this.baseClassName + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
				} else {
					console.debug('Debug:\t\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
				}
			}
		},

		warning: function (method) {
			if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" &&  xrtc.Logger.level.warning)) {
				if (typeof method === "string") {
					console.warn('Warning:\t', this.baseClassName + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
				} else {
					console.warn('Warning:\t', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
				}
			}
		},

		error: function (method) {
			if (xrtc.Logger.level === true || (typeof xrtc.Logger.level === "object" && xrtc.Logger.level.error)) {
				if (typeof method === "string") {
					console.error('Error:\t\t', this.baseClassName + '.' + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
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
})(window);