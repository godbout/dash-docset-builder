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

    public function code(): string
    {
        return static::CODE;
    }

    public function name(): string
    {
        return static::NAME;
    }

    public function url(): string
    {
        return static::URL;
    }

    public function index(): string
    {
        return static::INDEX;
    }

    public function playground(): string
    {
        return static::PLAYGROUND;
    }

    public function icon16(): string
    {
        return static::ICON_16;
    }

    public function icon32(): string
    {
        return static::ICON_32;
    }

    abstract public function entries(string $html): Collection;

    abstract public function format(string $html): string;
}
