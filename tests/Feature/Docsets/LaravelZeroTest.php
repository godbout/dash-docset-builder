<?php

namespace Tests\Feature\Docsets;

use Tests\TestCase;
use App\Docsets\LaravelZero;
use App\Services\DocsetBuilder;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

/*** @group laravel-zero */
class LaravelZerlTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->laravelZero = new LaravelZero;
        $this->builder = new DocsetBuilder($this->laravelZero);

        if (! Storage::exists($this->builder->docsetDownloadedDirectory())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mGrabbing laravel-zero..." . PHP_EOL);
            Artisan::call('grab laravel-zero');
        }

        if (! Storage::exists($this->builder->docsetFile())) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mPackaging laravel-zero..." . PHP_EOL);
            Artisan::call('package laravel-zero');
        }
    }

    /** @test */
    public function it_generates_a_table_of_contents()
    {
        $toc = $this->laravelZero->entries(
            HtmlPageCrawler::create(
                Storage::get($this->docsetDownloadedIndex())
            )
        );

        $this->assertNotEmpty($toc);
    }

    /** @test */
    public function the_header_gets_removed_from_the_dash_docset_files()
    {
        $header = '<header';

        $this->assertStringContainsString(
            $header,
            Storage::get($this->docsetDownloadedIndex())
        );

        $this->assertStringNotContainsString(
            $header,
            Storage::get($this->builder->docsetIndex())
        );
    }

    /** @test */
    public function the_left_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $leftSidebar = 'id="js-nav-menu"';

        $this->assertStringContainsString(
            $leftSidebar,
            Storage::get($this->docsetDownloadedIndex())
        );

        $this->assertStringNotContainsString(
            $leftSidebar,
            Storage::get($this->builder->docsetIndex())
        );
    }

    /** @test */
    public function the_footer_gets_removed_from_the_dash_docset_files()
    {
        $footer = '<footer';

        $this->assertStringContainsString(
            $footer,
            Storage::get($this->docsetDownloadedIndex())
        );

        $this->assertStringNotContainsString(
            $footer,
            Storage::get($this->builder->docsetIndex())
        );
    }

    /** @test */
    public function the_container_width_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docsetDownloadedIndex())
        );

        $this->assertTrue(
            $crawler->filter('section.container > div > div')->hasClass('lg:w-3/5')
        );


        $crawler = HtmlPageCrawler::create(
            $this->builder->docsetIndex()
        );

        $this->assertFalse(
            $crawler->filter('section.container > div > div')->hasClass('lg:w-3/5')
        );
    }

    /** @test */
    public function the_bottom_padding_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get($this->docsetDownloadedIndex())
        );

        $this->assertTrue(
            $crawler->filter('section > div > div')->hasClass('pb-16')
        );


        $crawler = HtmlPageCrawler::create(
            $this->builder->docsetIndex()
        );

        $this->assertFalse(
            $crawler->filter('section > div > div')->hasClass('pb-16')
        );
    }

    /** @test */
    public function the_JavaScript_tags_get_removed_from_the_dash_docset_files()
    {
        $this->markTestIncomplete('Need to check if docset works without js');

        $this->assertStringContainsString(
            '<script>',
            Storage::get($this->docsetDownloadedIndex())
        );

        $this->assertStringNotContainsString(
            '<script>',
            Storage::get($this->builder->docsetIndex())
        );
    }

    /** @test */
    public function it_inserts_dash_anchors_in_the_doc_files()
    {
        $this->assertStringContainsString(
            'name="//apple_ref/',
            Storage::get($this->builder->docsetIndex())
        );
    }

    protected function docsetDownloadedIndex()
    {
        return $this->builder->docsetDownloadedDirectory() . '/' . LaravelZero::INDEX;
    }
}
