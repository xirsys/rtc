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
					"username=" + userData.name
				];

			logger.info('getTokenRequestParams', result);

			return result;
		}

		function getIceRequestParams(userData) {
			var result = [
					"domain=" + userData.domain,
					"application=" + userData.application,
					"username=" + userData.name
				];

			logger.info('getIceRequestParams', result);

			return result;
		}

		function handleTokenRequest(response, userData, callback) {
			try {
				logger.debug('getToken', response);
				response = JSON.parse(response);
				logger.debug('getToken', response);

				if (!!response && !!response.e && response.e != '') {
					var error = new xrtc.CommonError('getToken', response.e);
					logger.error('getToken', error);
					this.trigger(xrtc.AuthManager.events.serverError, error);
				} else {
					var token = response.d.token;
					logger.info('getToken', token);

					if (typeof (callback) === 'function') {
						callback(token);
					}
				}
			} catch (ex) {
				logger.error('getToken', ex);
				//call this method again if error occures
				this.getToken(userData, callback);
			}
		}

		function handleIceServersRequest(response, token, userData, callback) {
			logger.info("handleIceServersRequest CALLBACK IS ", callback);
			try {
				response = JSON.parse(response);
				logger.debug('getIceServers', response);

				if (!!response && !!response.e && response.e != '') {
					var error = new xrtc.CommonError('getIceServers', response.e);
					logger.error('getIceServers', error);
					this.trigger(xrtc.AuthManager.events.serverError, error);
				} else {
					var iceServers = response.d;

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
			this.getIceServers(token, userData, callback);
		}

		// todo: remove it in next version of Firefox
		function convertIceServerDNStoIP(iceServers) {
			var addresses = {
				'localhost': '127.0.0.1',
				'beta.xirsys.com': '75.126.93.106'
				/*'stun.influxis.com': '50.97.63.12',
				'turn.influxis.com': '50.97.63.12'*/
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
			//URL: 'http://localhost:8081/',
			URL: 'http://beta.xirsys.com:8889/',
			tokenHandler: 'http://beta.xirsys.com:8889/getToken',
			iceHandler: 'http://beta.xirsys.com:8889/getIceServers',

			tokenParams: {
				type: 'token_request',
				authentication: 'public',
				authorization: null
			}
		}
	});
})(window);

function getParameterByName(name) {
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.search);
	if(results == null)
		return "";
	else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
}