<?php

namespace App\Contracts;

use Illuminate\Support\Collection;

interface Docset
{
    public function code(): string;

    public function name(): string;

    public function url(): string;

    public function playground(): string;

    public function icon16(): string;

    public function icon32(): string;

    public function entries(string $html): Collection;

    public function format(string $html): string;
}
