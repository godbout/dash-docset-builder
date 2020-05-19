<?php

namespace Tests\Feature\Docsets;

use Tests\TestCase;
use App\Docsets\Tiki;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\DB;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

/** @group tiki */
class TikiTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new Tiki;
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

    // /** @test */
    // public function the_header_gets_removed_from_the_dash_docset_files()
    // {
    //     $header = '<header';

    //     $this->assertStringContainsString(
    //         $header,
    //         Storage::get($this->docset->downloadedIndex())
    //     );

    //     $this->assertStringNotContainsString(
    //         $header,
    //         Storage::get($this->docset->innerIndex())
    //     );
    // }

    // /** @test */
    // public function the_footer_gets_removed_from_the_dash_docset_files()
    // {
    //     $footer = '<footer';

    //     $this->assertStringContainsString(
    //         $footer,
    //         Storage::get($this->docset->downloadedIndex())
    //     );

    //     $this->assertStringNotContainsString(
    //         $footer,
    //         Storage::get($this->docset->innerIndex())
    //     );
    // }

    // /** @test */
    // public function the_top_padding_gets_updated_in_the_dash_docset_files()
    // {
    //     $crawler = HtmlPageCrawler::create(
    //         Storage::get($this->docset->downloadedIndex())
    //     );

    //     $this->assertTrue(
    //         $crawler->filter('#vue-app > div > div > div')->hasClass('pt-4')
    //     );


    //     $crawler = HtmlPageCrawler::create(
    //         $this->docset->innerIndex()
    //     );

    //     $this->assertFalse(
    //         $crawler->filter('#vue-app > div > div > div')->hasClass('pb-16')
    //     );
    // }

    // /** @test */
    // public function the_container_gets_updated_in_the_dash_docset_files()
    // {
    //     $crawler = HtmlPageCrawler::create(
    //         Storage::get($this->docset->downloadedIndex())
    //     );

    //     $this->assertTrue(
    //         $crawler->filter('div.markdown')->hasClass('lg:max-w-md')
    //     );


    //     $crawler = HtmlPageCrawler::create(
    //         $this->docset->innerIndex()
    //     );

    //     $this->assertFalse(
    //         $crawler->filter('div.markdown')->hasClass('lg:max-w-md')
    //     );
    // }

    // /** @test */
    // public function the_text_size_gets_updated_in_the_dash_docset_files()
    // {
    //     $crawler = HtmlPageCrawler::create(
    //         Storage::get($this->docset->downloadedIndex())
    //     );

    //     $this->assertFalse(
    //         $crawler->filter('h2')->hasClass('text-3xl')
    //     );

    //     $crawler = HtmlPageCrawler::create(
    //         Storage::get($this->docset->innerIndex())
    //     );

    //     $this->assertTrue(
    //         $crawler->filter('h2')->hasClass('text-3xl')
    //     );
    // }

    // /** @test */
    // public function the_h4_padding_gets_updated_in_the_dash_docset_files()
    // {
    //     $crawler = HtmlPageCrawler::create(
    //         Storage::get($this->docset->downloadedDirectory() . '/collections-pagination.html')
    //     );

    //     $this->assertFalse(
    //         $crawler->filter('h4')->css('margin-top') === '2.5rem'
    //     );

    //     $crawler = HtmlPageCrawler::create(
    //         Storage::get($this->docset->innerDirectory() . '/collections-pagination.html')
    //     );

    //     $this->assertTrue(
    //         $crawler->filter('h4')->css('margin-top') === '2.5rem'
    //     );
    // }

    // /** @test */
    // public function the_JavaScript_tags_get_removed_from_the_dash_docset_files()
    // {
    //     $this->assertStringContainsString(
    //         '<script',
    //         Storage::get($this->docset->downloadedIndex())
    //     );

    //     $this->assertStringNotContainsString(
    //         '<script',
    //         $this->docset->innerIndex()
    //     );
    // }

    // /** @test */
    // public function it_inserts_dash_anchors_in_the_doc_files()
    // {
    //     $this->assertStringContainsString(
    //         'name="//apple_ref/',
    //         Storage::get($this->docset->innerIndex())
    //     );
    // }
}
