'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.EventDispatcher = {
		on: function (eventName, callback) {
			/// <summary>Subscribes on event</summary>
			/// <param name="eventName" type="string">The name of event</param>
			/// <param name="callback" type="function">Callback function</param>
			
			if (this._logger) {
				this._logger.info('on', arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			this._events[eventName].push(callback);

			return this;
		},
		
		off: function (eventName) {
			/// <summary>Unsubscribes from event</summary>
			/// <param name="eventName" type="string">The name of event</param>

			if (this._logger) {
				this._logger.info('off', arguments);
			}

			this._events = this._events || {};
			this._events[eventName] = this._events[eventName] || [];
			delete this._events[eventName];

			return this;
		},

		trigger: function (eventName) {
			/// <summary>Triggers event</summary>
			/// <param name="eventName" type="string">The name of event</param>
			/// <param name="arguments" type="array">Parameters of event. Can be absent</param>
			
			if (this._logger) {
				this._logger.info('trigger', arguments);
			}

			this._events = this._events || {};
			var events = this._events[eventName];
			if (!events) {
				this._logger.warning('trigger', 'Trying to call event which is not listening.');
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