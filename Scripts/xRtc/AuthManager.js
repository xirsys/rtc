// #### Version 1.3.0 ####

// XirSys (default) realization of authentication manager.

// **Responsibility of this manager:**

// * get token
// * get ice servers data

'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Class(xrtc, 'AuthManager', function AuthManager() {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			iceServersCache = {};

		xrtc.Class.extend(this, xrtc.Ajax, xrtc.EventDispatcher, {
			_logger: logger,

			getToken: function (userData, callback) {
				var url = xrtc.AuthManager.settings.tokenHandler,
					data = getTokenRequestParams.call(this, userData).join("&");
				this.ajax(url, 'POST', data, proxy(handleTokenRequest, userData, callback));
			},

			// `callback` function receive array of ice servers as parameter. Each ice server has following format: `{ url, credential, username }` in case of TURN and `{ url }` in case of STUN.
			getIceServers: function (token, userData, callback) {
				var iceServers = iceServersCache[token];
				if (iceServers) {
					logger.info('getIceServers', iceServers, typeof(callback));

					if (typeof (callback) === 'function') {
						callback(iceServers);
					}
				} else {
					iceServers = xrtc.AuthManager.settings.iceServers;
					if (iceServers && iceServers.iceServers && iceServers.iceServers.length > 0) {
						iceServersCache[token] = iceServers;

						this.getIceServers(token, callback);
					} else {
						var url = xrtc.AuthManager.settings.iceHandler,
							data = getIceRequestParams.call(this, userData).join("&");
						this.ajax(url, 'POST', data, proxy(handleIceServersRequest, token, userData, callback));
					}
				}
			}
		});

		function getTokenRequestParams(userData) {
			var tokenParams = xrtc.AuthManager.settings.tokenParams,
				result = [
					"domain=" + userData.domain,
					"application=" + userData.application,
					"room=" + userData.room,
					"username=" + userData.name,
					"password=" + userData.password
				];

			logger.info('getTokenRequestParams', result);

			return result;
		}

		function getIceRequestParams(userData) {
			var result = [
					"domain=" + userData.domain,
					"application=" + userData.application,
					"username=" + userData.name,
					"password=" + userData.password
				];

			logger.info('getIceRequestParams', result);

			return result;
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
				} catch(ex) {
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

						if (typeof(callback) === 'function') {
							callback(token);
						}
					}
				}
			} catch (ex) {
				var repeatTimeout = 5000;
				logger.error('getToken. The request will be repeated after ' + repeatTimeout/1000 + " sec.", ex);
				// Call this method again if error occures.
				setTimeout(function () { self.getToken(userData, callback); }, repeatTimeout);
			}
		}

		function handleIceServersRequest(response, token, userData, callback) {
			logger.info("handleIceServersRequest callback is ", callback);
			try {
				response = JSON.parse(response);
				logger.debug('getIceServers', response);

				if (!!response && !!response.e && response.e != '') {
					var error = new xrtc.CommonError('getIceServers', response.e);
					logger.error('getIceServers', error);
					this.trigger(xrtc.AuthManager.events.serverError, error);
				} else {
					var iceServers = response.d.iceServers
						? response.d.iceServers.map(function(iceServer) {
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

					// Save servers in cache with token key.
					iceServersCache[token] = iceServers;
				}
			} catch (ex) {
				logger.error('getIceServers', ex);
			}

			// Call this method again to get it from cache or if error occures.
			this.getIceServers(token, userData, callback);
		}
	});

	xrtc.AuthManager.extend({
		// **Note:** Full list of events for the `xRtc.AuthManager` object.
		events: {
			serverError: 'servererror'
		},

		settings: {
			tokenHandler: 'https://beta.xirsys.com/getToken',
			iceHandler: 'https://beta.xirsys.com/getIceServers',

			tokenParams: {
				type: 'token_request',
				authentication: 'public',
				authorization: null
			}
		}
	});
})(window);