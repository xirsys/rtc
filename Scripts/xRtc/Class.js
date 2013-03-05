'use strict';

(function (exports) {
	exports.xRtc = {};

	exports.xRtc.Class = function (name) {
		/// <summary>The base type of all classes</summary>
		
		var klass = function () {
			this.init.apply(this, arguments);
		};
		
		klass.fn = klass.prototype;
		klass.fn.init = function () { };
		klass.fn.className = name;

		klass.extend = function (obj) {
			/// <summary>Extends the instance of concrete object</summary>
			
			var extended = obj.extended;

			exports.xRtc.Class.extend(klass, obj);

			if (extended) {
				extended(klass);
			}
		};

		klass.include = function (obj) {
			/// <summary>Extends the prototype of concrete object</summary>
			
			var included = obj.included;

			exports.xRtc.Class.extend(klass.fn, obj);

			if (included) {
				included(klass);
			}
		};

		return klass;
	};

	exports.xRtc.Class.extend = function (destinationObj) {
		var sourceObjects = Array.prototype.slice.call(arguments, 1);

		for (var index = 0, len = sourceObjects.length; index < len; index++) {
			var sourceObj = sourceObjects[index];
			
			for (var propName in sourceObj) {
				destinationObj[propName] = sourceObj[propName];
			}
		}
	};
})(window);