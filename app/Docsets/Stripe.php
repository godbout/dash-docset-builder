<?php

namespace App\Docsets;

use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class Stripe extends BaseDocset
{
    public const CODE = 'stripe';
    public const NAME = 'Stripe';
    public const URL = 'stripe.com';
    public const INDEX = 'docs.html';
    public const PLAYGROUND = '';
    public const ICON_16 = '../../icons/icon.png';
    public const ICON_32 = '../../icons/icon@2x.png';
    public const EXTERNAL_DOMAINS = [
        'b.stripecdn.com',
        'js.stripe.com'
    ];


    public function grab(): bool
    {
        $toIgnore = implode('|', [
            '\?javascript=false',
            '/code.stripe.com',
            '/country\?country=',
            '/dashboard.stripe.com',
            '/site-admin.stripe.com',
            '/status.striple.com',
            '/support.stripe.com',
            '/at[-/]',
            '/au[-/]',
            '/de[-/]',
            '/es[-/]',
            '/fr[-/]',
            '/gb[-/]',
            '/ie[-/]',
            '/it[-/]',
            '/ja[-/]',
            '/nz[-/]',
        ]);

        $toGet = implode('|', [
            '/docs',
            '\.css',
            '\.ico',
            '\.js',
            '\.png',
            '\.woff2',
        ]);

        system(
            "wget stripe.com/docs \
                --mirror \
                -e robots=off \
                --timestamping \
                --reject-regex='{$toIgnore}' \
                --accept-regex='{$toGet}' \
                --page-requisites \
                --adjust-extension \
                --convert-links \
                --span-hosts \
                --domains={$this->externalDomains()} \
                --directory-prefix=storage/{$this->downloadedDirectory()}",
            $result
        );

        return $result === 0;
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

        $crawler->filter('h1')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
            if (basename($file) !== 'docs.html') {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Guide',
                    'path' => Str::after($file . '#' . Str::slug($node->text()), $this->innerDirectory()),
                ]);
            }
        });

        return $entries;
    }

    protected function sectionEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        $crawler->filter('h2')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
            if (basename($file) !== 'docs.html') {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Section',
                    'path' => Str::after($file . '#' . Str::slug($node->text()), $this->innerDirectory()),
                ]);
            }
        });

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        // $this->removeLeftSidebar($crawler);
        // $this->removeRightSidebar($crawler);
        $this->removeHeader($crawler);
        $this->removeFooter($crawler);
        $this->removeUnwantedJavaScript($crawler);
        // $this->insertDashTableOfContents($crawler);

        return $crawler->saveHTML();
    }

    protected function removeLeftSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#sidebar')->remove();
    }

    protected function removeRightSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('.docs-aside')->remove();
    }

    protected function removeHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#main-header')->remove();
    }

    protected function removeFooter(HtmlPageCrawler $crawler)
    {
        $crawler->filter('footer')->remove();
    }

    protected function removeUnwantedJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('noscript')->remove();
    }

    protected function insertDashTableOfContents(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h1')
            ->before('<a name="//apple_ref/cpp/Section/Top" class="dashAnchor"></a>');

        $crawler->filter('h2')->each(static function (HtmlPageCrawler $node) {
            $node->before(
                '<a id="' . Str::slug($node->text()) . '" name="//apple_ref/cpp/Section/' . rawurlencode($node->text()) . '" class="dashAnchor"></a>'
            );
        });
    }
}
