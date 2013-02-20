(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;
	xrtc.EventDispatcher = new xrtc.Class();

	xrtc.EventDispatcher.include({
		init: function () {
			this._logger = new xrtc.Logger();
			this._events = {};
		},

		on: function (eventName, callback) {
			this._logger.info("EventDispatcher.on", eventName);

			this._events[eventName] = this._events[eventName] || [];
			this._events[eventName].push(callback);
		},

		off: function (eventName) {
			this._logger.info("EventDispatcher.off", eventName);

			this._events[eventName] = this._events[eventName] || [];
			delete this._events[eventName];
		},

		trigger: function (eventName) {
			this._logger.info("EventDispatcher.trigger", eventName);

			var events = this._events[eventName];
			if (!events) {
				this.logger.warning("EventDispatcher.trigger", 'trying to call event which is not listening');
				return;
			}

			var args = Array.prototype.slice.call(arguments, 1);
			for (var i = 0, len = events.length; i < len; i++) {
				events[i].apply(null, args);
			}
		}
	});
})(window);