<?php

namespace App\Docsets;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Wa72\HtmlPageDom\HtmlPage;
use Wa72\HtmlPageDom\HtmlPageCrawler;

class LaravelZero extends BaseDocset
{
    public const CODE = 'laravel-zero';
    public const NAME = 'Laravel Zero';
    public const URL = 'laravel-zero.com';
    public const INDEX = 'docs/introduction/index.html';
    public const PLAYGROUND = '';
    public const ICON_16 = '../../icons/icon.png';
    public const ICON_32 = '../../icons/icon@2x.png';
    public const EXTERNAL_DOMAINS = [
        'raw.githubusercontent.com',
        'googleapis.com',
    ];

    public function entries(string $file): Collection
    {
        $crawler = HtmlPageCrawler::create(Storage::get($file));

        $entries = collect();
        $entries = $entries->merge($this->guideEntries($crawler, $file));
        $entries = $entries->merge($this->sectionEntries($crawler, $file));

        return $entries;
    }

    protected function guideEntries(HtmlPageCrawler $crawler, string $file)
    {
        $pageTitle = (new HtmlPage(Storage::get($file)))->getTitle();

        $entries = collect();

        if ($pageTitle === 'Laravel Zero | Introduction') {
            $crawler->filter('.lvl0, .lvl1')->each(function (HtmlPageCrawler $node) use ($entries) {
                if ($this->isRealPage(trim($node->text()))) {
                    $entries->push([
                        'name' => trim($node->text()),
                        'type' => 'Guide',
                        'path' => $this->url() . '/docs/introduction/' . $node->attr('href')
                    ]);
                }
            });
        }

        return $entries;
    }

    protected function isRealPage($name)
    {
        return ! in_array($name, ['Usage', 'Add-ons']);
    }

    protected function sectionEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        if (! $this->is404OrIndex($file)) {
            $crawler->filter('h2, h3, h4')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Section',
                    'path' => Str::after($file . '#' . Str::slug($node->text()), $this->innerDirectory()),
                ]);
            });
        }

        return $entries;
    }

    protected function is404OrIndex($file)
    {
        return Str::contains($file, "{$this->url()}/index.html")
            || Str::contains($file, "{$this->url()}/404/index.html");
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
        $this->removeUnwantedCSS($crawler);
        $this->removeUnwantedJavaScript($crawler);
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

    protected function removeUnwantedCSS(HtmlPageCrawler $crawler)
    {
        $crawler->filter('link[href*="docsearch.min.css"]')->remove();
    }

    protected function removeUnwantedJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('script[src*=docsearch]')->remove();
        $crawler->filter('script[src*=gtag]')->remove();
        $crawler->filterXPath("//script[text()[contains(.,'docsearch')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'gtag')]]")->remove();
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
