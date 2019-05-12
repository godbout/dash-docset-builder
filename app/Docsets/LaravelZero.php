<?php

namespace App\Docsets;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Wa72\HtmlPageDom\HtmlPageCrawler;

class LaravelZero extends BaseDocset
{
    const CODE = 'laravel-zero';
    const NAME = 'Laravel Zero';
    const URL = 'laravel-zero.com';
    const INDEX = 'introduction.html';
    const PLAYGROUND = '';
    const ICON_16 = '../icon.png';
    const ICON_32 = '../icon@2x.png';
    const EXTERNAL_DOMAINS = [
        'github.com',
        'raw.githubusercontent.com'
    ];

    public function entries(string $file): Collection
    {
        $crawler = HtmlPageCrawler::create(Storage::get($file));

        $entries = collect();
        $entries = $entries->merge($this->guideEntries($crawler));
        $entries = $entries->merge($this->sectionEntries($crawler));

        return $entries;
    }

    protected function guideEntries(HtmlPageCrawler $crawler)
    {
        $entries = collect();

        $crawler->filter('.lvl0, .lvl1')->each(function (HtmlPageCrawler $node) use ($entries) {
            if ($this->isRealPage(trim($node->text()))) {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Guide',
                    'path' => $node->attr('href')
                ]);
            }
        });

        return $entries;
    }

    protected function isRealPage($name)
    {
        return ! in_array($name, ['Usage', 'Add-ons']);
    }

    protected function sectionEntries(HtmlPageCrawler $crawler)
    {
        $entries = collect();

        $crawler->filter('.lvl1')->each(function (HtmlPageCrawler $node) use ($entries) {
            $entries->push([
                'name' => trim($node->text()),
                'type' => 'Section',
                'path' => $node->attr('href')
            ]);
        });

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        $this->removeHeader($crawler);
        $this->removeLeftSidebar($crawler);
        $this->removeFooter($crawler);
        $this->updateContainerWidth($crawler);
        $this->updateBottomPadding($crawler);
        $this->insertDashTableOfContents($crawler);

        return $crawler->saveHTML();
    }

    protected function removeHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body > header')->remove();
    }

    protected function removeLeftSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#js-nav-menu')->remove();
    }

    protected function removeFooter(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body > footer')->remove();
    }

    protected function updateContainerWidth(HtmlPageCrawler $crawler)
    {
        $crawler->filter('section.container > div > div')
            ->removeClass('lg:w-3/5')
            ->removeClass('lg:pl-4')
        ;

        $crawler->filter('section.container')
            ->removeClass('max-w-4xl')
            ->removeClass('md:px-8')
            ->removeClass('container')
        ;
    }

    protected function updateBottomPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('section > div > div')
            ->removeClass('pb-16')
        ;
    }

    protected function insertDashTableOfContents(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h1')
            ->after('<p><a name="//apple_ref/cpp/Section/Top" class="dashAnchor absolute" style="margin-top: -96px"></a></p>');

        $crawler->filter('h2')->each(function (HtmlPageCrawler $node) {
            $node->after(
                '<p><a name="//apple_ref/cpp/Section/' . $node->text() . '" class="dashAnchor absolute" style="margin-top: -84px"></a></p>'
            );
        });
    }
}
