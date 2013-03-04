'use strict';

(function (exports) {
	exports.xRtc = {};

	/// <summary>The base type of all classes</summary>
	exports.xRtc.Class = function (name) {
		var klass = function () {
			this.init.apply(this, arguments);
		};
		
		klass.fn = klass.prototype;
		klass.fn.init = function () { };
		klass.fn.className = name;

		/// <summary>Extends the instance of concrete object</summary>
		klass.extend = function (obj) {
			var extended = obj.extended;

			for (var i in obj) {
				klass[i] = obj[i];
			}

			if (extended) {
				extended(klass);
			}
		};

		/// <summary>Extends the prototype of concrete object</summary>
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