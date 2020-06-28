<?php

namespace Godbout\DashDocsetBuilder\Docsets;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Wa72\HtmlPageDom\HtmlPageCrawler;

class RickAstley extends BaseDocset
{
    public const CODE = 'rick-astley';
    public const NAME = 'Rick Astley';
    public const URL = 'rickastley.co.uk';
    public const INDEX = 'index.html';
    public const PLAYGROUND = '';
    public const ICON_16 = 'icons/favicon-16x16.png';
    public const ICON_32 = 'icons/favicon-32x32.png';
    public const EXTERNAL_DOMAINS = [
        'fonts.googleapis.com',
        'widget.songkick.com',
        'cdn-images.mailchimp.com',
        's3.amazonaws.com',
        'ajax.googleapis.com'
    ];


    public function entries(string $file): Collection
    {
        $entries = collect();

        $crawler = HtmlPageCrawler::create(Storage::get($file));

        if (Str::contains($file, "{$this->url()}/index.html")) {
            $crawler->filter('#main_menu li:not(:first-child) a')->each(function () use ($entries) {
                $entries->push([
                    'name' => 'Rick Astley - Official Website',
                    'type' => 'Guide',
                    'path' => $this->url() . '/index.html'
                ]);
            });
        }

        $crawler->filter('#main_menu li:not(:first-child) a')->each(function (HtmlPageCrawler $node) use ($entries) {
            $entries->push([
                'name' => $node->text(),
                'type' => 'Section',
                'path' => $this->url() . '/' . $node->attr('href')
            ]);
        });

        return $entries;
    }

    public function format(string $file): string
    {
        $crawler = HtmlPageCrawler::create(Storage::get($file));

        $this->removeHeader($crawler);
        $this->removeFooter($crawler);

        $this->removeUnwantedHTML($crawler);
        $this->removeUnwantedJavaScript($crawler);

        $this->insertDashTableOfContents($crawler);

        return $crawler->saveHTML();
    }

    protected function removeHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#header')->remove();
    }

    protected function removeFooter(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#footer')->remove();
    }

    protected function removeUnwantedHTML(HtmlPageCrawler $crawler)
    {
        $crawler->filterXPath("//img[@src[contains(.,'secure.adnxs.com')]]")->remove();
    }

    protected function removeUnwantedJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('noscript')->remove();
        $crawler->filterXPath("//script[@src[contains(.,'platform.twitter.com')]]")->remove();
        $crawler->filterXPath("//script[@src[contains(.,'googletagmanager')]]")->remove();
        $crawler->filterXPath("//script[@src[contains(.,'googleadservices')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'googletagmanager')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'gtag')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'connect.facebook.net')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'google_conversion_id')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'googleadservices')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'platform.twitter.com')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'twttr.conversion')]]")->remove();
    }

    protected function insertDashTableOfContents(HtmlPageCrawler $crawler)
    {
        $crawler->filter('head')
            ->before('<a name="//apple_ref/cpp/Section/Top" class="dashAnchor"></a>');

        $crawler->filter('div.page_title, div.product_title')->each(static function (HtmlPageCrawler $node) {
            $node->before(
                '<a id="' . Str::slug($node->text()) . '" name="//apple_ref/cpp/Section/' . rawurlencode($node->text()) . '" class="dashAnchor"></a>'
            );
        });
    }
}
