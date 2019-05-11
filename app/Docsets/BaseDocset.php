<?php

namespace App\Docsets;

use App\Contracts\Docset;
use Illuminate\Support\Collection;

abstract class BaseDocset implements Docset
{
    const CODE = self::CODE;
    const NAME = self::NAME;
    const URL = self::URL;
    const INDEX = self::INDEX;
    const PLAYGROUND = self::PLAYGROUND;
    const ICON_16 = self::ICON_16;
    const ICON_32 = self::ICON_32;
    const EXTERNAL_DOMAINS = self::EXTERNAL_DOMAINS;


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

    abstract public function entries(string $html): Collection;

    abstract public function format(string $html): string;
}
