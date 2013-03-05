'use strict';

(function (exports) {
	var xrtc = exports.xRtc;

	xrtc.Ajax = {
		ajax: function(url, httpMethod, params, callback) {
			var xmlhttp;
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
							this._logger.error('XMLHttpRequest is not supported');
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
				if (httpMethod === xrtc.Ajax.ajax.methods.GET) {
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
			} catch(ex) {
				if (this._logger) {
					this._logger.error('ajax', ex);
				}
				throw ex;
			}
		}
	};

	xrtc.Ajax.ajax.methods = {
		GET: 'GET',
		POST: 'POST'
	};
})(window);