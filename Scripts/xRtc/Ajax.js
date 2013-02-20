(function (exports) {
	"use strict";
	var xrtc = exports.xRtc;

	xrtc.Ajax = xrtc.Class();

	xrtc.Ajax.include({
		init: function () {
			this._logger = new xrtc.Logger();

			var xmlhttp;
			try {
				xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) {
					try {
						xmlhttp = new XMLHttpRequest();
					} catch (e) {
						xmlhttp = false;
						this._logger.debug('XMLHttpRequest is not supported');
					}
				}
			}

			this._xmlhttp = xmlhttp;
		},

		request: function(url, httpMethod, params, callback) {
			if (!this._xmlhttp) {
				return;
			}

			var xmlhttp = this._xmlhttp;

			var fin = false;
			httpMethod = httpMethod.toUpperCase();

			try {
				if (httpMethod === xrtc.Ajax.methods.GET) {
					xmlhttp.open(httpMethod, url + "?" + params, true);
					params = "";
				} else {
					xmlhttp.open(httpMethod, url, true);
					xmlhttp.setRequestHeader("method", "POST " + url + " HTTP/1.1");
					xmlhttp.setRequestHeader("content-type", "application/x-www-form-urlencoded");
				}

				xmlhttp.onreadystatechange = function () {
					if (xmlhttp.readyState == 4 && !fin) {
						fin = true;
						if (typeof (callback) == "function") {
							callback(xmlhttp);
						}
					}
				};

				xmlhttp.send(params);
			} catch (ex) {
				this._logger.debug(ex);
			}
		}
	});

	xrtc.Ajax.extend({
		methods: {
			GET: 'GET',
			POST: 'POST'
		}
	});
})(window);