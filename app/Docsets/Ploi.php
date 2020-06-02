<?php

namespace App\Docsets;

use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class Ploi extends BaseDocset
{
    public const CODE = 'ploi-api';
    public const NAME = 'Ploi API';
    public const URL = 'developers.ploi.io';
    public const INDEX = 'index.html';
    public const PLAYGROUND = '';
    public const ICON_16 = '../documentator.s3.eu-west-3.amazonaws.com/11/conversions/favicon-favicon-16.png';
    public const ICON_32 = '../documentator.s3.eu-west-3.amazonaws.com/11/conversions/favicon-favicon-32.png';
    public const EXTERNAL_DOMAINS = [
        'documentator.s3.eu-west-3.amazonaws.com'
    ];


    public function grab(): bool
    {
        system(
            "echo; wget {$this->url()} \
                --mirror \
                --trust-server-names \
                --page-requisites \
                --adjust-extension \
                --convert-links \
                --span-hosts \
                --domains={$this->externalDomains()} \
                --directory-prefix=storage/{$this->downloadedDirectory()} \
                -e robots=off \
                --quiet \
                --show-progress",
            $result
        );

        return $result === 0;
    }

    public function entries(string $file): Collection
    {
        $crawler = HtmlPageCrawler::create(Storage::get($file));

        $entries = collect();
        $entries = $entries->merge($this->guideEntries($crawler, $file));

        return $entries;
    }

    protected function guideEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        if (Str::contains($file, "{$this->url()}/index.html")) {
            $crawler->filter('aside a.ml-2')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
                $entries->push([
                    'name' => trim($node->text()),
                    'type' => 'Guide',
                    'path' => $this->url() . '/' . $node->attr('href'),
                ]);
            });
        }

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        $this->removeHeader($crawler);
        $this->removeSidebar($crawler);
        $this->removePreviousAndNextNavigation($crawler);
        $this->updateTopPadding($crawler);
        $this->removeUnwantedJavaScript($crawler);
        $this->insertDashTableOfContents($crawler);

        return $crawler->saveHTML();
    }

    protected function removeHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('header')->remove();
    }

    protected function removeSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('aside')->remove();
    }

    protected function removePreviousAndNextNavigation(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#previous-and-next')->remove();
    }

    protected function updateTopPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('main')
            ->addClass('md:pt-12')
        ;
    }

    protected function removeUnwantedJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('script[src*=gtag]')->remove();
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

        $crawler->filterXPath('//p[not(descendant::code)]')->each(static function (HtmlPageCrawler $node) {
            $node->before(
                '<a id="' . Str::slug($node->text()) . '" name="//apple_ref/cpp/Section/' . rawurlencode($node->text()) . '" class="dashAnchor"></a>'
            );
        });
    }
}
