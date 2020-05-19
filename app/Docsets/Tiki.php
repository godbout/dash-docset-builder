<?php

namespace App\Docsets;

use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class Tiki extends BaseDocset
{
    public const CODE = 'tiki';
    public const NAME = 'Tiki';
    public const URL = 'doc.tiki.org';
    public const INDEX = 'PluginList-output-control-block.html';
    public const SPECIFIC_PAGES = [
        'http://doc.tiki.org/PluginList-output-control-block',
        'http://doc.tiki.org/PluginList-filter-control-block'
    ];
    public const PLAYGROUND = '';
    public const ICON_16 = '../icon.png';
    public const ICON_32 = '../icon@2x.png';
    public const EXTERNAL_DOMAINS = [];


    public function entries(string $file): Collection
    {
        $entries = collect();

        $crawler = HtmlPageCrawler::create(Storage::get($file));

        $crawler->filter('link[rel=canonical]')->each(static function (HtmlPageCrawler $node) use ($entries) {
            $entries->push([
                'name' => $node->attr('href'),
                'type' => 'Guide',
                'path' => $node->attr('href')
            ]);
        });

        return $entries;
    }

    public function format(string $html): string
    {
        $crawler = HtmlPageCrawler::create($html);

        $this->removeNavbar($crawler);
        $this->removeLeftSidebarButton($crawler);
        $this->removeFullscreenButton($crawler);
        $this->removePageTopModules($crawler);
        $this->removeWikiActionsWrapper($crawler);
        $this->removeBreadcrumb($crawler);
        $this->removeTopbar($crawler);
        $this->removeLeftSidebar($crawler);
        $this->removeRightSidebar($crawler);
        $this->removePagebar($crawler);
        $this->removeFooter($crawler);

        $this->updateCss($crawler);

        return $crawler->saveHTML();
    }

    protected function removeNavbar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('nav.navbar')->remove();
    }

    protected function removeLeftSidebarButton(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#row-middle > div.side-col-toggle-container')->remove();
    }

    protected function removeFullscreenButton(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#fullscreenbutton')->remove();
    }

    protected function removePageTopModules(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#pagetop_modules')->remove();
    }

    protected function removeWikiActionsWrapper(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#col1 > div.wikiactions_wrapper')->remove();
    }

    protected function removeBreadcrumb(HtmlPageCrawler $crawler)
    {
        $crawler->filter('nav.nav-breadcrumb')->remove();
    }

    protected function removeTopbar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#topbar')->remove();
    }

    protected function removeLeftSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#col2')->remove();
    }

    protected function removeRightSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('script[src="autoToc.js"]')->remove();
    }

    protected function removePagebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#page-bar')->remove();
    }

    protected function removeFooter(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#footer')->remove();
    }

    protected function updateCSS(HtmlPageCrawler $crawler)
    {
        $this->updateTopPadding($crawler);
        $this->updateArticlePadding($crawler);

        // $this->updateHeader($crawler);
        // $this->updateContainerWidth($crawler);
        // $this->updateBottomPadding($crawler);
    }

    protected function updateTopPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body')
            ->removeClass('navbar-padding')
            ->addClass('hide_zone_left')
            ->css('padding-top', '0')
        ;
    }

    protected function updateArticlePadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('article#top')
            ->css('padding-top', '44px')
        ;
    }
}
