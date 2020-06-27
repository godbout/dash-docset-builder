<?php

namespace Godbout\DashDocsetBuilder\Commands;

class Archive extends BaseCommand
{
    protected $signature = 'archive {doc}';
    protected $description = 'Archive the doc specified as argument for Dash contribution';
}
