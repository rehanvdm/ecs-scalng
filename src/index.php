<?php
session_start();


echo implode('<br>', [
    'SESSION ID:' . session_id(),
    'SERVER_NAME:'.$_SERVER['SERVER_NAME'],
    'SERVER_ADDR:'.$_SERVER['SERVER_ADDR']
]);







?>