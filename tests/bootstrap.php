<?php

include 'vendor/autoload.php';

echo <<<EOT

\e[1;33m### Grabbing and packaging a dummy docset once before running all the tests ###


EOT;

print passthru('php dash-docset grab dummy --ansi');
print passthru('php dash-docset package dummy --ansi');
