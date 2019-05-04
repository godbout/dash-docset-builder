<?php

namespace Tests\Feature\Commands;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;

class PackageTest extends TestCase
{
    /** @test */
    public function it_requires_a_docset_name_as_argument()
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Not enough arguments (missing:');

        $this->artisan('package');
    }

    /** @test */
    public function it_currently_only_allows_tailwindcss_as_argument()
    {
        $this->artisan('package tailwindcss')
            ->assertExitCode(0);

        $this->artisan('package nottailwindcss')
            ->expectsOutput('The doc requested does not seem to be supported.')
            ->assertExitCode(1);
    }

    /** @test */
    public function it_creates_the_dash_docset_package()
    {
        $this->assertFileExists('storage/tailwindcss/tailwindcss.docset');
    }

    /** @test */
    public function it_creates_the_info_plist_file()
    {
        $this->assertFileExists(
            'storage/tailwindcss/tailwindcss.docset/Contents/Info.plist'
        );
    }

    /** @test */
    public function it_creates_the_sqlite_index()
    {
        $this->assertFileExists(
            'storage/tailwindcss/tailwindcss.docset/Contents/Resources/docSet.dsidx'
        );
    }

    /** @test */
    public function it_fills_up_the_sqlite_index()
    {
        $indexes = DB::table('searchIndex')->get();

        $this->assertNotEmpty($indexes);
    }

    /** @test */
    public function it_formats_the_doc_especially_for_dash()
    {
        $this->assertStringNotContainsString(
            'id="sidebar-open"',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );

        $this->assertStringNotContainsString(
            'id="sidebar"',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );

        $this->assertStringNotContainsString(
            'hidden xl:text-sm',
            Storage::get('tailwindcss/tailwindcss.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_generates_icons_for_the_docset()
    {
        $this->assertFileExists(
            'storage/tailwindcss/tailwindcss.docset/icon.png'
        );

        $this->assertFileExists(
            'storage/tailwindcss/tailwindcss.docset/icon@2x.png'
        );
    }
}
