<?php

namespace App\Commands;

use Illuminate\Support\Str;
use App\Services\DocsetBuilder;
use LaravelZero\Framework\Commands\Command;

abstract class BaseCommand extends Command
{
    public function fire($action, $doc)
    {
        $docset = "App\\Docsets\\$doc";

        if (class_exists($docset)) {
            $this->info(Str::ucfirst("$action started"));
            (new DocsetBuilder)->$action(new $docset, $this);
            $this->info(Str::ucfirst("$action finished"));

            return;
        }

        $this->warn('The doc requested does not seem to be supported.');

        return 1;
    }
}
