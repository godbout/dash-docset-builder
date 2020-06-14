<?php

namespace Tests\Feature\Docsets;

use App\Docsets\Tiki;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;
use Wa72\HtmlPageDom\HtmlPageCrawler;

/** @group tiki */
class TikiTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new Tiki();
        $this->builder = new DocsetBuilder($this->docset);

        if (! Storage::exists($this->docset->downloadedDirectory())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mGrabbing tiki..." . PHP_EOL);
            Artisan::call('grab tiki');
        }

        if (! Storage::exists($this->docset->file())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mPackaging tiki..." . PHP_EOL);
            Artisan::call('package tiki');
        }
    }

    /** @test */
    public function it_has_a_table_of_contents()
    {
        Config::set(
            'database.connections.sqlite.database',
            "storage/{$this->docset->databaseFile()}"
        );

        $this->assertNotEquals(0, DB::table('searchIndex')->count());
    }

    /** @test */
    public function the_navbar_gets_removed_from_the_dash_docset_files()
    {
        $navbar = '<nav class="navbar';

        $this->assertStringContainsString(
            $navbar,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $navbar,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_left_sidebar_button_gets_removed_from_the_dash_docset_files()
    {
        $leftSidebarButton = 'side-col-toggle-container';

        $this->assertStringContainsString(
            $leftSidebarButton,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $leftSidebarButton,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_fullscreen_button_gets_removed_from_the_dash_docset_files()
    {
        $fullscreenButton = 'id="fullscreenbutton"';

        $this->assertStringContainsString(
            $fullscreenButton,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $fullscreenButton,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_page_top_modules_gets_removed_from_the_dash_docset_files()
    {
        $pageTopModules = 'id="pagetop_modules"';

        $this->assertStringContainsString(
            $pageTopModules,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $pageTopModules,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_wiki_actions_wrapper_gets_removed_from_the_dash_docset_files()
    {
        $wikiActionsWrapper = '<div class="wikiactions_wrapper';

        $this->assertStringContainsString(
            $wikiActionsWrapper,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $wikiActionsWrapper,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_breadcrumb_gets_removed_from_the_dash_docset_files()
    {
        $breadcrumb = '<nav class="nav-breadcrumb';

        $this->assertStringContainsString(
            $breadcrumb,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $breadcrumb,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_topbar_gets_removed_from_the_dash_docset_files()
    {
        $topbar = 'id="topbar"';

        $this->assertStringContainsString(
            $topbar,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $topbar,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_left_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $leftSidebar = 'id="col2';

        $this->assertStringContainsString(
            $leftSidebar,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $leftSidebar,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_right_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $rightSidebar = 'autoToc.js';

        $this->assertStringContainsString(
            $rightSidebar,
            Storage::get($this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/PluginList-output-control-block.html')
        );

        $this->assertStringNotContainsString(
            $rightSidebar,
            Storage::get($this->docset->innerDirectory() . '/' . $this->docset->url() . '/PluginList-output-control-block.html')
        );
    }

    /** @test */
    public function the_pagebar_gets_removed_from_the_dash_docset_files()
    {
        $pagebar = 'id="page-bar"';

        $this->assertStringContainsString(
            $pagebar,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $pagebar,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_footer_gets_removed_from_the_dash_docset_files()
    {
        $footer = 'id="footer"';

        $this->assertStringContainsString(
            $footer,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $footer,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_unwanted_JavaScript_gets_removed_from_the_dash_docset_files()
    {
        $unwantedJavaScript = [
            'autosave.js',
            'googletagmanager.com',
            '<noscript',
            'piwik.tiki.org',
            "gtag('js'",
        ];

        foreach ($unwantedJavaScript as $entry) {
            $this->assertStringContainsString(
                $entry,
                Storage::get($this->docset->downloadedIndex())
            );

            $this->assertStringNotContainsString(
                $entry,
                Storage::get($this->docset->innerIndex())
            );
        }
    }

    /** @test */
    public function the_top_padding_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertTrue(
            $crawler->filter('body')->hasClass('navbar-padding')
        );


        $crawler = HtmlPageCrawler::create(
            $this->docset->innerIndex()
        );

        $this->assertFalse(
            $crawler->filter('body')->hasClass('hide_zone_left')
        );
    }

    /** @test */
    public function the_article_padding_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/PluginList-output-control-block.html')
        );

        $this->assertNull(
            $crawler->filter('article#top')->getStyle('padding-top')
        );


        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->innerDirectory() . '/' . $this->docset->url() . '/PluginList-output-control-block.html')
        );

        $this->assertEquals(
            '44px',
            $crawler->filter('article#top')->getStyle('padding-top')
        );
    }

    /** @test */
    public function the_online_redirection_html_comment_exists_in_the_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/PluginList-output-control-block.html')
        );

        $this->assertFalse(
            Str::contains($crawler->getInnerHtml(), 'Online page')
        );

        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->innerDirectory() . '/' . $this->docset->url() . '/PluginList-output-control-block.html')
        );

        $this->assertTrue(
            Str::contains($crawler->getInnerHtml(), 'Online page')
        );
    }
}
