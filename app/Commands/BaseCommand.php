<?php

namespace App\Commands;

use Illuminate\Console\Scheduling\Schedule;
use LaravelZero\Framework\Commands\Command;

abstract class BaseCommand extends Command
{
    const DOCS = [
        'tailwindcss' => [
            'code' => 'tailwindcss',
            'name' => 'Tailwind CSS',
            'url' => 'next.tailwindcss.com',
            'playground' => 'https://codepen.io/drehimself/pen/vpeVMx'
        ]
    ];

    protected function isValid($doc)
    {
        return array_key_exists($doc, self::DOCS);
    }
}
