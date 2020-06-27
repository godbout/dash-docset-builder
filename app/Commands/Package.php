<?php

namespace Godbout\DashDocsetBuilder\Commands;

class Package extends BaseCommand
{
    protected $signature = 'package {doc}';
    protected $description = 'Package the doc specified as argument as a Dash docset file';
}
