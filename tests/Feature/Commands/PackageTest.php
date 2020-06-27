<?php

namespace Tests\Feature\Commands;

use Godbout\DashDocsetBuilder\Docsets\RickAstley;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;
use Tests\TestCase;

class PackageTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new RickAstley();
    }

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
        $this->artisan('package rick-astley')
            ->assertExitCode(0);

        $this->artisan('package unsupported')
            ->expectsOutput('The doc requested does not seem to be supported.')
            ->assertExitCode(1);
    }

    /** @test */
    public function it_creates_the_dash_docset_package()
    {
        $this->assertTrue(
            Storage::exists($this->docset->file())
        );
    }

    /** @test */
    public function it_creates_the_info_plist_file()
    {
        $this->assertTrue(
            Storage::exists($this->docset->infoPlistFile())
        );
    }

    /** @test */
    public function it_creates_the_sqlite_index()
    {
        $this->assertTrue(
            Storage::exists($this->docset->databaseFile())
        );
    }

    /** @test */
    public function it_fills_up_the_sqlite_index()
    {
        Config::set(
            'database.connections.sqlite.database',
            Storage::path($this->docset->databaseFile())
        );

        $indexes = DB::table('searchIndex')->get();

        $this->assertNotEmpty($indexes);
    }

    /** @test */
    public function it_formats_the_doc_especially_for_dash()
    {
        $header = 'id = "header';

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
    public function it_generates_icons_for_the_docset()
    {
        $this->assertTrue(
            Storage::exists($this->docset->file() . '/icon.png')
        );

        $this->assertTrue(
            Storage::exists($this->docset->file() . '/icon@2x.png')
        );
    }
}
