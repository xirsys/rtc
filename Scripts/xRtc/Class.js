// #### Version 1.4.0 ####

// The base type of all classes for xRtc library.

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.baseClass');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	exports.xRtc.Class = function (namespace, className, constructor) {
		namespace[className] = constructor;

		var klass = namespace[className];

		klass.fn = klass.prototype;
		klass.fn.className = className;

		// **[Public API]:** Extends the instance of concrete object.
		klass.extend = function (obj) {
			var extended = obj.extended;

			exports.xRtc.Class.extend(klass, obj);

			if (extended) {
				extended(klass);
			}
		};
	};

	// **[Public API]:** Extends "destinationObj" by another objects.
	exports.xRtc.Class.extend = function (destinationObj) {
		var sourceObjects = Array.prototype.slice.call(arguments, 1);

		for (var index = 0, len = sourceObjects.length; index < len; index++) {
			var sourceObj = sourceObjects[index];

			for (var propName in sourceObj) {
				destinationObj[propName] = sourceObj[propName];
			}
		}
	};

	// **[Public API]:** Adds to `obj` getter or/and setter. Where `obj` is object to add property,
	// `propertyName` is property name, `getter` is getter to define, can be `null`, `setter` is setter to define, can be `null`.
	exports.xRtc.Class.property = function (obj, propertyName, getter, setter) {
		if(typeof getter === "function"){
			obj.__defineGetter__(propertyName, getter);
		}

		if (typeof setter === "function") {
			obj.__defineSetter__(propertyName, setter);
		}
	};

	// **[Public API]:** Creates new function, which will wrap another and will replace it's `context`.
	exports.xRtc.Class.proxy = function (context) {
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