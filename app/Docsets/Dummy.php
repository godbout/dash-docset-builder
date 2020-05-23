<?php

namespace App\Docsets;

use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class Dummy extends BaseDocset
{
    public const CODE = 'dummy';
    public const NAME = 'Dummy';
    public const URL = 'glmb.today';
    public const INDEX = 'index.html';
    public const PLAYGROUND = '';
    public const ICON_16 = 'assets/favicons/favicon-16x16.png';
    public const ICON_32 = 'assets/favicons/favicon-32x32.png';
    public const EXTERNAL_DOMAINS = [];


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
