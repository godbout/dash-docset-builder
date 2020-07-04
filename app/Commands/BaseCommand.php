<?php

namespace Godbout\DashDocsetBuilder\Commands;

use Godbout\DashDocsetBuilder\Services\DocsetBuilder;
use Illuminate\Support\Str;
use LaravelZero\Framework\Commands\Command;

abstract class BaseCommand extends Command
{
    public function handle()
    {
        $docset = $this->requestedDocset();
        $action = $this->requestedAction();

        if ($action === 'new') {
            $this->info('New docset class started');
            (new DocsetBuilder(null, $this))->new();
            $this->info('New docset class finished');

            return;
        }

        if ($this->isSupported()) {
            $this->info(Str::ucfirst("$action started"));
            (new DocsetBuilder(new $docset(), $this))->$action();
            $this->info(Str::ucfirst("$action finished"));

            return;
        }

        $this->warn('The doc requested does not seem to be supported.');

        return 1;
    }

    protected function requestedDocset()
    {
        $classBasename = Str::studly($this->argument('doc'));

        return class_exists("App\\Docsets\\$classBasename")
            ? "App\\Docsets\\$classBasename"
            : "Godbout\\DashDocsetBuilder\\Docsets\\$classBasename";
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
