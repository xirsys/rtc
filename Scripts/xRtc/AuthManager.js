// #### Version 1.4.1 ####

// XirSys (default) realization of authentication manager.

// **Responsibility of this manager:**

// * get token
// * get ice servers data

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
goog.provide('xRtc.authManager');

goog.require('xRtc.baseClass');
goog.require('xRtc.eventDispatcher');
goog.require('xRtc.commonError');
goog.require('xRtc.ajax');
goog.require('xRtc.logger');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'AuthManager', function AuthManager() {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className);

		xrtc.Class.extend(this, xrtc.Ajax, xrtc.EventDispatcher, {
			_logger: logger,

			getToken: function (userData, callback) {
				var url = xrtc.AuthManager.settings.tokenHandler,
					data = getRequestParams.call(this, userData).join("&");
				this.ajax(url, 'POST', data, proxy(handleTokenRequest, userData, callback));
			},

			// `callback` function receive array of ice servers as parameter. Each ice server has following format: `{ url, credential, username }` in case of TURN and `{ url }` in case of STUN.
			getIceServers: function (userData, callback) {
				var url = xrtc.AuthManager.settings.iceHandler,
					data = getRequestParams.call(this, userData).join("&");
				this.ajax(url, 'POST', data, proxy(handleIceServersRequest, userData, callback));
			}
		});

		function getRequestParams(userData) {
			return [
				"domain=" + userData.domain,
				"application=" + userData.application,
				"room=" + userData.room,
				"username=" + userData.name,
				"password=" + userData.password
			];
		}

		function handleTokenRequest(response, userData, callback) {
			var self = this;
			try {
				logger.debug('getToken', response);

				if (response === "") {
					logger.error('getToken', 'Server returned an empty response.');
					self.trigger(xrtc.AuthManager.events.serverError, 'Server returned an empty response.');
				}

				try {
					response = JSON.parse(response);
					logger.debug('getToken', response);
				} catch (ex) {
					logger.error('getToken', response);
					throw ex;
				}

				if (!!response && !!response.e && response.e != '') {
					var error = new xrtc.CommonError('getToken', response.e);
					logger.error('getToken', error);
					self.trigger(xrtc.AuthManager.events.serverError, error);
				} else {
					var token = response.d.token;

					// **Todo:** Need to discuss it with the team.
					if (!token) {
						logger.error('getToken', response.d);
						self.trigger(xrtc.AuthManager.events.serverError, response.d);
					}
					else {
						logger.info('getToken', token);

						if (typeof (callback) === 'function') {
							callback(token);
						}
					}
				}
			} catch (ex) {
				logger.error('getToken. The request will be repeated after ' + xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout / 1000 + " sec.", ex);
				// Call this method again if error occures.
				setTimeout(function () { self.getToken(userData, callback); }, xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout);
			}
		}

		function handleIceServersRequest(response, userData, callback) {
			var self = this;
			try {
				response = JSON.parse(response);
				logger.debug('getIceServers', response);

				if (!!response && !!response.e && response.e != '') {
					var error = new xrtc.CommonError('getIceServers', response.e);
					logger.error('getIceServers', error);
					self.trigger(xrtc.AuthManager.events.serverError, error);
				} else {
					var iceServers = response.d.iceServers
						? response.d.iceServers.map(function (iceServer) {
							var resultIceServer = {};
							if (iceServer.url) {
								resultIceServer.url = iceServer.url;
							}
							if (iceServer.credential) {
								resultIceServer.credential = iceServer.credential;
							}
							if (iceServer.username) {
								resultIceServer.username = iceServer.username;
							}

							return resultIceServer;
						})
						: [];

					logger.info('getIceServers', iceServers);

					if (typeof (callback) === 'function') {
						callback(iceServers);
					}
				}
			} catch (ex) {
				logger.error('getIceServers. The request will be repeated after ' + xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout / 1000 + " sec.", ex);
				// Call this method again if error occures.
				setTimeout(function () { self.getIceServers(userData, callback); }, xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout);
			}
		}
	});

	xrtc.AuthManager.extend({
		// **Note:** Full list of events for the `xRtc.AuthManager` object.
		events: {
			serverError: 'servererror'
		},

		settings: {
			unsuccessfulRequestRepeatTimeout: 5000,
			tokenHandler: 'https://api.xirsys.com/getToken',
			iceHandler: 'https://api.xirsys.com/getIceServers'
		}
	});
})(window);