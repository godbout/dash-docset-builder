<?php

namespace App\Commands;

use Illuminate\Support\Str;
use App\Services\DocsetBuilder;
use LaravelZero\Framework\Commands\Command;

abstract class BaseCommand extends Command
{
    public function handle()
    {
        $docset = $this->requestedDocset();
        $action = $this->requestedAction();

        if ($this->isSupported($docset)) {
            $this->info(Str::ucfirst("$action started"));
            (new DocsetBuilder(new $docset, $this))->$action();
            $this->info(Str::ucfirst("$action finished"));

            return;
        }

        $this->warn('The doc requested does not seem to be supported.');

        return 1;
    }

    protected function requestedDocset()
    {
        $classBasename = Str::camel($this->argument('doc'));

        return "App\\Docsets\\$classBasename";
    }

    protected function requestedAction()
    {
        return $this->getName();
    }

    protected function isSupported()
    {
        return class_exists($this->requestedDocset());
    }
}
