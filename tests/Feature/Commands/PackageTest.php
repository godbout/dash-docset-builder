<?php

namespace Tests\Feature\Commands;

use Tests\TestCase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
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
    public function the_command_returns_an_info_message_if_the_docset_is_not_supported()
    {
        $this->artisan('package dummy')
            ->assertExitCode(0);

        $this->artisan('package unsupported')
            ->expectsOutput('The doc requested does not seem to be supported.')
            ->assertExitCode(1);
    }

    /** @test */
    public function it_creates_the_dash_docset_package()
    {
        $this->assertFileExists('storage/dummy/dummy.docset');
    }

    /** @test */
    public function it_creates_the_info_plist_file()
    {
        $this->assertFileExists(
            'storage/dummy/dummy.docset/Contents/Info.plist'
        );
    }

    /** @test */
    public function it_creates_the_sqlite_index()
    {
        $this->assertFileExists(
            'storage/dummy/dummy.docset/Contents/Resources/docSet.dsidx'
        );
    }

    /** @test */
    public function it_fills_up_the_sqlite_index()
    {
        Config::set(
            'database.connections.sqlite.database',
            'storage/dummy/dummy.docset/Contents/Resources/docSet.dsidx'
        );

        $indexes = DB::table('searchIndex')->get();

        $this->assertNotEmpty($indexes);
    }

    /** @test */
    public function it_formats_the_doc_especially_for_dash()
    {
        $navBar = 'class="nav-item';

        $this->assertStringContainsString(
            $navBar,
            Storage::get('dummy/docs/sleeplessmind.info/index.html')
        );

        $this->assertStringNotContainsString(
            $navBar,
            Storage::get('dummy/dummy.docset/Contents/Resources/Documents/index.html')
        );
    }

    /** @test */
    public function it_generates_icons_for_the_docset()
    {
        $this->assertFileExists(
            'storage/dummy/dummy.docset/icon.png'
        );

        $this->assertFileExists(
            'storage/dummy/dummy.docset/icon@2x.png'
        );
    }
}
