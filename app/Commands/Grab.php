<?php

namespace App\Commands;

class Grab extends BaseCommand
{
    protected $signature = 'grab {doc}';
    protected $description = 'Download the doc specified as argument.';
}
