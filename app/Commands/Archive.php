<?php

namespace App\Commands;

class Archive extends BaseCommand
{
    protected $signature = 'archive {doc}';
    protected $description = 'Archive the doc specified as argument for Dash contribution.';

    public function handle()
    {
        return parent::handle();
    }
}
