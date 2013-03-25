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
				var url = xrtc.AuthManager.settings.URL + 'getToken',
					data = 'data=' + JSON.stringify(getTokenRequestParams.call(this, userData));

				this.ajax(url, 'POST', data, proxy(handleTokenRequest, userData, callback));
			},

			getIceServers: function (token, callback) {
				var iceServers = iceServersCache[token];
				if (iceServers) {
					logger.info('getIceServers', iceServers);

					if (typeof (callback) === 'function') {
						callback(iceServers);
					}
				} else {
					iceServers = xrtc.AuthManager.settings.iceServers;
					if (iceServers && iceServers.iceServers && iceServers.iceServers.length > 0) {
						iceServersCache[token] = iceServers;

						this.getIceServers(token, callback);
					} else {
						var url = xrtc.AuthManager.settings.URL + 'getIceServers',
							data = 'token=' + token;

						this.ajax(url, 'POST', data, proxy(handleIceServersRequest, token, callback));
					}
				}
			}
		});

		function getTokenRequestParams(userData) {
			var tokenParams = xrtc.AuthManager.settings.tokenParams,
				result = {
					Type: tokenParams.type,
					Authentication: tokenParams.authentication,
					Authorization: tokenParams.authorization,
					Domain: userData.domain,
					Application: userData.application,
					Room: userData.room,
					Ident: userData.name
				};

			logger.info('getTokenRequestParams', result);

			return result;
		}

		function handleTokenRequest(response, userData, callback) {
			try {
				response = JSON.parse(response);
				logger.debug('getToken', response);

				if (!!response && !!response.E && response.E != '') {
					var error = new xrtc.CommonError('getToken', response.E);
					logger.error('getToken', error);
					this.trigger(xrtc.AuthManager.events.serverError, error);
				} else {
					var token = response.D.token;
					logger.info('getToken', token);

					if (typeof (callback) === 'function') {
						callback(token);
					}
				}
			} catch (ex) {
				logger.error('getIceServers', ex);
				this.getToken(userData, callback);
			}
		}

		function handleIceServersRequest(response, token, callback) {
			try {
				response = JSON.parse(response);
				logger.debug('getIceServers', response);

				if (!!response && !!response.E && response.E != '') {
					var error = new xrtc.CommonError('getIceServers', response.E);
					logger.error('getIceServers', error);
					this.trigger(xrtc.AuthManager.events.serverError, error);
				} else {
					var iceServers = JSON.parse(response.D);

					// todo: remove it in next version of Firefox
					convertIceServerDNStoIP(iceServers.iceServers);
					// todo: remove it in next version of Firefox

					//save servers in cache with token key
					iceServersCache[token] = iceServers;
				}
			} catch (ex) {
				logger.error('getIceServers', ex);
			}

			//call this method again to get it from cache or if error occures
			this.getIceServers(token, callback);
		}

		// todo: remove it in next version of Firefox
		function convertIceServerDNStoIP(iceServers) {
			var addresses = {
				'stun.influxis.com': '50.97.63.12',
				'turn.influxis.com': '50.97.63.12'
			};

			for (var i = 0; i < iceServers.length; i++) {
				var server = iceServers[i];

				for (var dns in addresses) {
					server.url = server.url.replace(dns, addresses[dns]);
				}
			}
		}
		// todo: remove it in next version of Firefox
	});

	xrtc.AuthManager.extend({
		events: {
			serverError: 'servererror'
		},

		settings: {
			URL: 'http://turn.influxis.com/',

			tokenParams: {
				type: 'token_request',
				authentication: 'public',
				authorization: null
			}
		}
	});
})(window);