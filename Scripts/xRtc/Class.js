'use strict';

(function (exports) {
	exports.xRtc = {};

	exports.xRtc.Class = function (namespace, className, constructor) {
		/// <summary>The base type of all classes</summary>

		namespace[className] = constructor;

		var klass = namespace[className];

		klass.fn = klass.prototype;
		klass.fn.className = className;

		klass.extend = function (obj) {
			/// <summary>Extends the instance of concrete object</summary>

			var extended = obj.extended;

			exports.xRtc.Class.extend(klass, obj);

			if (extended) {
				extended(klass);
			}
		};
	};

	exports.xRtc.Class.extend = function (destinationObj) {
		/// <summary>Extends "destinationObj" by another objects</summary>
		/// <param name="destinationObj" type="object">Object to expand</param>
		
		var sourceObjects = Array.prototype.slice.call(arguments, 1);

		for (var index = 0, len = sourceObjects.length; index < len; index++) {
			var sourceObj = sourceObjects[index];

			for (var propName in sourceObj) {
				destinationObj[propName] = sourceObj[propName];
			}
		}
	};

	exports.xRtc.Class.property = function (obj, propertyName, getter, setter) {
		/// <summary>Adds to "obj" getter or/and setter</summary>
		/// <param name="obj" type="object">Object to add property</param>
		/// <param name="propertyName" type="string">Property name</param>
		/// <param name="getter" type="function">Getter to define, can be null</param>
		/// <param name="setter" type="function">Setter to define, can be null</param>

		if(typeof getter === "function"){
			obj.__defineGetter__(propertyName, getter);
		}

		if (typeof setter === "function") {
			obj.__defineSetter__(propertyName, setter);
		}
	};

	exports.xRtc.Class.proxy = function (context) {
		/// <summary>Creates new function, which will wrap another and will replace it's "context"</summary>
		
		return function (func) {
			var baseArgs = [];
			if (arguments.length > 1) {
				baseArgs = Array.prototype.slice.call(arguments, 1);
			}
			
			return function () {
				var args = Array.prototype.slice.call(arguments);
				
				for (var i = 0; i < baseArgs.length; i++) {
					args.push(baseArgs[i]);
				}
				
				func.apply(context, args);
			};
		};
	};
})(window);