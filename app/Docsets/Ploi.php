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

        return $crawler->saveHTML();
    }
}
