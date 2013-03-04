'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.Logger = new xrtc.Class('Logger');

	xrtc.Logger.include({
		info: function () {
			console.info('Info: ', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
		},

		debug: function () {
			console.debug('Debug: ', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
		},

		warning: function () {
			console.warn('Warning: ', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
		},

		error: function () {
			console.error('Error: ', convertArgumentsToArray(Array.prototype.slice.call(arguments)));
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