<?php

namespace Godbout\DashDocsetBuilder\Commands;

class Neww extends BaseCommand
{
    protected $signature = 'new {doc?}';
    protected $description = 'Generate a Docset class for the doc specified as argument (surprise if no doc is provided)';
}
