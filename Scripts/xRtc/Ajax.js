// #### Version 1.4.0 ####

// xRtc library uses this functionality for  performing Ajax requets to the server.

// `goog.provide`, `goog.require` defined in **Google Closure Library**. It is used by **Google Closure Compiler** for the determination of the file order.
// During minification this calls will be removed automatically.
goog.provide('xRtc.ajax');

(function (exports) {
	'use strict';

	if (typeof exports.xRtc === 'undefined') {
		exports.xRtc = {};
	}

	var xrtc = exports.xRtc,
		methods = {
			GET: 'GET',
			POST: 'POST'
		};

	xrtc.Ajax = {
		ajax: function(url, httpMethod, params, callback) {
			var xmlhttp, error;
			var proxy = xrtc.Class.proxy(this);
			
			try {
				xmlhttp = new XMLHttpRequest();
			} catch(e) {
				try {
					xmlhttp = new ActiveXObject('Msxml2.XMLHTTP');
				} catch(e) {
					try {
						xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
					} catch(e) {
						if (this._logger) {
							error = new xrtc.CommonError('ajax', 'XMLHttpRequest is not supported');
							this._logger.error('ajax', error);
						}
						return;
					}
				}
			}
			
			if (this._logger) {
				this._logger.debug('ajax', url, params);
			}

			httpMethod = httpMethod.toUpperCase();

			try {
				var fin = false;
				if (httpMethod === methods.GET) {
					xmlhttp.open(httpMethod, url + '?' + params, true);
					params = '';
				} else {
					xmlhttp.open(httpMethod, url, true);
					xmlhttp.setRequestHeader('method', httpMethod + ' ' + url + ' HTTP/1.1');
					xmlhttp.setRequestHeader('content-type', 'application/x-www-form-urlencoded');
				}

				xmlhttp.onreadystatechange = proxy(function() {
					if (xmlhttp.readyState == 4 && !fin) {
						fin = true;

						if (this._logger) {
							this._logger.debug('ajax', xmlhttp);
						}

						if (typeof(callback) === 'function') {
							callback(xmlhttp.responseText);
						}
					}
				});

				xmlhttp.send(params);
			} catch (ex) {
				error = new xrtc.CommonError('ajax', 'XMLHttpRequest exception', ex);
				error.data = {
					url: url,
					method: httpMethod,
					params: params
				};
				
				if (this._logger) {
					this._logger.error('ajax', error);
				}
				throw error;
			}
		}
	};
})(window);