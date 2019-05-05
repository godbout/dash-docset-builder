<?php

namespace App\Docsets;

use App\Contracts\Docset;
use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;

class Dummy implements Docset
{
    const CODE = 'dummy';
    const NAME = 'Dummy';
    const URL = 'sleeplessmind.info';
    const PLAYGROUND = '';
    const ICON_16 = 'assets/favicons/favicon-16x16.png';
    const ICON_32 = 'assets/favicons/favicon-32x32.png';


    public function code(): string
    {
        return self::CODE;
    }

    public function name(): string
    {
        return self::NAME;
    }

    public function url(): string
    {
        return self::URL;
    }

    public function playground(): string
    {
        return self::PLAYGROUND;
    }

    public function icon16(): string
    {
        return self::ICON_16;
    }

    public function icon32(): string
    {
        return self::ICON_32;
    }

    public function entries(string $html): Collection
    {
        $entries = collect();

        $crawler = HtmlPageCrawler::create($html);

        $crawler->filter('a.nav-item')->each(function (HtmlPageCrawler $node) use ($entries) {
            $entries->push([
                'name' => $node->text(),
                'type' => 'Guide',
                'path' => $node->attr('href')
            ]);
        });

        return $entries;
    }

    public function format(string $html): string
    {
        return $html;
    }
}
