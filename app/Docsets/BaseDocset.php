<?php

namespace App\Docsets;

use App\Contracts\Docset;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

abstract class BaseDocset implements Docset
{
    public const CODE = self::CODE;
    public const NAME = self::NAME;
    public const URL = self::URL;
    public const INDEX = self::INDEX;
    public const PLAYGROUND = self::PLAYGROUND;
    public const ICON_16 = self::ICON_16;
    public const ICON_32 = self::ICON_32;
    public const EXTERNAL_DOMAINS = self::EXTERNAL_DOMAINS;


    final public function code(): string
    {
        return static::CODE;
    }

    final public function name(): string
    {
        return static::NAME;
    }

    final public function url(): string
    {
        return static::URL;
    }

    final public function index(): string
    {
        return static::INDEX;
    }

    final public function playground(): string
    {
        return static::PLAYGROUND;
    }

    final public function icon16(): string
    {
        return static::ICON_16;
    }

    final public function icon32(): string
    {
        return static::ICON_32;
    }

    final public function externalDomains(): string
    {
        return implode(
            ',',
            array_merge((array) static::URL, (array) static::EXTERNAL_DOMAINS)
        );
    }

    final public function file(): string
    {
        return static::CODE . '/' . static::CODE . '.docset';
    }

    final public function innerDirectory(): string
    {
        return self::file() . '/Contents/Resources/Documents';
    }

    final public function innerIndex(): string
    {
        return self::innerDirectory() . '/' . static::INDEX;
    }

    final public function downloadedDirectory(): string
    {
        return static::CODE . '/docs/' . static::URL;
    }

    final public function downloadedIndex(): string
    {
        return self::downloadedDirectory() . '/' . static::INDEX;
    }

    final public function infoPlistFile(): string
    {
        return self::file() . '/Contents/Info.plist';
    }

    final public function databaseFile(): string
    {
        return self::file() . '/Contents/Resources/docSet.dsidx';
    }

    final public function htmlFiles(): Collection
    {
        $files = Storage::allFiles(
            self::innerDirectory()
        );

        return collect($files)->reject(static function ($file) {
            return substr($file, -5) !== '.html';
        });
    }

    abstract public function entries(string $html): Collection;

    abstract public function format(string $html): string;
}
