<?php

namespace App\Docsets;

use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class Jigsaw extends BaseDocset
{
    public const CODE = 'jigsaw';
    public const NAME = 'Jigsaw';
    public const URL = 'jigsaw.tighten.co';
    public const INDEX = 'docs/installation/index.html';
    public const PLAYGROUND = '';
    public const ICON_16 = '../../icons/icon.png';
    public const ICON_32 = '../../icons/icon@2x.png';
    public const EXTERNAL_DOMAINS = [
        'googleapis.com',
        'typekit.net',
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
        $entries = collect();

        if (! Str::contains($file, "{$this->url()}/index.html")) {
            $crawler->filter('h2')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Guide',
                    'path' => Str::after($file . '#' . Str::slug($node->text()), $this->innerDirectory()),
                ]);
            });
        }

        return $entries;
    }

    protected function sectionEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        if (! Str::contains($file, "{$this->url()}/index.html")) {
            $crawler->filter('h3')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Section',
                    'path' => Str::after($file . '#' . Str::slug($node->text()), $this->innerDirectory()),
                ]);
            });
        }

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        $this->removeLeftSidebar($crawler);
        $this->removeRightSidebar($crawler);
        $this->removeHeader($crawler);
        $this->removeFooter($crawler);
        $this->updateTopPadding($crawler);
        $this->updateContainer($crawler);
        $this->updateTextSize($crawler);
        $this->updateH4Padding($crawler);
        $this->removeUnwantedCSS($crawler);
        $this->removeUnwantedJavaScript($crawler);
        $this->insertDashTableOfContents($crawler);

        return $crawler->saveHTML();
    }

    protected function removeLeftSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filterXPath('//main[@id="vue-app"]//navigation')->remove();
    }

    protected function removeRightSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filterXPath('//main[@id="vue-app"]//navigation-on-page')->remove();
    }

    protected function removeHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#vue-app > div:first-child')->remove();
        $crawler->filter('#vue-app > header')->remove();
    }

    protected function removeFooter(HtmlPageCrawler $crawler)
    {
        $crawler->filter('footer')->remove();
    }

    protected function updateTopPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#vue-app > div > div > div')
            ->removeClass('pt-4')
            ->css('margin-top', '-1.5rem')
        ;
    }

    protected function updateContainer(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#vue-app > div')
            ->removeClass('pt-16')
            ->removeClass('md:pt-24')
            ->removeClass('lg:pt-32')
            ->removeClass('md:px-6')
        ;

        $crawler->filter('#vue-app > div > div')
            ->removeClass('max-w-3xl')
        ;

        $crawler->filter('div.markdown')
            ->removeClass('lg:max-w-md')
            ->removeClass('xl:max-w-lg')
            ->removeClass('md:mb-6')
            ->removeClass('lg:mb-10')
            ->removeClass('xl:px-10')
            ->removeClass('sm:shadow')
            ->removeClass('md:rounded-lg')
        ;
    }

    protected function updateTextSize(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h2')
            ->addClass('text-3xl')
        ;

        $crawler->filter('h3')
            ->css('font-size', '1.5rem')
        ;
    }

    protected function updateH4Padding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h4')
            ->css('margin-top', '2.5rem')
        ;
    }

    protected function removeUnwantedCSS(HtmlPageCrawler $crawler)
    {
        $crawler->filter('link[href*="docsearch.min.css"]')->remove();
    }

    protected function removeUnwantedJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('script[src*=docsearch]')->remove();
        $crawler->filterXPath("//script[text()[contains(.,'docsearch')]]")->remove();
    }

    protected function insertDashTableOfContents(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h2')
            ->before('<a name="//apple_ref/cpp/Section/Top" class="dashAnchor"></a>');

        $crawler->filter('h3')->each(static function (HtmlPageCrawler $node) {
            $node->before(
                '<a id="' . Str::slug($node->text()) . '" name="//apple_ref/cpp/Section/' . rawurlencode($node->text()) . '" class="dashAnchor"></a>'
            );
        });
    }
}
