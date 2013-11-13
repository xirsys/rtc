// #### Version 1.4.0 ####

// It is special class which used by xRtc for event dispatching.

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.eventDispatcher');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;

	xrtc.EventDispatcher = {
		// **[Public API]:** Subscribes on event where `eventName` is the name of event and `callback` is callback function.
		on: function (eventName, callback) {
			if (this._logger) {
				this._logger.info('on', arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			this._events[eventName].push(callback);

			return this;
		},

		// **[Public API]:** Unsubscribes from event where `eventName` is the name of event.
		off: function (eventName) {
			if (this._logger) {
				this._logger.info('off', arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			delete this._events[eventName];

			return this;
		},

		// **[Public API]:** Triggers event where `eventName` is the name of event and `arguments` is parameters of event (Can be absent).
		trigger: function (eventName) {
			if (this._logger) {
				this._logger.info('trigger', arguments);
			}

			this._events = this._events || {};
			var events = this._events[eventName];
			if (!events) {
				this._logger.warning('trigger', "Trying to call event which is not listening. Event name is '" + eventName + "'");
				return this;
			}

			var args = Array.prototype.slice.call(arguments, 1);
			for (var i = 0, len = events.length; i < len; i++) {
				events[i].apply(null, args);
			}

			return this;
		}
	};
})(window);