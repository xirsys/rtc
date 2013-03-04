'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.EventDispatcher = {
		/// <summary>Subscribes on event</summary>
		/// <param name="eventName" type="string">The name of event</param>
		/// <param name="callback" type="function">Callback function</param>
		on: function (eventName, callback) {
			if (this._logger) {
				this._logger.info(this.className + '.on', arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			this._events[eventName].push(callback);

			return this;
		},

		/// <summary>Unsubscribes from event</summary>
		/// <param name="eventName" type="string">The name of event</param>
		off: function (eventName) {
			if (this._logger) {
				this._logger.info(this.className + '.off', arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			delete this._events[eventName];

			return this;
		},

		/// <summary>Triggers event</summary>
		/// <param name="eventName" type="string">The name of event</param>
		/// <param name="arguments" type="array">Parameters of event. Can be absent</param>
		trigger: function (eventName) {
			if (this._logger) {
				this._logger.info(this.className + '.trigger', arguments);
			}

			this._events = this._events || {};
			var events = this._events[eventName];
			if (!events) {
				this._logger.warning(this.className + '.trigger', 'Trying to call event which is not listening.');
				return;
			}

			var args = Array.prototype.slice.call(arguments, 1);
			for (var i = 0, len = events.length; i < len; i++) {
				events[i].apply(null, args);
			}

			return this;
		}
	};
})(window);