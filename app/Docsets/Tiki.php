<?php

namespace App\Docsets;

use Illuminate\Support\Str;
use Illuminate\Support\Collection;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;

class Tiki extends BaseDocset
{
    public const CODE = 'tiki';
    public const NAME = 'Tiki';
    public const URL = 'doc.tiki.org';
    public const INDEX = 'All-the-Documentation.html';
    public const PLAYGROUND = '';
    public const ICON_16 = '../../icons/icon.png';
    public const ICON_32 = '../../icons/icon@2x.png';
    public const EXTERNAL_DOMAINS = [
        'themes.tiki.org',
    ];


    public function grab(): bool
    {
        system(
            "wget doc.tiki.org/All-the-Documentation \
                --mirror \
                -e robots=off \
                --header 'Cookie: javascript_enabled_detect=true' \
                --reject-regex='/Plugins-|Plugins\.html|fullscreen=|PDF\.js|tikiversion=|comzone=|structure=|wp_files_sort_mode[0-9]=|offset=|\?refresh|\?session_filters|\?sort_mode' \
                --accept-regex='/Plugin|/LIST|Tiki_org_family|\.css|\.js|\.jpg|\.png|\.gif|\.svg|\.ico|\.webmanifest' \
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
        $entries = $entries->merge($this->pluginEntries($crawler, $file));
        // $entries = $entries->merge($this->sectionEntries($crawler, $file));

        return $entries;
    }

    protected function pluginEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        if (! in_array(basename($file), ['All-the-Documentation.html', 'site.webmanifest.html'])) {
            $path = $crawler->filter('link[rel=canonical]')->attr('href');

            $crawler->filter('#top h1:first-of-type')->each(function (HtmlPageCrawler $node) use ($entries, $file, $path) {
                $entries->push([
                        'name' => $node->text(),
                        'type' => 'Plugin',
                        'path' => Str::after($file . '#' . Str::slug($path), $this->innerDirectory()),
                    ]);
            });
        }

        return $entries;
    }

    protected function sectionEntries(HtmlPageCrawler $crawler, string $file)
    {
        $entries = collect();

        $crawler->filter('h2')->each(function (HtmlPageCrawler $node) use ($entries, $file) {
            if (! in_array(basename($file), ['All-the-Documentation.html', 'site.webmanifest.html'])) {
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
        $this->removeUnwantedJavaScript($crawler);

        $this->updateCss($crawler);

        $this->insertDashTableOfContents($crawler);

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
        $crawler->filter('script[src*="autoToc.js"]')->remove();
    }

    protected function removePagebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#page-bar')->remove();
    }

    protected function removeFooter(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#footer')->remove();
    }

    protected function removeUnwantedJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('script[src*=autosave]')->remove();
        $crawler->filter('script[src*=gtag]')->remove();
        $crawler->filter('noscript')->remove();
        $crawler->filterXPath("//script[text()[contains(.,'piwik.tiki.org')]]")->remove();
        $crawler->filterXPath("//script[text()[contains(.,'gtag')]]")->remove();
    }

    protected function updateCSS(HtmlPageCrawler $crawler)
    {
        $this->updateTopPadding($crawler);
        $this->updateArticlePadding($crawler);
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
