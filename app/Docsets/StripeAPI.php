<?php

namespace App\Docsets;

use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class StripeAPI extends BaseDocset
{
    public const CODE = 'stripe-api';
    public const NAME = 'Stripe API';
    public const URL = 'stripe.com/docs/api';
    public const INDEX = '';
    public const PLAYGROUND = '';
    public const ICON_16 = '../../../../icons/icon.png';
    public const ICON_32 = '../../../../icons/icon@2x.png';
    public const EXTERNAL_DOMAINS = [
    ];


    public function grab(): bool
    {
        echo 'Stripe API needs to be downloaded manually';

        return true;
    }


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

        $entries->push([
            'name' => basename($file),
            'type' => 'Guide',
            'path' => basename($file),
        ]);

        return $entries;
    }

    protected function sectionEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        $crawler->filter('h5')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
            $entries->push([
                'name' => trim($node->text()) . ' (' . basename($file) . ')',
                'type' => 'Section',
                'path' => Str::after($file . '#' . Str::slug($node->text()), $this->innerDirectory()),
            ]);
        });

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        $this->removeLeftSidebar($crawler);
        $this->removeHeader($crawler);
        $this->removeUnwantedJavaScript($crawler);
        $this->insertDashTableOfContents($crawler);

        return $crawler->saveHTML();
    }

    protected function removeLeftSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#react-root-sidebar')->remove();
    }

    protected function removeHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('.TopNav.Box-root')->remove();
    }

    protected function removeUnwantedJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('noscript')->remove();
        $crawler->filter('script[src*=analytics]')->remove();
        $crawler->filter('script[id*=analytics]')->remove();
        $crawler->filterXPath("//script[text()[contains(.,'siteAnalyticsUtil')]]")->remove();
    }

    protected function insertDashTableOfContents(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h1')->each(static function (HtmlPageCrawler $node) {
            $node->before(
                '<a id="' . Str::slug($node->text()) . '" name="//apple_ref/cpp/Section/' . rawurlencode($node->text()) . '" class="dashAnchor"></a>'
            );
        });
    }
}
