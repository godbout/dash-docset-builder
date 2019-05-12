<?php

namespace App\Docsets;

use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class TailwindCSS extends BaseDocset
{
    const CODE = 'tailwindcss';
    const NAME = 'Tailwind CSS';
    const URL = 'next.tailwindcss.com';
    const INDEX = 'index.html';
    const PLAYGROUND = 'https://codesandbox.io/s/github/lbogdan/tailwindcss-playground';
    const ICON_16 = 'favicon-16x16.png';
    const ICON_32 = 'favicon-32x32.png';
    const EXTERNAL_DOMAINS = [];

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

        $crawler->filter('#navWrapper h5')->each(function (HtmlPageCrawler $node) use ($entries) {
            $entries->push([
                'name' => $node->text(),
                'type' => 'Guide',
                'path' => $node->siblings()->filter('a')->attr('href')
            ]);
        });

        return $entries;
    }

    protected function sectionEntries(HtmlPageCrawler $crawler)
    {
        $entries = collect();

        $crawler->filter('#navWrapper li a')->each(function (HtmlPageCrawler $node) use ($entries) {
            $entries->push([
                'name' => $node->children('.relative')->text(),
                'type' => 'Section',
                'path' => $node->attr('href')
            ]);
        });

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        $this->removeNavbarAndHeader($crawler);
        $this->removeLeftSidebar($crawler);
        $this->removeRightSidebar($crawler);
        $this->updateCSS($crawler);
        $this->insertDashTableOfContents($crawler);

        return $crawler->saveHTML();
    }

    protected function removeNavbarAndHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body > div:first-child')->remove();
    }

    protected function removeLeftSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#sidebar')->remove();
    }

    protected function removeRightSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#app div.flex > div.hidden')->remove();
    }

    protected function updateCSS(HtmlPageCrawler $crawler)
    {
        $this->updateTopPadding($crawler);
        $this->updateHeader($crawler);
        $this->updateContainerWidth($crawler);
        $this->updateBottomPadding($crawler);
    }

    protected function insertDashTableOfContents(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h1')
            ->after('<a name="//apple_ref/cpp/Section/Top" class="dashAnchor absolute -mt-24"></a>');

        $crawler->filter('h2')->each(function (HtmlPageCrawler $node) {
            $node->after(
                '<p><a name="//apple_ref/cpp/Section/' . $node->text() . '" class="dashAnchor absolute -mt-16"></a></p>'
            );
        });
    }

    protected function updateTopPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#app > div')
            ->removeClass('pt-12')
            ->removeClass('pt-24')
            ->removeClass('pb-16')
            ->removeClass('lg:pt-28')
            ->removeClass('lg:pt-12')
        ;
    }

    protected function updateHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#app > div > div.markdown')
            ->removeClass('lg:ml-0')
            ->removeClass('lg:mr-auto')
            ->removeClass('xl:mx-0')
            ->removeClass('xl:w-3/4')
            ->removeClass('max-w-3xl')
            ->removeClass('xl:px-12')
            ->addClass('pt-4')
        ;
    }

    protected function updateContainerWidth(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body > div:first-child')
            ->removeClass('max-w-screen-xl');

        $crawler->filter('#content-wrapper')
            ->removeClass('lg:static')
            ->removeClass('lg:max-h-full')
            ->removeClass('lg:overflow-visible')
            ->removeClass('lg:w-3/4')
            ->removeClass('xl:w-4/5');

        $crawler->filter('#app > div > div.flex > div.markdown')
            ->removeClass('xl:p-12')
            ->removeClass('max-w-3xl')
            ->removeClass('lg:ml-0')
            ->removeClass('lg:mr-auto')
            ->removeClass('xl:w-3/4')
            ->removeClass('xl:px-12')
            ->removeClass('xl:mx-0');
    }

    protected function updateBottomPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body')
            ->addClass('pb-8');
    }
}
