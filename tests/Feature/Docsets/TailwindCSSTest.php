<?php

namespace Tests\Feature\Docsets;

use Tests\TestCase;
use App\Docsets\TailwindCSS;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

class TailwindCSSTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        if (! Storage::exists('tailwindcss/docs')) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mGrabbing tailwindcss..." . PHP_EOL);
            Artisan::call('grab tailwindcss');
        }

        if (! Storage::exists('tailwindcss/tailwindcss.docset')) {
            fwrite(STDOUT, PHP_EOL . PHP_EOL . "\e[1;33mPackaging tailwindcss..." . PHP_EOL);
            Artisan::call('package tailwindcss');
        }
    }

    /** @test */
    public function it_generates_a_table_of_contents()
    {
        $tailwind = new TailwindCSS;

        $toc = $tailwind->entries(
            HtmlPageCrawler::create(
                Storage::get('tailwindcss/docs/next.tailwindcss.com/index.html')
            )
        );

        $this->assertNotEmpty($toc);
    }

    /** @test */
    public function the_navbar_gets_removed_from_the_dash_docset_files()
    {
        $navbar = 'id="sidebar-open"';

        $this->assertStringContainsString(
            $navbar,
            Storage::get('tailwindcss/docs/next.tailwindcss.com/index.html')
        );

        $this->assertStringNotContainsString(
            $navbar,
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function the_left_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $leftSidebar = 'id="sidebar"';

        $this->assertStringContainsString(
            $leftSidebar,
            Storage::get('tailwindcss/docs/next.tailwindcss.com/index.html')
        );

        $this->assertStringNotContainsString(
            $leftSidebar,
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function the_right_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $rightSidebar = 'hidden xl:text-sm';

        $this->assertStringContainsString(
            $rightSidebar,
            Storage::get('tailwindcss/docs/next.tailwindcss.com/index.html')
        );

        $this->assertStringNotContainsString(
            $rightSidebar,
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function the_CSS_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get('tailwindcss/docs/next.tailwindcss.com/index.html')
        );

        $this->assertTrue(
            $crawler->filter('body > div:nth-child(2)')->hasClass('max-w-screen-xl')
        );


        $crawler = HtmlPageCrawler::create(
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );

        $this->assertFalse(
            $crawler->filter('body > div:nth-child(2)')->hasClass('max-w-screen-xl')
        );
    }

    /** @test */
    public function the_JavaScript_tags_get_removed_from_the_dash_docset_files()
    {
        $this->assertStringContainsString(
            '<script>',
            Storage::get('tailwindcss/docs/next.tailwindcss.com/index.html')
        );

        $this->assertStringNotContainsString(
            '<script>',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_inserts_dash_anchors_in_the_doc_files()
    {
        $this->assertStringContainsString(
            'name="//apple_ref/',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }
}
