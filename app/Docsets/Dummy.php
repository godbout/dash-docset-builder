<?php

namespace App\Docsets;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Wa72\HtmlPageDom\HtmlPageCrawler;

class Dummy extends BaseDocset
{
    const CODE = 'dummy';
    const NAME = 'Dummy';
    const URL = 'sleeplessmind.info';
    const INDEX = 'index.html';
    const PLAYGROUND = '';
    const ICON_16 = 'favicon-16x16.png';
    const ICON_32 = 'favicon-32x32.png';
    const EXTERNAL_DOMAINS = [];

    public function entries(string $file): Collection
    {
        $entries = collect();

        $crawler = HtmlPageCrawler::create(Storage::get($file));

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
        $crawler = HtmlPageCrawler::create($html);

        $this->removeNavbar($crawler);

        return $crawler->saveHTML();
    }

    protected function removeNavbar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('.nav-item')->remove();
    }
}
