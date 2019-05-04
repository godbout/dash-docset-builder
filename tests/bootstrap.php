<?php

include 'vendor/autoload.php';

echo <<<EOT

\e[1;33m### Grabbing and packaging a docset once before all tests ###


EOT;

print passthru('php dash-docset grab tailwindcss --ansi');
print passthru('php dash-docset package tailwindcss --ansi');
