<?php

namespace App\Docsets;

use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class LaravelZero extends BaseDocset
{
    public const CODE = 'laravel-zero';
    public const NAME = 'Laravel Zero';
    public const URL = 'laravel-zero.com';
    public const INDEX = 'introduction.html';
    public const PLAYGROUND = '';
    public const ICON_16 = '../icon.png';
    public const ICON_32 = '../icon@2x.png';
    public const EXTERNAL_DOMAINS = [
        'github.com',
        'raw.githubusercontent.com'
    ];

    public function entries(string $file): Collection
    {
        $crawler = HtmlPageCrawler::create(Storage::get($file));

        $entries = collect();
        $entries = $entries->merge($this->guideEntries($crawler));
        $entries = $entries->merge($this->sectionEntries($crawler, $file));

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

    protected function sectionEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        $h1 = $crawler->filter('h1')->last();

        $crawler->filter('h2, h3, h4')->each(static function (HtmlPageCrawler $node) use ($entries, $file, $h1) {
            $fileBasename = basename($file);

            if (! in_array($fileBasename, ['index.html', '404.html'])) {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Section',
                    'path' => basename($file) . '#' . Str::slug($node->text())
                ]);
            }
        });

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        $this->removeHeader($crawler);
        $this->removeLeftSidebar($crawler);
        $this->removeFooter($crawler);
        $this->updateTopPadding($crawler);
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

    protected function updateTopPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h1')
            ->css('margin-top', '1rem')
        ;
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
            ->before('<a name="//apple_ref/cpp/Section/Top" class="dashAnchor"></a>');

        $crawler->filter('h2, h3, h4')->each(static function (HtmlPageCrawler $node) {
            $node->before(
                '<a id="' . Str::slug($node->text()) . '" name="//apple_ref/cpp/Section/' . rawurlencode($node->text()) . '" class="dashAnchor"></a>'
            );
        });
    }
}
