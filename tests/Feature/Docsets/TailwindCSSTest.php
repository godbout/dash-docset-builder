<?php

namespace Tests\Feature\Docsets;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;

class TailwindCSSTest extends TestCase
{
    /** @test */
    public function the_navbar_gets_removed_from_the_dash_docset_files()
    {
        $this->assertStringNotContainsString(
            'id="sidebar-open"',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function the_left_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $this->assertStringNotContainsString(
            'id="sidebar"',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function the_right_sidebar_gets_removed_from_the_dash_docset_files()
    {
        $this->assertStringNotContainsString(
            'hidden xl:text-sm',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function the_CSS_gets_updated_in_the_dash_docset_files()
    {
        $crawler = HtmlPageCrawler::create(
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );

        $this->assertTrue(
            $crawler->filter('#app > #content')->hasClass('pt-2')
        );
    }

    /** @test */
    public function the_JavaScript_tags_get_removed_from_the_dash_docset_files()
    {
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
