(function (exports) {
	"use strict";
	exports.xRtc = {};

	exports.xRtc.Class = function (name) {
		var klass = function () {
			this.init.apply(this, arguments);
		};

		klass.fn = klass.prototype;
		klass.fn.init = function () { };
		klass.fn.className = name;

		klass.extend = function (obj) {
			var extended = obj.extended;

			for (var i in obj) {
				klass[i] = obj[i];
			}

			if (extended) {
				extended(klass);
			}
		};

		klass.include = function (obj) {
			var included = obj.included;

			for (var i in obj) {
				klass.fn[i] = obj[i];
			}

			if (included) {
				included(klass);
			}
		};

		return klass;
	};
})(window);