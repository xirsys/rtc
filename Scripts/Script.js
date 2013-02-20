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

		var formData = $(this).serializeObject();
		
		// {iceServers: [{url: "stun: turn.influxis.com: 3478"}]}
		var data = {
			Type: "token_request",
			Authentication: "public",
			Authorization: null,
			Domain: formData.domain || "www.example.com",
			Application: formData.application || "test_app",
			Room: formData.room || "test_room",
			Ident: formData.name || "alex"
		};
		
		showMainWindow(data);
	});
	

	function showMainWindow (data) {
		alert(escape(JSON.stringify(data)));
		// todo: add code here
	};
});