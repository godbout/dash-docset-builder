<?php

namespace Tests\Feature\Docsets;

use Tests\TestCase;
use App\Docsets\Ploi;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\DB;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

/** @group ploi */
class PloiTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new Ploi;
        $this->builder = new DocsetBuilder($this->docset);

        if (! Storage::exists($this->docset->downloadedDirectory())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mGrabbing ploi..." . PHP_EOL);
            Artisan::call('grab ploi');
        }

        if (! Storage::exists($this->docset->file())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mPackaging ploi..." . PHP_EOL);
            Artisan::call('package ploi');
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
    public function the_header_gets_removed_from_the_dash_docset_files()
    {
        $header = '<header';

        $this->assertStringContainsString(
            $header,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $header,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $sidebar = '<aside';

        $this->assertStringContainsString(
            $sidebar,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $sidebar,
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function the_previous_and_next_navigation_gets_removed_from_the_dash_docset_files()
    {
        $previousAndNextNavigation = 'id="previous-and-next"';

                $this->assertStringContainsString(
                    $previousAndNextNavigation,
                    Storage::get($this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/apps/install-wordpress.html')
                );

                $this->assertStringNotContainsString(
                    $previousAndNextNavigation,
                    Storage::get($this->docset->innerIndex())
                );
    }

    /** @test */
    public function the_top_padding_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertFalse(
            $crawler->filter('main')->hasClass('md:pt-12')
        );

        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->innerIndex())
        );

        $this->assertTrue(
            $crawler->filter('main')->hasClass('md:pt-12')
        );
    }

    /** @test */
    public function the_unwanted_JavaScript_tags_get_removed_from_the_dash_docset_files()
    {
        $this->assertStringContainsString(
            'gtag',
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            'gtag',
            Storage::get($this->docset->innerIndex())
        );
    }

    /** @test */
    public function it_inserts_dash_anchors_in_the_doc_files()
    {
        $this->assertStringContainsString(
            'name="//apple_ref/',
            Storage::get($this->docset->innerIndex())
        );
    }
}
