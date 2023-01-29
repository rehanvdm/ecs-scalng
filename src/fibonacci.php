<?php
session_start();
echo "SESSION ID: " . session_id();
// Taken from: https://www.geeksforgeeks.org/php-fibonacci-series/
// PHP code to get the Fibonacci series
function Fibonacci($n){

    $num1 = 0;
    $num2 = 1;

    $counter = 0;
    while ($counter < $n)
    {
        //echo ' '.$num1;
        $num3 = $num2 + $num1;
        $num1 = $num2;
        $num2 = $num3;
        $counter = $counter + 1;

        md5('XXX'.$num1);
        //usleep(1);
    }
}

// Driver Code
$n = 1000000;
Fibonacci($n);
echo '<br>DONE';
?>

