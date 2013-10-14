// #### Version 1.3.0 ####

// `xRtc.Connection` is one of the main objects of **xRtc** library. This object can not be created manually.
// For the creation of connection need to use `xRtc.Room` object.
// The main goal of this object is handling real p2p connection.

'use strict';

(function (exports) {
	var xrtc = exports.xRtc,
		internal = {},
		webrtc = xrtc.webrtc;

	// `IceCandidateFilter` is internal object of `xRtc.Connection`. The object contains functionality which helps to filter webrtc ice candidates in case if `server` or `direct` connection is required.
	xrtc.Class(internal, 'IceCandidateFilter', function IceCandidateFilter(type, is) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			connectionType = type || xrtc.Connection.connectionTypes.default,
			iceServers = is && is.iceServers || null,
			ipRegexp = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g;

		xrtc.Class.extend(this, {
			// Returns type of the current connection.
			getType: function () {
				return connectionType;
			},

			// Returns boolean value which means `ice` corresponds current connection type or not.
			isAllowed: function (ice) {
				var result = true;

				switch (connectionType) {
					case xrtc.Connection.connectionTypes.direct:
						result = iceCandidatesFilters.local(ice) || iceCandidatesFilters.stun(ice);
						break;
					case xrtc.Connection.connectionTypes.server:
						if (iceCandidatesFilters.stun(ice)) {
							iceCandidateConverters.stun2turn(ice);
						} else if (iceCandidatesFilters.turn(ice)) {
							iceCandidateConverters.turn2turn(ice);
						} else {
							result = false;
						}
						break;
					default:
						break;
				}

				return result;
			},

			// Returns `sdp` which corrected accordingly current connection type.
			// **Note:** FireFox `offer` and `answer` contains all ice candidates which should be deleted if connection type is `server` (equals `xrtc.Connection.connectionTypes.server`).
			filterSDP: function (sdp) {
				var changedSdp = sdp;
				if (connectionType === xrtc.Connection.connectionTypes.server) {
					// This regex removes from `sdp` all direct p2p `host` and STUN `srflx` ice candidates from the `sdp`.
					changedSdp = sdp.replace(/a=candidate:.*((typ host)|(typ srflx)).*\r\n/g, "");
				} else if (connectionType === xrtc.Connection.connectionTypes.direct) {
					// This regex removes from `sdp` all TURN `relay` ice candidates from the `sdp`.
					changedSdp = sdp.replace(/a=candidate:.*typ relay.*\r\n/g, "");
				}

				return changedSdp;
			}
		});

		// Internal candidate filters.
		var iceCandidatesFilters = {
			// Returns function which filters direct p2p `host` ice candidates.
			local: function (iceCandidate) {
				var regexp = /typ host/;

				return filterIceCandidate(iceCandidate, regexp);
			},

			// Returns function which filters STUN `srflx` ice candidates.
			stun: function (iceCandidate) {
				var regexp = /typ srflx/;

				return filterIceCandidate(iceCandidate, regexp);
			},

			// Returns function which filters TURN `relay` ice candidates.
			turn: function (iceCandidate) {
				var regexp = /typ relay/;

				return filterIceCandidate(iceCandidate, regexp);
			}
		};

		function filterIceCandidate(iceCandidate, regexp) {
			return regexp.test(iceCandidate.candidate);
		}

		// **Todo:** My be bug. Need to fix it because at the current moment 2 types of presentation TURN server exists. One of them doesn't contain `@`.
		// Returns IP address of the TURN server which stores in the local variable `iceServers`.
		function getTurnIp() {
			if (iceServers) {
				for (var i = 0; i < iceServers.length; i++) {
					var server = iceServers[i];
					if ('credential' in server) {
						return server.url.split('@')[1];
					}

				}
			}
			return null;
		}

		// Internal ice candidate converters which can convert one ice candidates to another. Sometimes browser check connection with STUN and doesn't generate TURN ice candidates. In this case we create own TURN ice candidates using STUN ice candidates.
		var iceCandidateConverters = {
			// **Todo:** Need to clarify/test existence of this method.
			turn2turn: function (iceCandidate) {
				iceCandidate.candidate = iceCandidate.candidate.replace(ipRegexp, iceCandidate.candidate.match(ipRegexp)[0]);
			},

			// Creates TURN ice candidate using STUN ice candidate.
			stun2turn: function (iceCandidate) {
				var turnIp = getTurnIp();
				if (turnIp) {
					iceCandidate.candidate = iceCandidate.candidate.replace(ipRegexp, turnIp);
				} else {
					//**Todo:** Is it right?
					iceCandidateConverters.turn2turn(iceCandidate);
				}
			}
		};
	});

	// **Todo:** Need to optimize the constructor sugnature of Connection object.
	// It is internal constructor . The `xRtc.Room` object uses this constructor for creation connections objects.
	xrtc.Class(xrtc, 'Connection', function Connection(ud, targetId, hc, am, data) {
		var proxy = xrtc.Class.proxy(this),
			logger = new xrtc.Logger(this.className),
			userData = ud,
			authManager = am || new xRtc.AuthManager(),
			remoteUserId = targetId,
			remoteConnectionId = null,
			localStreams = [],
			remoteStreams = [],
			dataChannels = [],
			dataChannelNames = [],
			peerConnection = null,
			checkConnectionStateIntervalId = null,
			handshakeController = hc,
			iceFilter = null,
			iceServers = null,
			// This field is used to determine whether the coonection was accepted and need to send ice candidates to remote application.
			connectionEstablished = false,
			// It is tempoprary storage of ice candidates.
			// Ice candidates should be send to remote participant after receiving `answer` strictly.
			// If the application will send ice candidates after `offer` sending then it can be skipped by remote application
			// because there is no guarantee of connection establishing and while the application/user will be thinking
			// about accept/decline incoming connection these ice candidates reach it and will be skipped,
			// because the remote peerConnection still not created.
			iceCandidates = [],
			connectionId = generateGuid(),
			// Internal user data conainer. The data helps to identify the connection and differ the connection from other connections.
			connectionData = data,
			connectionIsOpened = false;

		subscribeToHandshakeControllerEvents.call(this);

		xrtc.Class.extend(this, xrtc.EventDispatcher, {
			_logger: logger,

			getId: function () {
				return connectionId;
			},

			// It is internal method. It should not be used manually.
			_open: function (options) {
				connectionIsOpened = true;

				var self = this,
					offerOptions = {};

				// offerOptions field initialization.
				xrtc.Class.extend(offerOptions, xrtc.Connection.settings.offerOptions);
				if (options && options.offer) {
					xrtc.Class.extend(offerOptions, options.offer);
				}

				self.trigger(xrtc.Connection.events.connectionOpening, { sender: self, userId: remoteUserId });

				initPeerConnection.call(self, remoteUserId, function () {
					iceFilter = new internal.IceCandidateFilter(options && options.connectionType || null, iceServers);

					peerConnection.createOffer(proxy(onCreateOfferSuccess), proxy(onCreateOfferError), offerOptions);

					function onCreateOfferSuccess(offer) {
						if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
							offer.sdp = iceFilter.filterSDP(offer.sdp);
						}

						logger.debug('onCreateOfferSuccess', offer);
						peerConnection.setLocalDescription(offer);

						// This magis is required for interoperability support of FF21 and Chrome.
						if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion <= 21) {
							var inline = 'a=crypto:1 AES_CM_128_HMAC_SHA1_80 inline:FakeFakeFakeFakeFakeFakeFakeFakeFakeFake\r\nc=IN';
							offer.sdp = offer.sdp.indexOf('a=crypto') == -1 ? offer.sdp.replace(/c=IN/g, inline) : offer.sdp;
						}

						var request = {
							offer: JSON.stringify(offer),
							connectionData: connectionData,
							connectionType: iceFilter.getType(),
							iceServers: iceServers
						};

						logger.debug('sendOffer', remoteUserId, offer);
						handshakeController.sendOffer(remoteUserId, remoteConnectionId, connectionId, request);
						self.trigger(xrtc.Connection.events.offerSent, { userId: remoteUserId, offerData: request });
					}

					function onCreateOfferError(err) {
						var error = new xrtc.CommonError('startSession', "Cannot create WebRTC offer", err);

						logger.error('onCreateOfferError', error);
						self.trigger(xrtc.Connection.events.createOfferError, error);
					}
				});
			},

			// **[Public API]:** It is public method of `connection` object. This method should be used for closing the `connection`.
			close: function () {
				if (handshakeController && remoteUserId && remoteConnectionId) {
					handshakeController.sendBye(remoteUserId, remoteConnectionId, connectionId);
				}

				closePeerConnection.call(this);
			},

			// **[Public API]:** It is public method of `connection` object. This method should be used for adding `xRtc.Stream` to the `connection`.
			// It is required if you want to transmit the `stream` to remote user. The `xRtc.Stream` can be obtained using `xRtc.getUserMedia` method.
			// One `connection` can be used for transfering some streams to remote side.
			// After execution this method `localstreamadded` (`xrtc.Connection.events.localStreamAdded`) event of connection object will be fired.
			addStream: function (xrtcStream) {
				if (connectionIsOpened) {
					throwExceptionOfWrongmethodCall('addStream');
				}

				localStreams.push(xrtcStream);

				var streamData = {
					stream: xrtcStream,
					userId: userData.name
				};

				logger.debug('addLocalStream', streamData);
				this.trigger(xrtc.Connection.events.localStreamAdded, streamData);
			},

			// **[Public API]:** It is public method of `connection` object. This method should be used for creating `xRtc.DataChannel` for the `connection`.
			// Names of the data channels should be unique in context of any `connection`.
			// **Note: ** This method can be used only on `connectionCreated` (`xRtc.Room.events.connectionCreated`) event of the `xRtc.Room` object otherwise exception will be thrown.
			createDataChannel: function (name) {
				if (connectionIsOpened) {
					throwExceptionOfWrongmethodCall('createDataChannel');
				}

				dataChannelNames.push(name);
			},

			// **[Public API]:** It is public method of `connection` object. This method should be used for accessing 'specific user data' of the connection.
			// User/Developer can pass any data to the 'connection' in the `xRtc.Room.connect()' method. E.g. This functionality will be useful
			// if need to differ one connection from another because 'xRtc.Room' creates connections asynchronously.
			// Also it will be useful if you want to store some data which related with concrete 'connection' object.
			getData: function () {
				return connectionData;
			},

			//**[Public API]:** It is public method of `connection` object. Returns state of the `connection`.
			// List of possibly connection states:

			//*   'ready'
			//*   'not-ready'
			//*   'connecting'
			//*   'disconnecting'
			//*   'connected'

			//**Todo:** Need to revise all states.
			getState: function () {
				return getSignalingState.call(this);
			},

			//**[Public API]:** It is public method of `connection` object. Returns `xRtc.Stream[]` object where each stream is `stream` which was added by `addStream` public method. For the most cases this `array` will be contain only one stream.
			getLocalStreams: function () {
				// Return the copy of internal array.
				return localStreams.map(function (stream) {
					return stream;
				});
			},

			//**[Public API]:** It is public method of `connection` object. Returns `xRtc.Stream[]` object where each stream is `stream` which tranferred from the remote side.
			//**Note:** Each remote `xRtc.Stream` creates asynchronously on `remotestreamadded` (xrtc.Room.events.remoteStreamAdded) event and will be accessible in this array after mentioned event only.
			getRemoteStreams: function () {
				// Return the copy of internal array.
				return remoteStreams.map(function (stream) {
					return stream;
				});
			},

			//**[Public API]:** It is public method of `connection` object. Returns `xRtc.DataChannel[]` object where each channel is `channel`which was created using `createDataChannel` public method.
			//**Note:** Each `xRtc.DataChannel` creates asynchronously on `datachannelcreated` (`xrtc.Room.events.dataChannelCreated`) event and will be accessible in this array after mentioned event only.
			getDataChannels: function () {
				// Return the copy of internal array.
				return dataChannels.map(function (channel) {
					return channel;
				});
			},
		});

		// Internal helper method which throws appropriate exception in case when someone try to call `addStream` or `createDataChannel` methods at inappropriate time.
		function throwExceptionOfWrongmethodCall(methodName) {
			var error = new xrtc.CommonError(methodName, "The method can be called on '" +
				xrtc.Room.events.connectionCreated +
				"' event of the xRtc.Room. Use xRtc.Room.events.connectionCreated for access the event name.");
			logger.error(methodName, error);
		}

		// Internal method which helps to subscribe to all events of `handshakeController` object where `handshakeController` is internal object and bridge between `xRtc.Connection` and `xRtc.Room`.
		function subscribeToHandshakeControllerEvents() {
			var hcEvents = xrtc.HandshakeController.events;
			handshakeController
				.on(hcEvents.receiveIce, proxy(onReceiveIce))
				.on(hcEvents.receiveOffer, proxy(onReceiveOffer))
				.on(hcEvents.receiveAnswer, proxy(onReceiveAnswer))
				.on(hcEvents.receiveBye, proxy(onReceiveBye));
		}

		// Internal method which used for initialization of internal `peerConnection`. During execution of this method following async request will be performed:

		//*   Async ajax request to sever side for the `Token`.
		//*   Async ajax request to the sever side for the ice severs collection.
		function initPeerConnection(userId, callback) {
			remoteUserId = userId;

			if (!peerConnection) {
				getIceServers.call(this, proxy(onIceServersGot));
			} else {
				callCallback();
			}

			//**Todo:** Need to think of this approach and refactor it.
			function callCallback() {
				if (typeof callback === "function") {
					try {
						callback();
					} catch (e) {
						// **Todo:** Check or not check?
					}
				}
			}

			// Internal helper method which used for creation browser compatible ice servers. ice server format depens on browser and browser version.
			// *Chrome 24-27* uses follwing format (example):

			// `[{"url":"stun:stun.l.google.com:19302"}, {url:"turn: userName@domain.com:3478",credential:"password"}]`

			// *FireFox 23+* (in context of TURN server) and *Chrome 28+* uses following format (example):

			// `[{"url":"stun:stun.l.google.com:19302"}, {"username":"user name","url":"turn:turn.domain.com","credential":"user password"}]`
			function createBrowserCompatibleIceServers(iceServersArray) {
				var browserCompatibleIceServers = [];
				// **Note:** The code regarding creation ice servers in appropriate format was copied from <https://apprtc.appspot.com/js/adapter.js> (official demo of the Google).

				// **Note:** *FF* < 23 (maybe < 24, need to check it) can't resolve IP by URL. As a result IP addresses should be used for ice servers. *FF* 24 doesn't have this problem. Checked.
				// Creates iceServer from the url for *FF*.
				var createFireFoxTurnServer = function (url, username, password) {
					var iceServer = null;
					var url_parts = url.split(':');
					if (url_parts[0].indexOf('stun') === 0) {
						// Create iceServer with stun url.
						iceServer = { 'url': url };
					} else if (url_parts[0].indexOf('turn') === 0 &&
							   (url.indexOf('transport=udp') !== -1 ||
								url.indexOf('?transport') === -1)) {
						// Create iceServer with turn url.
						// Ignore the transport parameter from TURN url.
						var turn_url_parts = url.split("?");
						iceServer = {
							'url': turn_url_parts[0],
							'credential': password,
							'username': username
						};
					}
					return iceServer;
				};

				// Creates iceServer from the url for Chrome.
				var createCromeTurnServer = function (url, username, password) {
					var iceServer = null;
					var url_parts = url.split(':');
					if (url_parts[0].indexOf('stun') === 0) {
						// Create iceServer with stun url.
						iceServer = { 'url': url };
					} else if (url_parts[0].indexOf('turn') === 0) {
						if (webrtc.detectedBrowserVersion < 28) {
							// For *pre-M28 Chrome* versions use old TURN format.
							var url_turn_parts = url.split("turn:");
							iceServer = {
								'url': 'turn:' + username + '@' + url_turn_parts[1],
								'credential': password
							};
						} else {
							// For *Chrome M28* & above use new TURN format.
							iceServer = {
								'url': url,
								'credential': password,
								'username': username
							};
						}
					}
					return iceServer;
				};

				var createBrowserCompatibleServer = function (iceServerData) {
					var resultIceServer;
					if (iceServerData.url.indexOf("turn:") === -1) {
						resultIceServer = iceServerData;
					} else {
						if (webrtc.detectedBrowser == webrtc.supportedBrowsers.chrome) {
							resultIceServer = createCromeTurnServer(iceServerData.url, iceServerData.username, iceServerData.credential);
						} else {
							resultIceServer = createFireFoxTurnServer(iceServerData.url, iceServerData.username, iceServerData.credential);
						}
					}

					return resultIceServer;
				};

				for (var i = 0, l = iceServersArray.length; i < l; i++) {
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

				peerConnection = new webrtc.RTCPeerConnection(
					browserCompatibleIceServers && browserCompatibleIceServers.length > 0 ? { iceServers: browserCompatibleIceServers } : null,
					xrtc.Connection.settings.peerConnectionOptions);
				logger.info('initPeerConnection', 'PeerConnection created.');

				// **Note:** *Firefox (FF 24 at least)* does not currently generate 'trickle candidates'. This means that it will include its
				// candidate addresses as 'c' lines in the `offer`/`answer`, and the onicecandidate callback will never be called.
				// The downside to this approach is that Firefox must wait for all of its candidates to be gathered before creating its `offer`/`answer`
				// (a process which can involve contacting STUN and TURN servers and waiting for either the responses or for the requests timeout).
				// <http://stackoverflow.com/questions/15484729/why-doesnt-onicecandidate-work>.
				peerConnection.onicecandidate = proxy(onIceCandidate);

				peerConnection.onstatechange = // M25-M26
					// *FF* 20.0.1 (*FF* 21+ works fine): during assigning `peerConnection.onsignalingstatechange` field *FF* throw following error:
					// NS_ERROR_XPC_CANT_MODIFY_PROP_ON_WN: Cannot modify properties of a WrappedNative
					peerConnection.onsignalingstatechange = // M27+, FF24+
					proxy(onConnectionStateChange);

				// In *FireFox* < 24 onstatechange or alternative event does not fire properly.
				if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox && webrtc.detectedBrowserVersion < 24) {
					var connectionState = this.getState();
					checkConnectionStateIntervalId = exports.setInterval(function () {
						var currentConnectionState = self.getState();
						if (currentConnectionState != connectionState) {
							logger.debug('setInterval -> xrtc.Connection.events.stateChanged', currentConnectionState);
							connectionState = currentConnectionState;
							self.trigger(xrtc.Connection.events.stateChanged, connectionState);
						}
					}, 500);
				}

				// **Todo:** Need to think about the necessity of this handlers.
				peerConnection.onicechange = // M25-M26
					//*FF 20.0.1* (FF 21+ works fine): during assigning peerConnection.oniceconnectionstatechange field *FF* throw following error: NS_ERROR_XPC_CANT_MODIFY_PROP_ON_WN: Cannot modify properties of a WrappedNative
					peerConnection.oniceconnectionstatechange = // M27+, FF24+
					proxy(onIceStateChange);

				peerConnection.ondatachannel = function (channelData) {
					var newDataChannel = new xrtc.DataChannel(channelData.channel, remoteUserId);
					dataChannels.push(newDataChannel);
					self.trigger(xrtc.Connection.events.dataChannelCreated, { channel: newDataChannel });
				};

				// *FF 19-20.0.1* (maybe earlier, *FF21* works fine): fire this event twice, for video stream and for audio stream despite the fact that one stream was added by remote side.
				// It is called any time a MediaStream is added by the remote peer. This will be fired only as a result of `setRemoteDescription`.
				peerConnection.onaddstream = proxy(onAddStream);

				// For *FF* only (Tested for *FF24*. Magic, sometimes works and sometimes not.)
				peerConnection.onclosedconnection = function (closeData/*temporary ignores*/) {
					logger.debug('peerConnection.onclosedconnection', closeData);
					closePeerConnection.call(self);
				};

				// **Todo:** Need to fire close connection event for *Chrome M26*. The logic should be based on `peerConnection.iceConnectionState` field and `window.setInterval`.
				// **Todo:** Need to fire close connection event for *Chrome M25*. The logic should be based on `peerConnection.iceState` field and `window.setInterval`.

				// peerConnection.iceGatheringState
				// W3C Editor's Draft 30 August 2013:
				// enum RTCIceGatheringState {
				//     "new",
				//     "gathering",
				//     "complete"
				// };

				function onIceCandidate(evt) {
					if (!!evt.candidate) {
						// In the original `RTCIceCandidate` class `candidate` property is immutable.
						var ice = JSON.parse(JSON.stringify(evt.candidate));

						if (iceFilter.isAllowed(ice)) {
							handleIceCandidate.call(this, ice);
						}
					}
				}

				function onConnectionStateChange(evt) {
					logger.debug('onConnectionStateChange', evt);
					this.trigger(xrtc.Connection.events.stateChanged, this.getState());
				}

				function onIceStateChange(evt) {
					var state = getIceState.call(this);

					if (state === 'connected') {
						// **Todo:** Need to think about name of this event.
						this.trigger(xrtc.Connection.events.connectionEstablished, { userId: remoteUserId });
					} else if (state === 'disconnected') {
						// **Todo:** The event should't be repeated for *FF 24+*, because *FF 18+* has peerConnection.onclosedconnection and *FF 24+* has peerConnection.oniceconnectionstatechange.
						closePeerConnection.call(this);
					}
				}

				function onAddStream(evt) {
					addRemoteStream.call(this, evt.stream);
				}

				// Add streams to native webrtc peerConnection which were added before.
				for (var i = 0, len = localStreams.length; i < len; i++) {
					peerConnection.addStream(localStreams[i].getStream());
				}

				// Create data channnels which were created(registered for creation) before.
				for (var i = 0, len = dataChannelNames.length; i < len; i++) {
					createDataChannel.call(this, dataChannelNames[i]);
				}

				callCallback();
			}
		}

		// Internal helper method which creates new instance of DataChannel by channel name.
		function createDataChannel(name) {
			var self = this;
			try {
				// *FF 19-21(and 18 maybe)*: Data channels should be created after connection establishment.
				// Connection should be established usually with audio and/or video.  For the time being,
				// always at least include a 'fake' audio stream - this will be fixed soon.
				// After connection establishment need to call `pc.connectDataConnection(5001, 5000);` on th each side.
				// For the two sides need to use inverted copies of the two numbers (e.g. `5000`, `5001` on one side, `5001`, `5000` on the other).
				// connectDataConnection is a temporary function that will soon disappear.
				// For more information see <https://hacks.mozilla.org/2012/11/progress-update-on-webrtc-for-firefox-on-desktop/>

				// As a result current library approach of data channels creation works only for *FF 22+*.
				// for earlier versions exception will be thrown: Component returned failure code:
				// 0x80004005 (NS_ERROR_FAILURE) [IPeerConnection.createDataChannel]" nsresult: "0x80004005 (NS_ERROR_FAILURE)"

				// Reliable channel is analogous to a TCP socket and unreliable channel is analogous to a UDP socket.
				// Reliable data channels currently supports only by *FF*. It is default value.
				// In *Chrome* reliable channels doesn't implemented yet: <https://code.google.com/p/webrtc/issues/detail?id=1430>
				var dc = peerConnection.createDataChannel(name, webrtc.detectedBrowser === webrtc.supportedBrowsers.chrome ? { reliable: false } : {});
				// **Todo:** Need to check, maybe `peerConnection.ondatachannel` fires not only for offer receiver but and for offer sender user. If so then firing of this event should be removed here.
				var newDataChannel = new xrtc.DataChannel(dc, remoteUserId);
				dataChannels.push(newDataChannel);
				self.trigger(xrtc.Connection.events.dataChannelCreated, { channel: newDataChannel });
			} catch (ex) {
				var error = new xrtc.CommonError('createDataChannel', "Can't create DataChannel.", ex);
				logger.error('createDataChannel', error);
				self.trigger(xrtc.Connection.events.dataChannelCreationError, { channelName: name, error: error });
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

			// Send already generated ice candidates.
			sendIceCandidates.call(this);
		}

		function sendIceCandidates() {
			for (var i = 0; i < iceCandidates.length; i++) {
				var iceCandidate = iceCandidates[i];

				handshakeController.sendIce(remoteUserId, remoteConnectionId, connectionId, JSON.stringify(iceCandidate));
				this.trigger(xrtc.Connection.events.iceSent, { iceCandidate: iceCandidate });
			}

			iceCandidates = [];
		}

		function addRemoteStream(stream) {
			var newXrtcStream = new xrtc.Stream(stream);
			remoteStreams.push(newXrtcStream);

			var streamData = {
				stream: newXrtcStream,
				userId: remoteUserId
			};

			logger.debug('addRemoteStream', streamData);

			this.trigger(xrtc.Connection.events.remoteStreamAdded, streamData);
		}

		function getIceServers(callback) {
			if (typeof callback === "function") {
				if (iceServers) {
					callback(iceServers);
				} else {
					authManager.getToken(userData, function (token) {
						authManager.getIceServers(token, userData, function (servers) {
							iceServers = servers;
							callback(iceServers);
						});
					});
				}
			}
		}

		function onReceiveIce(iceData) {
			logger.debug('Ice candidate was received.', iceData);
			var iceCandidate = new webrtc.RTCIceCandidate(JSON.parse(iceData.iceCandidate));
			peerConnection.addIceCandidate(iceCandidate);

			this.trigger(xrtc.Connection.events.iceAdded, { iceCandidate: iceCandidate });
		}

		function onReceiveOffer(offerData) {
			logger.debug('Offer was received.', offerData);

			iceServers = offerData.iceServers;
			remoteConnectionId = offerData.connectionId;

			initPeerConnection.call(this, remoteUserId, function () {
				logger.debug('receiveOffer', offerData);
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

					var request = {
						answer: JSON.stringify(answer)
					};

					logger.debug('sendAnswer', offerData, answer);
					handshakeController.sendAnswer(remoteUserId, remoteConnectionId, connectionId, request);

					this.trigger(xrtc.Connection.events.answerSent, { userId: remoteUserId, answerData: request });

					allowIceSending.call(this);
				}

				function onCreateAnswerError(err) {
					var error = new xrtc.CommonError('sendAnswer', "Cannot create WebRTC answer", err);

					logger.error('sendAnswer', error);
					this.trigger(xrtc.Connection.events.createAnswerError, error);
				}
			});
		}

		function onReceiveAnswer(answerData) {
			logger.debug('Answer was received.', answerData);

			remoteConnectionId = answerData.connectionId;

			allowIceSending.call(this);

			var sdp = JSON.parse(answerData.answer);
			var sessionDescription = new webrtc.RTCSessionDescription(sdp);
			peerConnection.setRemoteDescription(sessionDescription);
			this.trigger(xrtc.Connection.events.answerReceived, { userId: remoteConnectionId, answerData: { answer: sessionDescription } });
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

				var closeConnectionData = {
					sender: self,
					userId: remoteUserId
				};

				remoteUserId = null;

				this.trigger(xrtc.Connection.events.connectionClosed, closeConnectionData);
			}
		}

		function getIceState() {
			/* W3C Editor's Draft 30 August 2013:
			enum RTCIceConnectionState {
				"new",
				"checking",
				"connected",
				"completed",
				"failed",
				"disconnected",
				"closed"
			};
			*/

			var state = peerConnection
							&& (peerConnection.iceConnectionState // M26+
							|| peerConnection.iceState) // M25
						|| 'notinitialized';

			return state;
		}

		// **Todo:** Need to think about available states.
		function getSignalingState() {
			/* W3C Editor's Draft 30 August 2013:
			enum RTCSignalingState {
				"stable",
				"have-local-offer",
				"have-remote-offer",
				"have-local-pranswer",
				"have-remote-pranswer",
				"closed"
			};
			*/

			// **Warning:** It can change from version to version.
			var isLocalStreamAdded = localStreams.length > 0,
				states = {
					// **Todo:** Why not-ready if local stream is not added? What about situation when only text chat will be used?
					'notinitialized': isLocalStreamAdded ? 'ready' : 'not-ready',

					// *Chrome M25*.
					// **Todo:** Why not-ready if local stream is not added? What about situation when only text chat will be used?
					'new': isLocalStreamAdded ? 'ready' : 'not-ready',
					'opening': 'connecting',
					'active': 'connected',
					'closing': 'disconnecting',
					// **Todo:** Why not-ready if local stream is not added? What about situation when only text chat will be used?
					'closed': isLocalStreamAdded ? 'ready' : 'not-ready',

					// *Chrome M26+*.
					'stable': 'connected',
					'have-local-offer': 'ready',
					'have-remote-offer': 'connecting'
				},
				state = peerConnection
						&& (peerConnection.signalingState // M26+
						|| peerConnection.readyState) // M25-M26
					|| 'notinitialized';

			return states[state];
		}

		// *Todo:* Need to move this method to `xrtc.utils`.
		function generateGuid() {
			var guid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
				var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
				return v.toString(16);
			});
			return guid;
		};
	});

	xrtc.Connection.extend({
		// **Note:** Full list of events for the `xRtc.Connection` object.
		events: {
			localStreamAdded: 'localstreamadded',
			remoteStreamAdded: 'remotestreamadded',

			iceAdded: 'iceadded',
			iceSent: 'icesent',

			offerSent: 'offersent',
			createOfferError: 'createoffererror',

			answerSent: 'answersent',
			answerReceived: 'answerreceived',
			createAnswerError: 'createanswererror',

			dataChannelCreated: 'datachannelcreated',
			dataChannelCreationError: 'datachannelcreationerror',

			connectionOpening: 'connectionopening',
			connectionEstablished: 'connectionestablished',
			connectionClosed: 'connectionclosed',

			stateChanged: 'statechanged'
		},

		// Following connection types are supported by `xRtc` library:

		//*   `default`. It is mean standart mechanism of connection establishment. At first trying to establish direct p2p connection without STUN or TURN usage. If previous point is not possible then trying to establish STUN connection. If previous point is not possible then establish TURN connection.
		//*   `direct`. It is mean direct p2p or STUN connection establishment.
		//*   `server`. It is mean only TURN connection establishment.
		connectionTypes: {
			default: 'default',
			direct: 'direct',
			server: 'server'
		},

		settings: {
			offerOptions: {
				optional: [],
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true
				}
			},

			answerOptions: {
				optional: [],
				mandatory: {
					OfferToReceiveAudio: true,
					OfferToReceiveVideo: true
				}
			},

			// Interop Notes between *Chrome M25 and Firefox Nightly (version 21)*:
			// *Chrome* does not yet do DTLS-SRTP by default whereas *Firefox* only does DTLS-SRTP. In order to get interop,
			// you must supply Chrome with a PC constructor constraint to enable DTLS: `{ 'optional': [{'DtlsSrtpKeyAgreement': 'true'}]}`
			peerConnectionOptions: {
				optional: [{ RtpDataChannels: true }, { DtlsSrtpKeyAgreement: true }]
			}
		}
	});

	// Cross-browser support: New syntax of `getXXXStreams` method in *Chrome M26*.
	// For *FireFox 22* `webrtc.RTCPeerConnection.prototype` is undefined.
	if (webrtc.RTCPeerConnection.prototype && !webrtc.RTCPeerConnection.prototype.getLocalStreams) {
		xrtc.Class.extend(webrtc.RTCPeerConnection.prototype, {
			getLocalStreams: function () {
				return this.localStreams;
			},

			getRemoteStreams: function () {
				return this.remoteStreams;
			}
		});
	}

	// Cross-browser support: New syntax of `getXXXTracks` method in *Chrome M26*.
	if (!webrtc.MediaStream.prototype.getVideoTracks) {
		if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
			xrtc.Class.extend(webrtc.MediaStream.prototype, {
				getVideoTracks: function () {
					return [];
				},

				getAudioTracks: function () {
					return [];
				}
			});
		} else {
			xrtc.Class.extend(webrtc.MediaStream.prototype, {
				getVideoTracks: function () {
					return this.videoTracks;
				},

				getAudioTracks: function () {
					return this.audioTracks;
				}
			});
		}
	}

	// **Todo:** No need to disable data channels in case of communication between *FireFox* and *Firefox*. These flags are necessary in case of interoperability between *FireFox* and *Chrome* only.
	// Data channels does't supported in case of interoperability of *FireFox* and *Chrome*.
	/*if (webrtc.detectedBrowser === webrtc.supportedBrowsers.firefox) {
		// *Chrome M26b* and *Chrome Canary* with this settings fires an erron on the creation of offer/answer, but it is necessary for interoperablity between *FF* and *Chrome*.
		xrtc.Connection.settings.offerOptions.mandatory.MozDontOfferDataChannel = true;
		xrtc.Connection.settings.answerOptions.mandatory.MozDontOfferDataChannel = true;
	}*/
})(window);