"use strict";

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.EventDispatcher = {
		on: function (eventName, callback) {
			if (this._logger) {
				this._logger.info(this.className + ".on", arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			this._events[eventName].push(callback);
		},

		off: function (eventName) {
			if (this._logger) {
				this._logger.info(this.className + ".off", arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			delete this._events[eventName];
		},

		trigger: function (eventName) {
			if (this._logger) {
				this._logger.info(this.className + ".trigger", arguments);
			}

			this._events = this._events || {};
			var events = this._events[eventName];
			if (!events) {
				this._logger.warning(this.className + ".trigger", 'Trying to call event which is not listening.');
				return;
			}

			var args = Array.prototype.slice.call(arguments, 1);
			for (var i = 0, len = events.length; i < len; i++) {
				events[i].apply(null, args);
			}
		}
	};
})(window);