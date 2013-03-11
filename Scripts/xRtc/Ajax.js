'use strict';

(function (exports) {
	var xrtc = exports.xRtc,
		methods = {
			GET: 'GET',
			POST: 'POST'
		};

	xrtc.Ajax = {
		ajax: function(url, httpMethod, params, callback) {
			var xmlhttp, error;
			
			try {
				xmlhttp = new ActiveXObject('Msxml2.XMLHTTP');
			} catch(e) {
				try {
					xmlhttp = new ActiveXObject('Microsoft.XMLHTTP');
				} catch(e) {
					try {
						xmlhttp = new XMLHttpRequest();
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

				xmlhttp.onreadystatechange = function() {
					if (xmlhttp.readyState == 4 && !fin) {
						fin = true;

						if (this._logger) {
							this._logger.debug('ajax', xmlhttp);
						}

						if (typeof(callback) === 'function') {
							callback(xmlhttp.responseText);
						}
					}
				};

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