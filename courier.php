<?php

$origin="244901";

$pin=$_GET["pin"];
$weight=$_GET["weight"];
$mode=$_GET["mode"];

$token="f8620bed164a4e642ef837713aabe79d838135f5";

$service_url="https://track.delhivery.com/c/api/pin-codes/json/?filter_codes=$pin";

$rate_url="https://track.delhivery.com/api/kinko/v1/invoice/charges/.json?md=S&ss=Delivered&o_pin=$origin&d_pin=$pin&cgm=$weight&pt=$mode";

$ch=curl_init();

curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
curl_setopt($ch,CURLOPT_HTTPHEADER,["Authorization: Token $token"]);

curl_setopt($ch,CURLOPT_URL,$service_url);
$service=json_decode(curl_exec($ch),true);

curl_setopt($ch,CURLOPT_URL,$rate_url);
$rate=json_decode(curl_exec($ch),true);

curl_close($ch);

echo json_encode([
"service"=>$service,
"rate"=>$rate
]);

?>
