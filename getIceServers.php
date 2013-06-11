<?php

//set POST variables
$url = 'http://localhost:8081/getIceServers';
$fields_string = '';
$fields = array(
	'domain' => $_POST["domain"],
	'application' => $_POST["application"],
	'username' => $_POST["username"],
	'ident' => urlencode("Lazarus404"),
	'secret' => urlencode("12345")
);

//url-ify the data for the POST
foreach($fields as $key=>$value) { $fields_string .= $key.'='.$value.'&'; }
rtrim($fields_string, '&');

//open connection
$ch = curl_init();

//set the url, number of POST vars, POST data
curl_setopt($ch,CURLOPT_URL, $url);
curl_setopt($ch,CURLOPT_POST, count($fields));
//curl_setopt($ch,CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch,CURLOPT_POSTFIELDS, $fields_string);

//execute post
$result = curl_exec($ch);

//close connection
curl_close($ch);

?>