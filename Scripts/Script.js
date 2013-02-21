$(document).ready(function() {
	$.fn.serializeObject = function() {
		var formArray = this.serializeArray(), formData = {};

		for (var i = 0, len = formArray.length; i < len; i++) {
			formData[formArray[i].name] = formArray[i].value;
		}

		return formData;
	};
	
	$('#form').on('submit', function(e) {
		e.preventDefault();

		var userData = $(this).serializeObject();
		
		
		joinRoom(userData);
	});


	$('#form').trigger('submit');

	function joinRoom(userData) {
		$('#step1, #step2').toggle();
		//alert(escape(JSON.stringify(data)));

		var handshake = new xRtc.HandshakeController();
		handshake.on(xRtc.HandshakeController.events.connectionOpen, function (e) {
			debugger;
			console.log(e);
		});


		var connection = new xRtc.Connection(userData, handshake);
		setInterval(function() {
			connection.connect();
		}, 15000);

		//$('#video .video:first video').show().get(0).src = 

	};
});

/*(function (exports) {
	exports.ChatViewModel = exports.xRtc.Class();

	exports.ChatViewModel.include();
})(window);*/