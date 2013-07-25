<?php

//set POST variables
$url = 'https://beta.xirsys.com/getIceServers';
$fields_string = '';
$fields = array(
	'domain' => $_POST["domain"],
	'application' => $_POST["application"],
	'username' => $_POST["username"],
	'ident' => urlencode("leesylvester"),
	'secret' => urlencode("7b6ffc50-d9b9-11e2-bbde-45359b958022")
);

//url-ify the data for the POST
foreach($fields as $key=>$value) { $fields_string .= $key.'='.$value.'&'; }
rtrim($fields_string, '&');

//open connection
$ch = curl_init();

//set the url, number of POST vars, POST data
curl_setopt($ch,CURLOPT_URL, $url);
curl_setopt($ch,CURLOPT_POST, count($fields));
curl_setopt($ch,CURLOPT_POSTFIELDS, $fields_string);
curl_setopt($ch,CURLOPT_TIMEOUT, 0);
curl_setopt($ch,CURLOPT_CONNECTTIMEOUT, 0);

//execute post
$result = curl_exec($ch);

//close connection
curl_close($ch);

?>