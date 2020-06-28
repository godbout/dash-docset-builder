<?php

namespace Godbout\DashDocsetBuilder\Contracts;

use Illuminate\Support\Collection;

interface Docset
{
    public function code(): string;

    public function name(): string;

    public function url(): string;

    public function index(): string;

    public function playground(): string;

    public function icon16(): string;

    public function icon32(): string;

    public function externalDomains(): string;

    public function file(): string;

    public function innerDirectory(): string;

    public function innerIndex(): string;

    public function downloadedDirectory(): string;

    public function downloadedIndex(): string;

    public function infoPlistFile(): string;

    public function databaseFile(): string;

    public function htmlFiles(): Collection;

    public function entries(string $file): Collection;

    public function format(string $file): string;
}
