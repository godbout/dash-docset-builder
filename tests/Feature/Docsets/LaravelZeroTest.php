<?php

namespace Tests\Feature\Docsets;

use Tests\TestCase;
use App\Docsets\LaravelZero;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\DB;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

/** @group laravel-zero */
class LaravelZeroTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new LaravelZero();
        $this->builder = new DocsetBuilder($this->docset);

        if (! Storage::exists($this->docset->downloadedDirectory())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mGrabbing laravel-zero..." . PHP_EOL);
            Artisan::call('grab laravel-zero');
        }

        if (! Storage::exists($this->docset->file())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mPackaging laravel-zero..." . PHP_EOL);
            Artisan::call('package laravel-zero');
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
    public function the_left_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $leftSidebar = 'id="js-nav-menu"';

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
    public function the_footer_gets_removed_from_the_dash_docset_files()
    {
        $footer = '<footer';

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
    public function the_container_width_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertTrue(
            $crawler->filter('section.container > div > div')->hasClass('lg:w-3/5')
        );


        $crawler = HtmlPageCrawler::create(
            $this->docset->innerIndex()
        );

        $this->assertFalse(
            $crawler->filter('section.container > div > div')->hasClass('lg:w-3/5')
        );
    }

    /** @test */
    public function the_bottom_padding_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertTrue(
            $crawler->filter('section > div > div')->hasClass('pb-16')
        );


        $crawler = HtmlPageCrawler::create(
            $this->docset->innerIndex()
        );

        $this->assertFalse(
            $crawler->filter('section > div > div')->hasClass('pb-16')
        );
    }

    /** @test */
    public function the_JavaScript_tags_get_removed_from_the_dash_docset_files()
    {
        $this->assertStringContainsString(
            '<script>',
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            '<script>',
            $this->docset->innerIndex()
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
