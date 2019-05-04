<?php

namespace App\Commands;

class Grab extends BaseCommand
{
    protected $signature = 'grab {doc}';

    protected $description = 'Download the doc specified as argument.';


    public function handle()
    {
        return parent::fire('grab', $this->argument('doc'));
    }
}
