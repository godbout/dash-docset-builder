<?php

include 'vendor/autoload.php';

echo <<<EOT

\e[1;33m### Grabbing (if needed) and packaging the rick-astley docset before running the tests ###


EOT;

if (! file_exists(__DIR__ . '/../storage/rick-astley')) {
    print passthru('php dash-docset grab rick-astley --ansi');
}

print passthru('php dash-docset package rick-astley --ansi');
