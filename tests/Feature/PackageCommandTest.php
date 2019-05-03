<?php

namespace Tests\Feature;

use App\Commands\PackageCommand;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;
use Tests\TestCase;
use Wa72\HtmlPageDom\HtmlPageCrawler;

class PackageCommandTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        Storage::deleteDirectory('tailwindcss/tailwindcss.docset');

        if (! Storage::exists('tailwindcss/next.tailwindcss.com')) {
            Storage::put(
                'tailwindcss/next.tailwindcss.com/what.txt',
                'If you see this it means my package creation fucked up.'
            );
        }
    }

    public function tearDown(): void
    {
        parent::tearDown();

        /**
         * Crashes for now. Don't know yet why.
         */
        // Storage::delete('tailwindcss/next.tailwindcss.com/file.txt');
        exec('rm -Rf storage/tailwindcss/tailwindcss.docset');
    }

    /** @test */
    public function it_requires_a_docset_name_as_argument()
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Not enough arguments (missing: "docs").');

        $this->artisan('package');
    }

    /** @test */
    public function it_currently_only_allows_tailwindcss_as_argument()
    {
        $this->artisan('package tailwindcss')
            ->assertExitCode(0);

        $this->artisan('package nottailwindcss')
            ->expectsOutput('Only the tailwindcss doc is currently available.')
            ->assertExitCode(1);
    }

    /** @test */
    public function it_creates_the_dash_docset_package()
    {
        $this->artisan('package tailwindcss');

        $this->assertFileExists('storage/tailwindcss/tailwindcss.docset');
    }

    /** @test */
    public function it_creates_the_info_plist_file()
    {
        $this->artisan('package tailwindcss');

        $this->assertFileExists(
            'storage/tailwindcss/tailwindcss.docset/Contents/Info.plist'
        );
    }

    /** @test */
    public function it_creates_the_sqlite_index()
    {
        $this->artisan('package tailwindcss');

        $this->assertFileExists(
            'storage/tailwindcss/tailwindcss.docset/Contents/Resources/docSet.dsidx'
        );
    }

    /** @test */
    public function it_fills_up_the_sqlite_index()
    {
        $this->artisan('package tailwindcss');

        $indexes = DB::table('searchIndex')->get();

        $this->assertNotEmpty($indexes);
    }

    /** @test */
    public function it_removes_the_navbar_from_the_dash_docset_files()
    {
        $this->artisan('package tailwindcss');

        $this->assertStringNotContainsString(
            'id="sidebar-open"',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_removes_the_left_sidebar_from_the_dash_docset_files()
    {
        $this->artisan('package tailwindcss');

        $this->assertStringNotContainsString(
            'id="sidebar"',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_removes_the_right_sidebar_from_the_dash_docset_files()
    {
        $this->artisan('package tailwindcss');

        $this->assertStringNotContainsString(
            'hidden xl:text-sm',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_update_the_CSS_from_the_dash_docset_files()
    {
        $this->artisan('package tailwindcss');

        $crawler = HtmlPageCrawler::create(
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );

        $this->assertTrue(
            $crawler->filter('#app > #content')->hasClass('pt-2')
        );
    }

    /** @test */
    public function it_removes_javascript_from_the_dash_docset_files()
    {
        $this->artisan('package tailwindcss');

        $this->assertStringNotContainsString(
            '<script>',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_inserts_dash_anchors_in_the_doc_files()
    {
        $this->artisan('package tailwindcss');

        $this->assertStringContainsString(
            'name="//apple_ref/',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_generates_an_icon_for_the_docset()
    {
        $this->artisan('package tailwindcss');

        $this->assertFileExists(
            'storage/tailwindcss/tailwindcss.docset/icon.png'
        );
    }
}
