if (typeof goog === "undefined") {
  goog = {};
}
if (!goog.provide) {
  goog.provide = function() {
  };
}
if (!goog.require) {
  goog.require = function() {
  };
}
goog.provide("closureStub");
goog.provide("xRtc.ajax");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc, methods = {GET:"GET", POST:"POST"};
  xrtc.Ajax = {ajax:function(url, httpMethod, params, callback) {
    var xmlhttp, error;
    var proxy = xrtc.Class.proxy(this);
    try {
      xmlhttp = new XMLHttpRequest;
    } catch (e) {
      try {
        xmlhttp = new ActiveXObject("Msxml2.XMLHTTP");
      } catch (e) {
        try {
          xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
        } catch (e) {
          if (this._logger) {
            error = new xrtc.CommonError("ajax", "XMLHttpRequest is not supported");
            this._logger.error("ajax", error);
          }
          return;
        }
      }
    }
    if (this._logger) {
      this._logger.debug("ajax", url, params);
    }
    httpMethod = httpMethod.toUpperCase();
    try {
      var fin = false;
      if (httpMethod === methods.GET) {
        xmlhttp.open(httpMethod, url + "?" + params, true);
        params = "";
      } else {
        xmlhttp.open(httpMethod, url, true);
        xmlhttp.setRequestHeader("method", httpMethod + " " + url + " HTTP/1.1");
        xmlhttp.setRequestHeader("content-type", "application/x-www-form-urlencoded");
      }
      xmlhttp.onreadystatechange = proxy(function() {
        if (xmlhttp.readyState == 4 && !fin) {
          fin = true;
          if (this._logger) {
            this._logger.debug("ajax", xmlhttp);
          }
          if (typeof callback === "function") {
            callback(xmlhttp.responseText);
          }
        }
      });
      xmlhttp.send(params);
    } catch (ex) {
      error = new xrtc.CommonError("ajax", "XMLHttpRequest exception", ex);
      error.data = {url:url, method:httpMethod, params:params};
      if (this._logger) {
        this._logger.error("ajax", error);
      }
      throw error;
    }
  }};
})(window);
goog.provide("xRtc.baseClass");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  exports.xRtc.Class = function(namespace, className, constructor) {
    namespace[className] = constructor;
    var klass = namespace[className];
    klass.fn = klass.prototype;
    klass.fn.className = className;
    klass.extend = function(obj) {
      var extended = obj.extended;
      exports.xRtc.Class.extend(klass, obj);
      if (extended) {
        extended(klass);
      }
    };
  };
  exports.xRtc.Class.extend = function(destinationObj) {
    var sourceObjects = Array.prototype.slice.call(arguments, 1);
    for (var index = 0, len = sourceObjects.length;index < len;index++) {
      var sourceObj = sourceObjects[index];
      for (var propName in sourceObj) {
        destinationObj[propName] = sourceObj[propName];
      }
    }
  };
  exports.xRtc.Class.property = function(obj, propertyName, getter, setter) {
    if (typeof getter === "function") {
      obj.__defineGetter__(propertyName, getter);
    }
    if (typeof setter === "function") {
      obj.__defineSetter__(propertyName, setter);
    }
  };
  exports.xRtc.Class.proxy = function(context) {
    return function(func) {
      var baseArgs = [];
      if (arguments.length > 1) {
        baseArgs = Array.prototype.slice.call(arguments, 1);
      }
      return function() {
        var args = Array.prototype.slice.call(arguments);
        for (var i = 0;i < baseArgs.length;i++) {
          args.push(baseArgs[i]);
        }
        func.apply(context, args);
      };
    };
  };
})(window);
goog.provide("xRtc.common");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.webrtc = {getUserMedia:(navigator.webkitGetUserMedia || (navigator.mozGetUserMedia || (navigator.msGetUserMedia || navigator.getUserMedia))).bind(navigator), RTCPeerConnection:exports.mozRTCPeerConnection || (exports.webkitRTCPeerConnection || exports.RTCPeerConnection), RTCIceCandidate:exports.mozRTCIceCandidate || exports.RTCIceCandidate, RTCSessionDescription:exports.mozRTCSessionDescription || exports.RTCSessionDescription, URL:exports.webkitURL || (exports.msURL || (exports.oURL || exports.URL)), 
  MediaStream:exports.mozMediaStream || (exports.webkitMediaStream || exports.MediaStream), supportedBrowsers:{chrome:"chrome", firefox:"firefox"}};
  xrtc.webrtc.detectedBrowser = navigator.mozGetUserMedia ? xrtc.webrtc.supportedBrowsers.firefox : xrtc.webrtc.supportedBrowsers.chrome;
  xrtc.webrtc.detectedBrowserVersion = xrtc.webrtc.detectedBrowser === xrtc.webrtc.supportedBrowsers.firefox ? parseInt(exports.navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]) : parseInt(exports.navigator.userAgent.match(/Chrom(e|ium)\/([0-9]+)\./)[2]);
  xrtc.webrtc.supports = function() {
    if (typeof xrtc.webrtc.RTCPeerConnection === "undefined") {
      return{};
    }
    var media = false;
    var data = false;
    var sctp = false;
    var pc;
    try {
      pc = new xrtc.webrtc.RTCPeerConnection(null, {optional:[{RtpDataChannels:true}]});
      media = true;
      try {
        pc.createDataChannel("_XRTCTEST", {reliable:false});
        data = true;
        var reliablePC = new xrtc.webrtc.RTCPeerConnection(null, {});
        try {
          var reliableDC = reliablePC.createDataChannel("_XRTCRELIABLETEST", {reliable:true});
          sctp = reliableDC.reliable;
        } catch (e) {
        }
        reliablePC.close();
      } catch (ignore) {
      }
    } catch (ignore) {
    }
    if (pc) {
      pc.close();
    }
    return{media:media, data:data, sctp:sctp};
  }();
  xRtc.utils = {newGuid:function() {
    var guid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
    return guid;
  }};
})(window);
goog.provide("xRtc.commonError");
goog.require("xRtc.baseClass");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.Class(xrtc, "CommonError", function CommonError(method, message, error) {
    this.method = method;
    this.message = message;
    this.error = error;
  });
})(window);
goog.provide("xRtc.eventDispatcher");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.EventDispatcher = {on:function(eventName, callback) {
    if (this._logger) {
      this._logger.info("on", arguments);
    }
    this._events = this._events || {};
    this._events[eventName] = this._events[eventName] || [];
    this._events[eventName].push(callback);
    return this;
  }, off:function(eventName) {
    if (this._logger) {
      this._logger.info("off", arguments);
    }
    this._events = this._events || {};
    this._events[eventName] = this._events[eventName] || [];
    delete this._events[eventName];
    return this;
  }, trigger:function(eventName) {
    if (this._logger) {
      this._logger.info("trigger", arguments);
    }
    this._events = this._events || {};
    var events = this._events[eventName];
    if (!events) {
      this._logger.warning("trigger", "Trying to call event which is not listening. Event name is '" + eventName + "'");
      return this;
    }
    var args = Array.prototype.slice.call(arguments, 1);
    for (var i = 0, len = events.length;i < len;i++) {
      events[i].apply(null, args);
    }
    return this;
  }};
})(window);
goog.provide("xRtc.logger");
goog.require("xRtc.baseClass");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.Class(xrtc, "Logger", function Logger(className) {
    xrtc.Class.extend(this, {info:function(method) {
      if (xrtc.Logger.level === true || typeof xrtc.Logger.level === "object" && xrtc.Logger.level.info) {
        if (typeof method === "string") {
          console.info("Info:\t\t", className + "." + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
        } else {
          console.info("Info:\t\t", convertArgumentsToArray(Array.prototype.slice.call(arguments)));
        }
      }
    }, debug:function(method) {
      if (xrtc.Logger.level === true || typeof xrtc.Logger.level === "object" && xrtc.Logger.level.debug) {
        if (typeof method === "string") {
          console.debug("Debug:\t\t", className + "." + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
        } else {
          console.debug("Debug:\t\t", convertArgumentsToArray(Array.prototype.slice.call(arguments)));
        }
      }
    }, test:function(method) {
      if (xrtc.Logger.level === true || typeof xrtc.Logger.level === "object" && xrtc.Logger.level.test) {
        if (typeof method === "string") {
          console.debug("Test:\t\t", className + "." + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
        } else {
          console.debug("Test:\t\t", convertArgumentsToArray(Array.prototype.slice.call(arguments)));
        }
      }
    }, warning:function(method) {
      if (xrtc.Logger.level === true || typeof xrtc.Logger.level === "object" && xrtc.Logger.level.warning) {
        if (typeof method === "string") {
          console.warn("Warning:\t", className + "." + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
        } else {
          console.warn("Warning:\t", convertArgumentsToArray(Array.prototype.slice.call(arguments)));
        }
      }
    }, error:function(method) {
      if (xrtc.Logger.level === true || typeof xrtc.Logger.level === "object" && xrtc.Logger.level.error) {
        if (typeof method === "string") {
          console.error("Error:\t\t", className + "." + method, convertArgumentsToArray(Array.prototype.slice.call(arguments, 1)));
        } else {
          console.error("Error:\t\t", convertArgumentsToArray(Array.prototype.slice.call(arguments)));
        }
      }
    }});
    function convertArgumentsToArray() {
      var args = [], arg, index = 0, len = arguments.length;
      for (;index < len;index++) {
        arg = arguments[index];
        if (typeof arg === "object" && (arg instanceof Object && typeof arg.length !== "undefined")) {
          var subArgs = convertArgumentsToArray.apply(null, Array.prototype.slice.call(arg)), subIndex = 0, subLen = subArgs.length;
          for (;subIndex < subLen;subIndex++) {
            args.push(subArgs[subIndex]);
          }
        } else {
          args.push(arg);
        }
      }
      return args;
    }
  });
  xrtc.Logger.extend({level:false, enable:function(level) {
    this.level = typeof level === "undefined" ? true : level;
  }, disable:function() {
    this.level = false;
  }});
})(window);
goog.provide("xRtc.authManager");
goog.require("xRtc.baseClass");
goog.require("xRtc.eventDispatcher");
goog.require("xRtc.commonError");
goog.require("xRtc.ajax");
goog.require("xRtc.logger");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.Class(xrtc, "AuthManager", function AuthManager() {
    var proxy = xrtc.Class.proxy(this), logger = new xrtc.Logger(this.className);
    xrtc.Class.extend(this, xrtc.Ajax, xrtc.EventDispatcher, {_logger:logger, getToken:function(userData, callback) {
      var url = xrtc.AuthManager.settings.tokenHandler, data = getRequestParams.call(this, userData).join("&");
      this.ajax(url, "POST", data, proxy(handleTokenRequest, userData, callback));
    }, getIceServers:function(userData, callback) {
      var url = xrtc.AuthManager.settings.iceHandler, data = getRequestParams.call(this, userData).join("&");
      this.ajax(url, "POST", data, proxy(handleIceServersRequest, userData, callback));
    }});
    function getRequestParams(userData) {
      return["domain=" + userData.domain, "application=" + userData.application, "room=" + userData.room, "username=" + userData.name, "password=" + userData.password];
    }
    function handleTokenRequest(response, userData, callback) {
      var self = this;
      try {
        logger.debug("getToken", response);
        if (response === "") {
          logger.error("getToken", "Server returned an empty response.");
          self.trigger(xrtc.AuthManager.events.serverError, "Server returned an empty response.");
        }
        try {
          response = JSON.parse(response);
          logger.debug("getToken", response);
        } catch (ex) {
          logger.error("getToken", response);
          throw ex;
        }
        if (!!response && (!!response.e && response.e != "")) {
          var error = new xrtc.CommonError("getToken", response.e);
          logger.error("getToken", error);
          self.trigger(xrtc.AuthManager.events.serverError, error);
        } else {
          var token = response.d.token;
          if (!token) {
            logger.error("getToken", response.d);
            self.trigger(xrtc.AuthManager.events.serverError, response.d);
          } else {
            logger.info("getToken", token);
            if (typeof callback === "function") {
              callback(token);
            }
          }
        }
      } catch (ex) {
        logger.error("getToken. The request will be repeated after " + xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout / 1E3 + " sec.", ex);
        setTimeout(function() {
          self.getToken(userData, callback);
        }, xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout);
      }
    }
    function handleIceServersRequest(response, userData, callback) {
      var self = this;
      try {
        response = JSON.parse(response);
        logger.debug("getIceServers", response);
        if (!!response && (!!response.e && response.e != "")) {
          var error = new xrtc.CommonError("getIceServers", response.e);
          logger.error("getIceServers", error);
          self.trigger(xrtc.AuthManager.events.serverError, error);
        } else {
          var iceServers = response.d.iceServers ? response.d.iceServers.map(function(iceServer) {
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
          }) : [];
          logger.info("getIceServers", iceServers);
          if (typeof callback === "function") {
            callback(iceServers);
          }
        }
      } catch (ex) {
        logger.error("getIceServers. The request will be repeated after " + xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout / 1E3 + " sec.", ex);
        setTimeout(function() {
          self.getIceServers(userData, callback);
        }, xrtc.AuthManager.settings.unsuccessfulRequestRepeatTimeout);
      }
    }
  });
  xrtc.AuthManager.extend({events:{serverError:"servererror"}, settings:{unsuccessfulRequestRepeatTimeout:5E3, tokenHandler:"https://api.xirsys.com/getToken", iceHandler:"https://api.xirsys.com/getIceServers"}});
})(window);
goog.provide("xRtc.dataChannel");
goog.require("xRtc.baseClass");
goog.require("xRtc.eventDispatcher");
goog.require("xRtc.logger");
goog.require("xRtc.common");
goog.require("xRtc.commonError");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.Class(xrtc, "DataChannel", function(dataChannel, connection) {
    var proxy = xrtc.Class.proxy(this), logger = new xrtc.Logger(this.className), events = xrtc.DataChannel.events;
    dataChannel.onopen = proxy(channelOnOpen);
    dataChannel.onmessage = proxy(channelOnMessage);
    dataChannel.onclose = proxy(channelOnClose);
    dataChannel.onerror = proxy(channelOnError);
    dataChannel.ondatachannel = proxy(channelOnDatachannel);
    xrtc.Class.extend(this, xrtc.EventDispatcher, {_logger:logger, getId:function() {
      return connection.getId() + this.getName();
    }, getRemoteUser:function() {
      return connection.getRemoteUser();
    }, getConnection:function() {
      return connection;
    }, getName:function() {
      return dataChannel.label;
    }, getState:function() {
      return dataChannel.readyState.toLowerCase();
    }, send:function(data) {
      var self = this;
      logger.info("send", arguments);
      try {
        dataChannel.send(data);
      } catch (ex) {
        var sendingError = new xrtc.CommonError("onerror", 'DataChannel sending error. Channel state is "' + self.getState() + '"', ex);
        logger.error("error", sendingError);
        self.trigger(events.error, sendingError);
      }
      self.trigger(events.sentMessage, {data:data});
    }});
    function channelOnOpen(evt) {
      var data = {event:evt};
      logger.debug("open", data);
      this.trigger(events.open, data);
    }
    function channelOnMessage(evt) {
      logger.debug("message", evt.data);
      this.trigger(events.receivedMessage, {data:evt.data});
    }
    function channelOnClose(evt) {
      var data = {event:evt};
      logger.debug("close", data);
      this.trigger(events.close, data);
    }
    function channelOnError(evt) {
      var error = new xrtc.CommonError("onerror", "DataChannel error.", evt);
      logger.error("error", error);
      this.trigger(events.error, error);
    }
    function channelOnDatachannel(evt) {
      var data = {event:evt};
      logger.debug("datachannel", data);
      this.trigger(events.dataChannel, data);
    }
  });
  xrtc.DataChannel.extend({events:{open:"open", sentMessage:"sentMessage", receivedMessage:"receivedMessage", close:"close", error:"error", dataChannel:"datachannel"}, states:{connecting:"connecting", open:"open", closing:"closing", closed:"closed"}});
})(window);
goog.provide("xRtc.handshakeController");
goog.require("xRtc.baseClass");
goog.require("xRtc.logger");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.Class(xrtc, "HandshakeController", function HandshakeController() {
    var logger = new xrtc.Logger(this.className);
    xrtc.Class.extend(this, xrtc.EventDispatcher, {_logger:logger, sendIce:function(targetUserId, connectionId, iceCandidateData) {
      this.trigger(xrtc.HandshakeController.events.sendIce, targetUserId, connectionId, iceCandidateData);
    }, sendOffer:function(targetUserId, connectionId, offerData) {
      this.trigger(xrtc.HandshakeController.events.sendOffer, targetUserId, connectionId, offerData);
    }, sendAnswer:function(targetUserId, connectionId, answerData) {
      this.trigger(xrtc.HandshakeController.events.sendAnswer, targetUserId, connectionId, answerData);
    }, sendBye:function(targetUserId, connectionId, byeData) {
      this.trigger(xrtc.HandshakeController.events.sendBye, targetUserId, connectionId, byeData);
    }});
  });
  xrtc.HandshakeController.extend({events:{sendIce:"sendice", sendOffer:"sendoffer", sendAnswer:"sendanswer", sendBye:"sendbye", receiveIce:"receiveice", receiveOffer:"receiveoffer", receiveAnswer:"receiveanswer", receiveBye:"receivebye"}});
})(window);
goog.provide("xRtc.serverConnector");
goog.require("xRtc.baseClass");
goog.require("xRtc.eventDispatcher");
goog.require("xRtc.commonError");
goog.require("xRtc.ajax");
goog.require("xRtc.logger");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.Class(xrtc, "ServerConnector", function ServerConnector(options) {
    var proxy = xrtc.Class.proxy(this), logger = new xrtc.Logger(this.className), socket = null, currentToken = null, pingInterval = options ? options.pingInterval : 5E3, pingIntervalId = null, scEvents = xrtc.ServerConnector.events;
    xrtc.Class.extend(this, xrtc.EventDispatcher, xrtc.Ajax, {_logger:logger, connect:function(token) {
      currentToken = token;
      getWebSocketUrl.call(this, proxy(connect, token));
    }, disconnect:function() {
      if (socket) {
        socket.close();
        socket = null;
        currentToken = null;
        logger.info("disconnect", "Connection with WS has been broken");
      } else {
        logger.debug("disconnect", "Connection with WS has not been established yet");
      }
    }, sendOffer:function(targetUserId, connectionId, offerData) {
      var request = {eventName:scEvents.receiveOffer, targetUserId:targetUserId, data:{connectionId:connectionId, offer:offerData || {}}};
      send(request);
    }, sendAnswer:function(targetUserId, connectionId, answerData) {
      var request = {eventName:scEvents.receiveAnswer, targetUserId:targetUserId, data:{connectionId:connectionId, answer:answerData || {}}};
      send(request);
    }, sendIce:function(targetUserId, connectionId, iceCandidate) {
      var request = {eventName:scEvents.receiveIce, targetUserId:targetUserId, data:{connectionId:connectionId, iceCandidate:iceCandidate}};
      send(request);
    }, sendBye:function(targetUserId, connectionId, byeData) {
      var request = {eventName:scEvents.receiveBye, targetUserId:targetUserId, data:{connectionId:connectionId, byeData:byeData || {}}};
      send(request);
    }});
    function send(request) {
      if (!socket) {
        var error = new xrtc.CommonError("send", "Trying to call method without established connection", "WebSocket is not connected!");
        logger.error("send", error);
        throw error;
      }
      var requestObject = formatRequest.call(this, request);
      var requestJson = JSON.stringify(requestObject);
      logger.debug("send", requestObject, requestJson);
      socket.send(requestJson);
    }
    function getWebSocketUrl(callback) {
      this.ajax(xrtc.ServerConnector.settings.URL, "POST", "", proxy(getWebSocketUrlSuccess, callback));
    }
    function getWebSocketUrlSuccess(response, callback) {
      try {
        response = JSON.parse(response);
        logger.debug("getWebSocketURL", response);
        if (!!response && (!!response.e && response.e != "")) {
          var error = new xrtc.CommonError("getWebSocketURL", "Error occured while getting the URL of WebSockets", response.e);
          logger.error("getWebSocketURL", error);
          this.trigger(scEvents.serverError, {error:error});
        } else {
          var url = response.d.value;
          logger.info("getWebSocketURL", url);
          if (typeof callback === "function") {
            callback(url);
          }
        }
      } catch (e) {
        getWebSocketUrl.call(this, callback);
      }
    }
    function connect(url, token) {
      socket = new WebSocket(url + "/ws/" + encodeURIComponent(token));
      socket.onopen = proxy(socketOnOpen);
      socket.onclose = proxy(socketOnClose);
      socket.onerror = proxy(socketOnError);
      socket.onmessage = proxy(socketOnMessage);
    }
    function socketOnOpen(evt) {
      var data = {event:evt};
      logger.debug("open", data);
      if (pingInterval) {
        pingIntervalId = pingServer.call(this, pingInterval);
      }
      this.trigger(scEvents.connectionOpen, data);
    }
    function socketOnClose(evt) {
      if (pingIntervalId) {
        exports.clearInterval(pingIntervalId);
        pingIntervalId = null;
      }
      var data = {event:evt};
      logger.debug("close", data);
      this.trigger(scEvents.connectionClose, data);
      socket = null;
    }
    function socketOnError(evt) {
      var error = new xrtc.CommonError("onerror", "WebSocket has got an error", evt);
      logger.error("error", error);
      this.trigger(scEvents.connectionError, {error:error});
    }
    function socketOnMessage(msg) {
      var data = {message:msg};
      logger.debug("message", data);
      this.trigger(scEvents.message, data);
      handleServerMessage.call(this, msg);
    }
    function validateServerMessage(msg) {
      var validationResult = true;
      if (msg.data === '"Token invalid"') {
        validationResult = false;
        this.trigger(scEvents.tokenInvalid, {token:currentToken});
      }
      return validationResult;
    }
    function parseServerMessage(msg) {
      var resultObject;
      try {
        resultObject = JSON.parse(msg.data);
      } catch (e) {
        resultObject = null;
        var error = new xrtc.CommonError("parseServerMessage", "Message format error", e);
        logger.error("parseServerMessage", error, msg);
        this.trigger(scEvents.messageFormatError, {error:error});
      }
      return resultObject;
    }
    function handleRoomEvents(eventName, data) {
      if (eventName == scEvents.usersUpdated) {
        var users = [];
        for (var i = 0, len = data.message.users.length;i < len;i++) {
          users.push({id:data.message.users[i], name:data.message.users[i]});
        }
        var usersData = {users:users};
        this.trigger(scEvents.usersUpdated, usersData);
      } else {
        if (eventName == scEvents.userConnected) {
          var connectedData = {user:{id:data.message, name:data.message}};
          this.trigger(scEvents.userConnected, connectedData);
        } else {
          if (eventName == scEvents.userDisconnected) {
            var disconnectedData = {user:{id:data.message, name:data.message}};
            this.trigger(scEvents.userDisconnected, disconnectedData);
          }
        }
      }
    }
    function handleHandshakeEvents(eventName, data) {
      if (eventName == scEvents.receiveOffer) {
        var offerData = {senderId:data.userid, receiverId:data.message.targetUserId, connectionId:data.message.data.connectionId, offer:data.message.data.offer.offer, iceServers:data.message.data.offer.iceServers, connectionType:data.message.data.offer.connectionType, connectionData:data.message.data.offer.connectionData};
        this.trigger(scEvents.receiveOffer, offerData);
      } else {
        if (eventName == scEvents.receiveAnswer) {
          var answerData = {senderId:data.userid, connectionId:data.message.data.connectionId, answer:data.message.data.answer.answer, acceptData:data.message.data.answer.acceptData};
          this.trigger(scEvents.receiveAnswer, answerData);
        } else {
          if (eventName == scEvents.receiveIce) {
            var iceData = {senderId:data.userid, connectionId:data.message.data.connectionId, iceCandidate:data.message.data.iceCandidate};
            this.trigger(scEvents.receiveIce, iceData);
          } else {
            if (eventName == scEvents.receiveBye) {
              var byeData = {senderId:data.userid, connectionId:data.message.data.connectionId, byeData:data.message.data.byeData};
              this.trigger(scEvents.receiveBye, byeData);
            }
          }
        }
      }
    }
    function handleServerMessage(msg) {
      if (validateServerMessage(msg)) {
        var data = parseServerMessage(msg);
        var eventName = data.type;
        if (eventName == scEvents.usersUpdated || (eventName == scEvents.userConnected || eventName == scEvents.userDisconnected)) {
          handleRoomEvents.call(this, eventName, data);
        } else {
          if (eventName == scEvents.receiveOffer || (eventName == scEvents.receiveAnswer || (eventName == scEvents.receiveIce || eventName == scEvents.receiveBye))) {
            handleHandshakeEvents.call(this, eventName, data);
          }
        }
      }
    }
    function formatRequest(request) {
      var result = {eventName:request.eventName};
      if (typeof request.data !== "undefined") {
        result.data = request.data;
      }
      if (typeof request.targetUserId !== "undefined") {
        result.targetUserId = request.targetUserId.toString();
      }
      return result;
    }
    function pingServer(interval) {
      return exports.setInterval(function() {
        var pingRequest = {};
        send.call(this, pingRequest);
      }, interval);
    }
  });
  xrtc.ServerConnector.extend({events:{connectionOpen:"connectionopen", connectionClose:"connectionclose", connectionError:"connectionerror", message:"message", messageFormatError:"messageformaterror", serverError:"servererror", tokenInvalid:"tokeninvalid", receiveOffer:"receiveoffer", receiveAnswer:"receiveanswer", receiveIce:"receiveice", receiveBye:"receivebye", usersUpdated:"peers", userConnected:"peer_connected", userDisconnected:"peer_removed"}, settings:{URL:"https://api.xirsys.com/wsList"}});
})(window);
goog.provide("xRtc.stream");
goog.require("xRtc.baseClass");
goog.require("xRtc.eventDispatcher");
goog.require("xRtc.logger");
goog.require("xRtc.common");
goog.require("xRtc.commonError");
(function(exports, xrtc) {
  var webrtc = xrtc.webrtc;
  xrtc.Class(xrtc, "Stream", function Stream(stream) {
    var proxy = xrtc.Class.proxy(this), logger = new xrtc.Logger(this.className), events = xrtc.Stream.events, id = null;
    xrtc.Class.property(this, "videoEnabled", getVideoEnabled, setVideoEnabled);
    xrtc.Class.property(this, "audioEnabled", getAudioEnabled, setAudioEnabled);
    xrtc.Class.property(this, "videoAvailable", getVideoAvailable);
    xrtc.Class.property(this, "audioAvailable", getAudioAvailable);
    stream.onended = proxy(onStreamEnded);
    xrtc.Class.extend(this, xrtc.EventDispatcher, {_logger:logger, getStream:function() {
      return stream;
    }, stop:function() {
      stream.stop();
    }, getId:function() {
      if (!id) {
        id = generateStreamId();
      }
      return id;
    }, getURL:function() {
      return webrtc.URL.createObjectURL(stream);
    }, assignTo:function(videoDomElement) {
      if (this.videoAvailable || (this.audioAvailable || stream.currentTime > 0)) {
        assignTo.call(this, videoDomElement);
      } else {
        exports.setTimeout(proxy(this.assignTo, videoDomElement), 100);
      }
    }});
    function generateStreamId() {
      var resultId;
      if (stream.id) {
        resultId = stream.id;
      } else {
        resultId = xrtc.utils.newGuid();
      }
      return resultId;
    }
    function assignTo(videoDomElement) {
      if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
        videoDomElement.mozSrcObject = stream;
      } else {
        videoDomElement.src = this.getURL();
      }
      videoDomElement.play();
    }
    function onStreamEnded(evt) {
      var data = {id:evt.srcElement.id};
      logger.debug("ended", data);
      this.trigger(events.ended, data);
    }
    function getVideoEnabled() {
      var videoTracks = stream.getVideoTracks();
      return this.videoAvailable && videoTracks[0].enabled;
    }
    function setVideoEnabled(val) {
      checkPossibilityToMuteMediaTrack();
      var videoTracks = stream.getVideoTracks();
      for (var i = 0, len = videoTracks.length;i < len;i++) {
        videoTracks[i].enabled = val;
      }
    }
    function getAudioEnabled() {
      var audioTracks = stream.getAudioTracks();
      return this.audioAvailable && audioTracks[0].enabled;
    }
    function setAudioEnabled(val) {
      checkPossibilityToMuteMediaTrack();
      var audioTracks = stream.getAudioTracks();
      for (var i = 0, len = audioTracks.length;i < len;i++) {
        audioTracks[i].enabled = val;
      }
    }
    function getVideoAvailable() {
      return stream.getVideoTracks().length > 0;
    }
    function getAudioAvailable() {
      return stream.getAudioTracks().length > 0;
    }
    function checkPossibilityToMuteMediaTrack() {
      if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion < 22) {
        throw new xrtc.CommonError("setVideoEnabled", "Media track muting is not supported if your Firefox browser version less then 22.");
      }
    }
  });
  xrtc.Stream.extend({events:{ended:"ended"}});
})(window, xRtc);
goog.provide("xRtc.connection");
goog.require("xRtc.baseClass");
goog.require("xRtc.eventDispatcher");
goog.require("xRtc.logger");
goog.require("xRtc.common");
goog.require("xRtc.commonError");
goog.require("xRtc.stream");
goog.require("xRtc.dataChannel");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc, internal = {}, webrtc = xrtc.webrtc;
  xrtc.Class(internal, "IceCandidateFilter", function IceCandidateFilter(type, iceServers) {
    var connectionType = type || xrtc.Connection.connectionTypes["default"], ipRegexp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;
    xrtc.Class.extend(this, {getType:function() {
      return connectionType;
    }, filterCandidate:function(iceCandidate) {
      var resultCandidate = null;
      if (connectionType === xrtc.Connection.connectionTypes["default"]) {
        resultCandidate = iceCandidate;
      } else {
        if (connectionType === xrtc.Connection.connectionTypes.direct && (iceCandidateTypeDetector.isLocal(iceCandidate) || iceCandidateTypeDetector.isStun(iceCandidate))) {
          resultCandidate = iceCandidate;
        } else {
          if (connectionType === xrtc.Connection.connectionTypes.server) {
            if (iceCandidateTypeDetector.isTurn(iceCandidate)) {
              resultCandidate = iceCandidate;
            } else {
              if (iceCandidateTypeDetector.isStun(iceCandidate)) {
                resultCandidate = stun2Turn(iceCandidate);
              }
            }
          }
        }
      }
      return resultCandidate;
    }, filterSDP:function(sdp) {
      var changedSdp = sdp;
      if (connectionType === xrtc.Connection.connectionTypes.server) {
        changedSdp = sdp.replace(/a=candidate:.*((typ host)|(typ srflx)).*\r\n/g, "");
      } else {
        if (connectionType === xrtc.Connection.connectionTypes.direct) {
          changedSdp = sdp.replace(/a=candidate:.*typ relay.*\r\n/g, "");
        }
      }
      return changedSdp;
    }});
    var iceCandidateTypeDetector = {isLocal:function(iceCandidate) {
      return/typ host/.test(iceCandidate.candidate);
    }, isStun:function(iceCandidate) {
      return/typ srflx/.test(iceCandidate.candidate);
    }, isTurn:function(iceCandidate) {
      return/typ relay/.test(iceCandidate.candidate);
    }};
    function getIceServersTurnIP(iceServersArray) {
      var turnIpAddress = null;
      if (iceServersArray) {
        for (var i = 0;i < iceServersArray.length;i++) {
          var server = iceServersArray[i];
          if (server.url.indexOf("turn:") === 0) {
            if (server.url.indexOf("@") !== -1) {
              turnIpAddress = server.url.split("@")[1];
            } else {
              turnIpAddress = server.url.split("turn:")[1];
            }
          }
        }
      }
      return turnIpAddress;
    }
    function stun2Turn(iceCandidate) {
      var resultTurnCandidate = null;
      var turnIpAddress = getIceServersTurnIP(iceServers);
      if (turnIpAddress) {
        resultTurnCandidate = iceCandidate;
        resultTurnCandidate.candidate = iceCandidate.candidate.replace(ipRegexp, turnIpAddress);
        resultTurnCandidate.candidate = iceCandidate.candidate.replace("typ srflx", "typ relay");
      }
      return resultTurnCandidate;
    }
  });
  xrtc.Class(xrtc, "Connection", function Connection(connId, ud, remoteUser, hc, am, data) {
    var proxy = xrtc.Class.proxy(this), logger = new xrtc.Logger(this.className), userData = ud, authManager = am || new xRtc.AuthManager, localStreams = [], remoteStreams = [], dataChannels = [], dataChannelConfigs = [], peerConnection = null, checkConnectionStateIntervalId = null, checkDisconnectedIceStateTimeoutId = null, handshakeController = hc, iceFilter = null, iceServers = null, connectionEstablished = false, iceCandidates = [], connectionId = connId, connectionData = data, connectionIsOpened = 
    false;
    subscribeToHandshakeControllerEvents.call(this);
    xrtc.Class.extend(this, xrtc.EventDispatcher, {_logger:logger, getId:function() {
      return connectionId;
    }, getRemoteUser:function() {
      return remoteUser;
    }, _open:function(options) {
      connectionIsOpened = true;
      var self = this, offerOptions = {};
      xrtc.Class.extend(offerOptions, xrtc.Connection.settings.offerOptions);
      if (options && options.offer) {
        xrtc.Class.extend(offerOptions, options.offer);
      }
      self.trigger(xrtc.Connection.events.connectionOpening, {connection:self, user:remoteUser});
      initPeerConnection.call(self, remoteUser, function() {
        iceFilter = new internal.IceCandidateFilter(options && options.connectionType || null, iceServers);
        peerConnection.createOffer(proxy(onCreateOfferSuccess), proxy(onCreateOfferError), offerOptions);
        function onCreateOfferSuccess(offer) {
          if (peerConnection) {
            if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
              offer.sdp = iceFilter.filterSDP(offer.sdp);
            }
            logger.debug("onCreateOfferSuccess", offer);
            peerConnection.setLocalDescription(offer);
            if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion <= 21) {
              var inline = "a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:FakeFakeFakeFakeFakeFakeFakeFakeFakeFake\r\nc=IN";
              offer.sdp = offer.sdp.indexOf("a=crypto") == -1 ? offer.sdp.replace(/c=IN/g, inline) : offer.sdp;
            }
            var request = {offer:JSON.stringify(offer), connectionData:connectionData, connectionType:iceFilter.getType(), iceServers:iceServers};
            logger.debug("sendOffer", remoteUser.id, offer);
            handshakeController.sendOffer(remoteUser.id, connectionId, request);
            self.trigger(xrtc.Connection.events.offerSent, {connection:this, user:remoteUser, offerData:request});
          }
        }
        function onCreateOfferError(err) {
          var error = new xrtc.CommonError("startSession", "Cannot create WebRTC offer", err);
          logger.error("onCreateOfferError", error);
          self.trigger(xrtc.Connection.events.createOfferError, {connection:self, error:error});
        }
      });
    }, close:function(byeData) {
      if (handshakeController && remoteUser) {
        handshakeController.sendBye(remoteUser.id, connectionId, byeData);
      }
      closePeerConnection.call(this);
    }, addStream:function(xrtcStream) {
      if (connectionIsOpened) {
        throwExceptionOfWrongmethodCall("addStream");
      }
      localStreams.push(xrtcStream);
      var streamData = {connection:this, stream:xrtcStream, user:{id:userData.name, name:userData.name}};
      logger.debug("addLocalStream", streamData);
      this.trigger(xrtc.Connection.events.localStreamAdded, streamData);
    }, createDataChannel:function(name, config) {
      if (connectionIsOpened) {
        throwExceptionOfWrongmethodCall("createDataChannel");
      }
      dataChannelConfigs.push({name:name, config:config});
    }, getData:function() {
      return connectionData;
    }, getState:function() {
      return getSignalingState.call(this);
    }, getLocalStreams:function() {
      return localStreams.map(function(stream) {
        return stream;
      });
    }, getRemoteStreams:function() {
      return remoteStreams.map(function(stream) {
        return stream;
      });
    }, getDataChannels:function() {
      return dataChannels.map(function(channel) {
        return channel;
      });
    }});
    function throwExceptionOfWrongmethodCall(methodName) {
      var error = new xrtc.CommonError(methodName, "The method can be called on '" + xrtc.Room.events.connectionCreated + "' event of the xRtc.Room. Use xRtc.Room.events.connectionCreated for access the event name.");
      logger.error(methodName, error);
    }
    function subscribeToHandshakeControllerEvents() {
      var hcEvents = xrtc.HandshakeController.events;
      handshakeController.on(hcEvents.receiveIce, proxy(onReceiveIce)).on(hcEvents.receiveOffer, proxy(onReceiveOffer)).on(hcEvents.receiveAnswer, proxy(onReceiveAnswer)).on(hcEvents.receiveBye, proxy(onReceiveBye));
    }
    function initPeerConnection(user, callback) {
      remoteUser = user;
      if (!peerConnection) {
        getIceServers.call(this, proxy(onIceServersGot));
      } else {
        callCallback();
      }
      function callCallback() {
        if (typeof callback === "function") {
          try {
            callback();
          } catch (e) {
          }
        }
      }
      function createBrowserCompatibleIceServers(iceServersArray) {
        var browserCompatibleIceServers = [];
        var createFireFoxTurnServer = function(url, username, password) {
          var iceServer = null;
          var url_parts = url.split(":");
          if (url_parts[0].indexOf("stun") === 0) {
            iceServer = {"url":removeRedundantSymbolFromTheEnd(url, "/")};
          } else {
            if (url_parts[0].indexOf("turn") === 0 && (url.indexOf("transport=udp") !== -1 || url.indexOf("?transport") === -1)) {
              var turn_url_parts = url.split("?");
              iceServer = {"url":removeRedundantSymbolFromTheEnd(turn_url_parts[0], "/"), "credential":password, "username":username};
            }
          }
          return iceServer;
        };
        var createCromeTurnServer = function(url, username, password) {
          var iceServer = null;
          var url_parts = url.split(":");
          if (url_parts[0].indexOf("stun") === 0) {
            iceServer = {"url":removeRedundantSymbolFromTheEnd(url, "/")};
          } else {
            if (url_parts[0].indexOf("turn") === 0) {
              if (webrtc.detectedBrowserVersion < 28) {
                var url_turn_parts = url.split("turn:");
                iceServer = {"url":"turn:" + username + "@" + url_turn_parts[1], "credential":password};
              } else {
                iceServer = {"url":removeRedundantSymbolFromTheEnd(url, "/"), "credential":password, "username":username};
              }
            }
          }
          return iceServer;
        };
        function removeRedundantSymbolFromTheEnd(str, symbol) {
          var result = str;
          if (str[str.length - 1] === symbol) {
            result = str.substring(0, str.length - 1);
          }
          return result;
        }
        var createBrowserCompatibleServer = function(iceServerData) {
          var resultIceServer;
          if (webrtc.detectedBrowser == webrtc.supportedBrowsers.chrome) {
            resultIceServer = createCromeTurnServer(iceServerData.url, iceServerData.username, iceServerData.credential);
          } else {
            resultIceServer = createFireFoxTurnServer(iceServerData.url, iceServerData.username, iceServerData.credential);
          }
          return resultIceServer;
        };
        for (var i = 0, l = iceServersArray.length;i < l;i++) {
          var browserCompatibleServer = createBrowserCompatibleServer(iceServersArray[i]);
          if (browserCompatibleServer) {
            browserCompatibleIceServers.push(browserCompatibleServer);
          }
        }
        return browserCompatibleIceServers;
      }
      function onIceServersGot(iceServersArray) {
        var self = this;
        var browserCompatibleIceServers = createBrowserCompatibleIceServers(iceServersArray);
        peerConnection = new webrtc.RTCPeerConnection(browserCompatibleIceServers && browserCompatibleIceServers.length > 0 ? {iceServers:browserCompatibleIceServers} : null, xrtc.Connection.settings.peerConnectionOptions);
        logger.info("initPeerConnection", "PeerConnection created.");
        peerConnection.onicecandidate = proxy(onIceCandidate);
        peerConnection.onstatechange = peerConnection.onsignalingstatechange = proxy(onConnectionStateChange);
        if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion < 24) {
          var connectionState = this.getState();
          checkConnectionStateIntervalId = exports.setInterval(function() {
            var currentConnectionState = self.getState();
            if (currentConnectionState != connectionState) {
              logger.debug("setInterval -> xrtc.Connection.events.stateChanged", currentConnectionState);
              connectionState = currentConnectionState;
              self.trigger(xrtc.Connection.events.stateChanged, {connection:self, state:connectionState});
            }
          }, 500);
        }
        peerConnection.onicechange = peerConnection.oniceconnectionstatechange = proxy(onIceStateChange);
        peerConnection.ondatachannel = function(channelData) {
          var newDataChannel = new xrtc.DataChannel(channelData.channel, self);
          dataChannels.push(newDataChannel);
          self.trigger(xrtc.Connection.events.dataChannelCreated, {connection:self, channel:newDataChannel});
        };
        peerConnection.onaddstream = proxy(onAddStream);
        peerConnection.onclosedconnection = function(closeData) {
          logger.debug("peerConnection.onclosedconnection", closeData);
          closePeerConnection.call(self);
        };
        function onIceCandidate(evt) {
          if (!!evt.candidate) {
            logger.debug("peerConnection.onIceCandidate", evt.candidate);
            var ice = JSON.parse(JSON.stringify(evt.candidate));
            var filteredIce = iceFilter.filterCandidate(ice);
            if (filteredIce !== null) {
              handleIceCandidate.call(this, filteredIce);
            }
          }
        }
        function onConnectionStateChange(evt) {
          logger.debug("onConnectionStateChange", evt);
          this.trigger(xrtc.Connection.events.stateChanged, {connection:this, state:this.getState()});
        }
        function onIceStateChange(evt) {
          var state = getIceState.call(self);
          logger.debug("onIceStateChange", (new Date).getTime(), state);
          if (checkDisconnectedIceStateTimeoutId) {
            logger.debug("onIceStateChange", (new Date).getTime(), "checkDisconnectedIceStateTimeout are clearing. ID = '" + checkDisconnectedIceStateTimeoutId + "'");
            exports.clearTimeout(checkDisconnectedIceStateTimeoutId);
            checkDisconnectedIceStateTimeoutId = null;
            logger.debug("onIceStateChange", (new Date).getTime(), "checkDisconnectedIceStateTimeout was cleared. ID = '" + checkDisconnectedIceStateTimeoutId + "'");
          }
          if (state === "connected") {
            self.trigger(xrtc.Connection.events.connectionEstablished, {connection:self, user:remoteUser});
          } else {
            if (state === "disconnected") {
              var closeDisconnectedConnectionTimeout = 1E4;
              logger.debug("onIceStateChange", (new Date).getTime(), "checkDisconnectedIceStateTimeout(" + closeDisconnectedConnectionTimeout / 1E3 + "sec.) was started.");
              checkDisconnectedIceStateTimeoutId = exports.setTimeout(function() {
                logger.debug("onIceStateChange", (new Date).getTime(), "ice state equals 'disconnected' so closePeerConnection was called. Timeout is " + closeDisconnectedConnectionTimeout / 1E3 + "sec and it is expired.");
                closePeerConnection.call(self);
                exports.clearInterval(checkDisconnectedIceStateTimeoutId);
                checkDisconnectedIceStateTimeoutId = null;
              }, closeDisconnectedConnectionTimeout);
              logger.debug("onIceStateChange", (new Date).getTime(), "checkDisconnectedIceStateTimeout ID ='" + checkDisconnectedIceStateTimeoutId + "'");
            }
          }
        }
        function onAddStream(evt) {
          addRemoteStream.call(this, evt.stream);
        }
        for (var i = 0, len = localStreams.length;i < len;i++) {
          peerConnection.addStream(localStreams[i].getStream());
        }
        for (var i = 0, len = dataChannelConfigs.length;i < len;i++) {
          createDataChannel.call(this, dataChannelConfigs[i]);
        }
        callCallback();
      }
    }
    function createDataChannel(dataChannelConfig) {
      var self = this;
      try {
        var dc;
        if (xrtc.webrtc.supports.sctp) {
          dc = peerConnection.createDataChannel(dataChannelConfig.name, {reliable:true});
          dc.binaryType = "arraybuffer";
        } else {
          dc = peerConnection.createDataChannel(dataChannelConfig.name, {reliable:false});
        }
        var newDataChannel = new xrtc.DataChannel(dc, self);
        dataChannels.push(newDataChannel);
        self.trigger(xrtc.Connection.events.dataChannelCreated, {connection:self, channel:newDataChannel});
      } catch (ex) {
        var error = new xrtc.CommonError("createDataChannel", "Can't create DataChannel.", ex);
        logger.error("createDataChannel", error);
        self.trigger(xrtc.Connection.events.dataChannelCreationError, {connection:self, channelConfig:dataChannelConfig, error:error});
      }
    }
    function handleIceCandidate(ice) {
      iceCandidates.push(ice);
      if (connectionEstablished) {
        sendIceCandidates.call(this);
      }
    }
    function allowIceSending() {
      connectionEstablished = true;
      sendIceCandidates.call(this);
    }
    function sendIceCandidates() {
      logger.debug("sendIceCandidates", 'Sending "' + iceCandidates.length + '" ice candidates.');
      for (var i = 0, l = iceCandidates.length;i < l;i++) {
        var iceCandidate = iceCandidates[i];
        handshakeController.sendIce(remoteUser.id, connectionId, JSON.stringify(iceCandidate));
        this.trigger(xrtc.Connection.events.iceSent, {connection:this, iceCandidate:iceCandidate});
      }
      iceCandidates = [];
    }
    function addRemoteStream(stream) {
      var newXrtcStream = new xrtc.Stream(stream);
      remoteStreams.push(newXrtcStream);
      var streamData = {user:remoteUser, connection:this, stream:newXrtcStream};
      logger.debug("addRemoteStream", streamData);
      this.trigger(xrtc.Connection.events.remoteStreamAdded, streamData);
    }
    function getIceServers(callback) {
      if (typeof callback === "function") {
        if (iceServers) {
          callback(iceServers);
        } else {
          authManager.getIceServers(userData, function(servers) {
            iceServers = servers;
            callback(iceServers);
          });
        }
      }
    }
    function onReceiveIce(iceData) {
      logger.debug("Ice candidate was received.", iceData);
      var iceCandidate = new webrtc.RTCIceCandidate(JSON.parse(iceData.iceCandidate));
      peerConnection.addIceCandidate(iceCandidate);
      this.trigger(xrtc.Connection.events.iceAdded, {connection:this, iceCandidate:iceCandidate});
    }
    function onReceiveOffer(offerData) {
      this.trigger(xrtc.Connection.events.offerReceived, {connection:this, user:remoteUser, offerData:offerData});
      this.trigger(xrtc.Connection.events.connectionOpening, {connection:this, user:remoteUser});
      logger.debug("Offer was received.", offerData);
      iceServers = offerData.iceServers;
      initPeerConnection.call(this, remoteUser, proxy(onPeerConnectionInit));
      function onPeerConnectionInit() {
        logger.debug("receiveOffer", offerData);
        iceFilter = new internal.IceCandidateFilter(offerData.connectionType, iceServers);
        var sdp = JSON.parse(offerData.offer);
        var remoteSessionDescription = new webrtc.RTCSessionDescription(sdp);
        peerConnection.setRemoteDescription(remoteSessionDescription);
        peerConnection.createAnswer(proxy(onCreateAnswerSuccess), proxy(onCreateAnswerError), xrtc.Connection.settings.answerOptions);
        function onCreateAnswerSuccess(answer) {
          if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
            answer.sdp = iceFilter.filterSDP(answer.sdp);
          }
          peerConnection.setLocalDescription(answer);
          var request = {answer:JSON.stringify(answer), acceptData:offerData.acceptData};
          logger.debug("sendAnswer", offerData, answer);
          handshakeController.sendAnswer(remoteUser.id, connectionId, request);
          this.trigger(xrtc.Connection.events.answerSent, {connection:this, user:remoteUser, answerData:request});
          this.trigger(xrtc.Connection.events.connectionEstablishing, {connection:this, user:remoteUser});
          allowIceSending.call(this);
        }
        function onCreateAnswerError(err) {
          var error = new xrtc.CommonError("sendAnswer", "Cannot create WebRTC answer", err);
          logger.error("sendAnswer", error);
          this.trigger(xrtc.Connection.events.createAnswerError, {connection:this, error:error});
        }
      }
    }
    function onReceiveAnswer(answerData) {
      logger.debug("Answer was received.", answerData);
      allowIceSending.call(this);
      var sdp = JSON.parse(answerData.answer);
      var sessionDescription = new webrtc.RTCSessionDescription(sdp);
      peerConnection.setRemoteDescription(sessionDescription);
      this.trigger(xrtc.Connection.events.answerReceived, {connection:this, user:remoteUser, answerData:{answer:sessionDescription}});
      this.trigger(xrtc.Connection.events.connectionEstablishing, {connection:this, user:remoteUser});
    }
    function onReceiveBye() {
      closePeerConnection.call(this);
    }
    function closePeerConnection() {
      var self = this;
      if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && checkConnectionStateIntervalId) {
        exports.clearInterval(checkConnectionStateIntervalId);
        checkConnectionStateIntervalId = null;
      }
      if (peerConnection) {
        peerConnection.onicecandidate = null;
        peerConnection.close();
        peerConnection = null;
        iceCandidates = [];
        iceServers = null;
        connectionEstablished = false;
        connectionIsOpened = false;
        var closeConnectionData = {user:remoteUser, connection:self};
        remoteUser = null;
        this.trigger(xrtc.Connection.events.connectionClosed, closeConnectionData);
      }
    }
    function getIceState() {
      var state = peerConnection && (peerConnection.iceConnectionState || peerConnection.iceState) || "notinitialized";
      return state;
    }
    function getSignalingState() {
      var isLocalStreamAdded = localStreams.length > 0, states = {"notinitialized":isLocalStreamAdded ? "ready" : "not-ready", "new":isLocalStreamAdded ? "ready" : "not-ready", "opening":"connecting", "active":"connected", "closing":"disconnecting", "closed":isLocalStreamAdded ? "ready" : "not-ready", "stable":"connected", "have-local-offer":"ready", "have-remote-offer":"connecting"}, state = peerConnection && (peerConnection.signalingState || peerConnection.readyState) || "notinitialized";
      return states[state];
    }
  });
  xrtc.Connection.extend({events:{connectionOpening:"connectionopening", connectionEstablishing:"connectionestablishing", connectionEstablished:"connectionestablished", connectionClosed:"connectionclosed", localStreamAdded:"localstreamadded", remoteStreamAdded:"remotestreamadded", dataChannelCreated:"datachannelcreated", dataChannelCreationError:"datachannelcreationerror", stateChanged:"statechanged", createOfferError:"createoffererror", offerSent:"offersent", offerReceived:"offerreceived", createAnswerError:"createanswererror", 
  answerSent:"answersent", answerReceived:"answerreceived", iceSent:"icesent", iceAdded:"iceadded"}, connectionTypes:{"default":"default", direct:"direct", server:"server"}, settings:{offerOptions:{optional:[], mandatory:{OfferToReceiveAudio:true, OfferToReceiveVideo:true}}, answerOptions:{optional:[], mandatory:{OfferToReceiveAudio:true, OfferToReceiveVideo:true}}, peerConnectionOptions:{optional:[{RtpDataChannels:!xrtc.webrtc.supports.sctp}, {DtlsSrtpKeyAgreement:true}]}}});
  if (webrtc.RTCPeerConnection.prototype && !webrtc.RTCPeerConnection.prototype.getLocalStreams) {
    xrtc.Class.extend(webrtc.RTCPeerConnection.prototype, {getLocalStreams:function() {
      return this.localStreams;
    }, getRemoteStreams:function() {
      return this.remoteStreams;
    }});
  }
  if (!webrtc.MediaStream.prototype.getVideoTracks) {
    if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
      xrtc.Class.extend(webrtc.MediaStream.prototype, {getVideoTracks:function() {
        return[];
      }, getAudioTracks:function() {
        return[];
      }});
    } else {
      xrtc.Class.extend(webrtc.MediaStream.prototype, {getVideoTracks:function() {
        return this.videoTracks;
      }, getAudioTracks:function() {
        return this.audioTracks;
      }});
    }
  }
})(window);
goog.provide("xRtc.room");
goog.require("xRtc.baseClass");
goog.require("xRtc.eventDispatcher");
goog.require("xRtc.logger");
goog.require("xRtc.common");
goog.require("xRtc.commonError");
goog.require("xRtc.handshakeController");
goog.require("xRtc.connection");
goog.require("xRtc.authManager");
goog.require("xRtc.serverConnector");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc;
  xrtc.Class(xrtc, "Room", function Room(info, am, sc) {
    var proxy = xrtc.Class.proxy(this), logger = new xrtc.Logger(this.className), hcEvents = xrtc.HandshakeController.events, scEvents = xrtc.ServerConnector.events, users = [], isServerConnectorSubscribed = false, roomOptions = {}, roomInfo = {}, currentUserData = null, authManager = am || new xRtc.AuthManager, serverConnector = sc || new xrtc.ServerConnector, connections = [], handshakeControllerObjects = {}, byeTypes = {decline:"decline"};
    xrtc.Class.extend(roomInfo, xrtc.Room.settings.info);
    if (typeof info === "string") {
      roomInfo.name = info;
    } else {
      xrtc.Class.extend(roomInfo, info);
    }
    xrtc.Class.extend(this, xrtc.EventDispatcher, {_logger:logger, enter:function(credentials, options) {
      var user = "", pass = "";
      if (!credentials) {
        throw new xrtc.CommonError("enter", "User credentials should be specified.");
      }
      if (typeof credentials === "string") {
        user = credentials;
      } else {
        user = credentials.username;
        pass = credentials.password;
      }
      subscribeToServerEvents.call(this);
      xrtc.Class.extend(roomOptions, xrtc.Room.settings.enterOptions);
      if (options) {
        xrtc.Class.extend(roomOptions, options);
      }
      currentUserData = {domain:roomInfo.domain, application:roomInfo.application, room:roomInfo.name, name:user, password:pass};
      authManager.getToken(currentUserData, function(token) {
        roomInfo.user = {id:null, name:user};
        serverConnector.connect(token);
      });
    }, leave:function() {
      serverConnector.on(xrtc.ServerConnector.events.connectionClose, function() {
        unsubscribeFromServerEvents.call(this);
        roomOptions = {};
        currentUserData = null;
        roomInfo.user = null;
        users = [];
        connections = [], handshakeControllerObjects = {};
      });
      serverConnector.disconnect();
    }, connect:function(targetUserId, connectionOptions) {
      if (!roomInfo.user) {
        throw new xrtc.CommonError("connect", "Need to enter the room before you connect someone.");
      }
      var targetUser = getUserById(targetUserId);
      if (targetUser == null) {
        var error = xrtc.CommonError("connect", "Target user not found.");
        this.trigger(xrtc.Room.events.error, {userId:targetUserId, error:error});
      } else {
        var connectionMetadata = connectionOptions && connectionOptions.data ? connectionOptions.data : null;
        var connectionId = connectionOptions && connectionOptions.id ? connectionOptions.id : xrtc.utils.newGuid();
        createConnection.call(this, connectionId, currentUserData, targetUser, connectionMetadata, function(connectionData) {
          var connection = connectionData.connection;
          if (connectionOptions && connectionOptions.createDataChannel === "auto") {
            connection.createDataChannel("autoDataChannel");
          }
          connection._open(connectionOptions);
        });
      }
    }, getInfo:function() {
      return roomInfo;
    }, getConnections:function() {
      return connections.map(function(connection) {
        return connection;
      });
    }, getUsers:function() {
      return users.map(function(user) {
        return user;
      });
    }});
    function subscribeToServerEvents() {
      var self = this;
      if (!isServerConnectorSubscribed) {
        serverConnector.on(scEvents.connectionOpen, proxy(function(event) {
          this.trigger(xrtc.Room.events.enter);
        })).on(scEvents.connectionClose, proxy(function(event) {
          this.trigger(xrtc.Room.events.leave);
        })).on(scEvents.tokenInvalid, proxy(function(event) {
          this.trigger(xrtc.Room.events.tokenInvalid, event);
        })).on(scEvents.usersUpdated, proxy(function(data) {
          users = data.users;
          sortUsers();
          this.trigger(xrtc.Room.events.usersUpdated, {users:this.getUsers()});
        })).on(scEvents.userConnected, proxy(function(data) {
          users.push(data.user);
          sortUsers();
          this.trigger(xrtc.Room.events.userConnected, {user:data.user});
        })).on(scEvents.userDisconnected, proxy(function(data) {
          users.splice(getUserIndexById(users, data.user.id), 1);
          sortUsers();
          this.trigger(xrtc.Room.events.userDisconnected, {user:data.user});
        })).on(scEvents.receiveOffer, proxy(onIncomingConnection)).on(scEvents.receiveBye, proxy(onReceiveBye)).on(scEvents.receiveAnswer, function(data) {
          if (!data.senderId || !data.connectionId) {
            return;
          }
          var sender = getUserById(data.senderId);
          if (sender) {
            var targetHcObject = handshakeControllerObjects[data.connectionId];
            if (targetHcObject) {
              if (targetHcObject.userId === sender.id) {
                self.trigger(xrtc.Room.events.connectionAccepted, {user:sender, connection:getConnectionById(data.connectionId), data:data.acceptData});
                targetHcObject.hc.trigger(hcEvents.receiveAnswer, {connectionId:data.connectionId, answer:data.answer});
              }
            } else {
              serverConnector.sendBye(data.senderId, data.connectionId, {type:byeTypes.decline, data:"Remote connection not found."});
            }
          }
        }).on(scEvents.receiveIce, function(data) {
          if (!data.senderId || !data.connectionId) {
            return;
          }
          var targetHcObject = handshakeControllerObjects[data.connectionId];
          if (targetHcObject && targetHcObject.userId === data.senderId) {
            targetHcObject.hc.trigger(hcEvents.receiveIce, {iceCandidate:data.iceCandidate, connectionId:data.connectionId});
          }
        });
        isServerConnectorSubscribed = true;
      }
    }
    function unsubscribeFromServerEvents() {
      if (isServerConnectorSubscribed) {
        serverConnector.off(scEvents.connectionOpen).off(scEvents.connectionClose).off(scEvents.tokenInvalid).off(scEvents.usersUpdated).off(scEvents.userConnected).off(scEvents.userDisconnected).off(scEvents.receiveOffer).off(scEvents.receiveBye).off(scEvents.receiveAnswer).off(scEvents.receiveIce);
        isServerConnectorSubscribed = false;
      }
    }
    function sortUsers() {
      users.sort(compareUsers);
    }
    function onIncomingConnection(data) {
      if (!data.senderId || !data.connectionId) {
        return;
      }
      var self = this;
      var incomingConnectionData = {user:getUserById(data.senderId), connectionId:data.connectionId, data:data.connectionData};
      if (!roomOptions.autoReply) {
        incomingConnectionData.accept = proxy(onAcceptCall);
        incomingConnectionData.decline = proxy(onDeclineCall);
      }
      handshakeControllerObjects[data.connectionId] = {userId:data.senderId, hc:null};
      this.trigger(xrtc.Room.events.incomingConnection, incomingConnectionData);
      if (roomOptions.autoReply) {
        onAcceptCall.call(self);
      }
      function onAcceptCall(acceptData) {
        createConnection.call(self, data.connectionId, currentUserData, getUserById(data.senderId), data.connectionData, function(connectionData) {
          var offerData = {offer:data.offer, iceServers:data.iceServers, connectionType:data.connectionType, connectionId:data.connectionId, connectionData:data.connectionData, acceptData:acceptData};
          connectionData.handshakeController.trigger(hcEvents.receiveOffer, offerData);
        });
      }
      function onDeclineCall(declineData) {
        serverConnector.sendBye(data.senderId, data.connectionId, {type:byeTypes.decline, data:declineData});
      }
    }
    function onReceiveBye(data) {
      if (!data.senderId || !data.connectionId) {
        return;
      }
      var sender = getUserById(data.senderId);
      if (sender) {
        var targetHcObject = handshakeControllerObjects[data.connectionId];
        if (targetHcObject) {
          if (targetHcObject.userId === sender.id) {
            if (data.byeData && data.byeData.type === byeTypes.decline || !targetHcObject.hc) {
              var declinedConnection = getConnectionById(data.connectionId);
              if (declinedConnection) {
                this.trigger(xrtc.Room.events.connectionDeclined, {user:sender, connection:declinedConnection, data:data.byeData});
              }
            }
            if (targetHcObject.hc) {
              targetHcObject.hc.trigger(hcEvents.receiveBye);
            }
          }
        }
      }
    }
    function createConnection(connectionId, userData, targetUser, connectionData, connectionCreated) {
      var self = this;
      var hc = new xrtc.HandshakeController;
      var connection = new xRtc.Connection(connectionId, userData, targetUser, hc, authManager, connectionData);
      if (!handshakeControllerObjects[connectionId]) {
        handshakeControllerObjects[connectionId] = {userId:targetUser.id, hc:hc};
      } else {
        handshakeControllerObjects[connectionId].hc = hc;
      }
      hc.on(hcEvents.sendOffer, proxy(function(tUserId, connId, data) {
        serverConnector.sendOffer(tUserId, connId, data);
      })).on(hcEvents.sendAnswer, proxy(function(tUserId, connId, data) {
        serverConnector.sendAnswer(tUserId, connId, data);
      })).on(hcEvents.sendIce, proxy(function(tUserId, connId, data) {
        serverConnector.sendIce(tUserId, connId, data);
      })).on(hcEvents.sendBye, proxy(function(tUserId, connId, data) {
        serverConnector.sendBye(tUserId, connId, data);
      }));
      connection.on(xrtc.Connection.events.connectionClosed, function() {
        connections.splice(getConnectionIndexById(connections, connectionId), 1);
        delete handshakeControllerObjects[connectionId];
      });
      connections.push(connection);
      self.trigger(xrtc.Room.events.connectionCreated, {user:targetUser, connection:connection});
      if (typeof connectionCreated === "function") {
        connectionCreated({connection:connection, handshakeController:hc});
      }
    }
    function compareUsers(p1, p2) {
      var result = 0;
      if (p1.name < p2.name) {
        result = -1;
      } else {
        if (p1.name > p2.name) {
          result = 1;
        }
      }
      return result;
    }
    function getUserById(userId) {
      var user = null;
      for (var i = 0, len = users.length;i < len;i++) {
        if (users[i].id === userId) {
          user = users[i];
          break;
        }
      }
      return user;
    }
    function getConnectionById(connectionId) {
      var connection = null;
      for (var i = 0, len = connections.length;i < len;i++) {
        if (connections[i].getId() === connectionId) {
          connection = connections[i];
          break;
        }
      }
      return connection;
    }
    function getConnectionIndexById(connectionsArray, connectionId) {
      var resultIndex = -1;
      for (var i = 0, len = connectionsArray.length;i < len;i++) {
        if (connectionsArray[i].getId() === connectionId) {
          resultIndex = i;
          break;
        }
      }
      return resultIndex;
    }
    function getUserIndexById(usersArray, userId) {
      var resultIndex = -1;
      for (var i = 0, len = usersArray.length;i < len;i++) {
        if (usersArray[i].id === userId) {
          resultIndex = i;
        }
      }
      return resultIndex;
    }
  });
  xrtc.Room.extend({events:{enter:"enter", leave:"leave", incomingConnection:"incomingconnection", connectionCreated:"connectioncreated", connectionAccepted:"connectionaccepted", connectionDeclined:"connectiondeclined", usersUpdated:"usersupdated", userConnected:"userconnected", userDisconnected:"userdisconnected", tokenInvalid:"tokeninvalid", error:"error"}, settings:{info:{domain:exports.document.domain, application:"default", name:"default"}, enterOptions:{autoReply:true}}});
})(window);
goog.provide("xRtc.userMedia");
goog.require("xRtc.common");
goog.require("xRtc.commonError");
goog.require("xRtc.logger");
goog.require("xRtc.stream");
(function(exports) {
  if (typeof exports.xRtc === "undefined") {
    exports.xRtc = {};
  }
  var xrtc = exports.xRtc, webrtc = xrtc.webrtc, logger = new xrtc.Logger("UserMedia"), getUserMedia = function(options, successCallback, errorCallback) {
    webrtc.getUserMedia(options, onGetUserMediaSuccess, onGetUserMediaError);
    function onGetUserMediaSuccess(stream) {
      if (typeof successCallback === "function") {
        successCallback(new xrtc.Stream(stream));
      }
    }
    function onGetUserMediaError(err) {
      if (typeof errorCallback === "function") {
        errorCallback(err);
      }
    }
  };
  xrtc.getUserMedia = function(options, successCallback, errorCallback) {
    if (options && (!options.video && !options.audio)) {
      var error = new xrtc.CommonError("getUserMedia", "video or audio property of the options parameter should be specified. No sense to create media stream without video and audio components.");
      logger.error("onCreateOfferError", error);
    }
    var mediaOptions = options || {video:true, audio:true};
    if (mediaOptions.video && (mediaOptions.video.mandatory && mediaOptions.video.mandatory.mediaSource === "screen")) {
      getUserMedia.call(this, {video:{mandatory:{chromeMediaSource:"screen"}}}, function(screenSharingStream) {
        if (mediaOptions.audio) {
          getUserMedia.call(this, {audio:true}, function(audioStream) {
            function addTracks(array, tracks) {
              for (var i = 0;i < tracks.length;i++) {
                array.push(tracks[i]);
              }
            }
            var mediaStreamTracks = [];
            addTracks(mediaStreamTracks, audioStream.getAudioTracks());
            addTracks(mediaStreamTracks, screenSharingStream.getVideoTracks());
            successCallback(new webrtc.MediaStream(mediaStreamTracks));
          }, errorCallback);
        } else {
          successCallback(screenSharingStream);
        }
      }, errorCallback);
    } else {
      getUserMedia.call(this, mediaOptions, successCallback, errorCallback);
    }
  };
})(window);

