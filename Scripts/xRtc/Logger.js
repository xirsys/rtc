'use strict';

(function (exports) {
	var xrtc = exports.xRtc;
	xrtc.Logger = new xrtc.Class('Logger');

	xrtc.Logger.include({
		info: function () {
			log('Info', arguments);
		},

		debug: function () {
			log('Debug', arguments);
		},

		warning: function () {
			log('Warning', arguments);
		},

		error: function () {
			log('Error', arguments);
		}
	});

	function log(type) {
		console.log(type + ': ', convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));

		logHtml.apply(null, Array.prototype.slice.call(arguments));
	}

	function logHtml(type) {
		var $console = $('#console'),
			args = convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)),
			cssClass = type.toLowerCase();

		if (cssClass !== 'debug') {
			return;
		}
		
		var message = $('<div />')
			.addClass('item ' + cssClass)
			.append($('<b />').text(type + ': '));

		for (var index = 0, len = args.length; index < len; index++) {
			var arg = args[index], text = arg.toString();
			if (typeof arg === "object") {
				text = JSON.stringify(arg);
			}

			message.append($('<span />').text(text || ''));
			
			if (index !== (len - 1)) {
				message.append(', ');
			}
		}

		$console.append(message).scrollTop(message.position().top + message.outerHeight(true));
	}

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