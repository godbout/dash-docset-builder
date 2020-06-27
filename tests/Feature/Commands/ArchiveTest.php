<?php

namespace Tests\Feature\Commands;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;
use Tests\TestCase;

class ArchiveTest extends TestCase
{
    /** @test */
    public function the_command_requires_a_docset_name_as_argument()
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Not enough arguments (missing:');

        $this->artisan('archive');
    }

    /** @test */
    public function the_command_returns_an_info_message_if_the_docset_is_not_supported()
    {
        $this->artisan('archive unsupported')
            ->expectsOutput('The doc requested does not seem to be supported.')
            ->assertExitCode(1);
    }

    /** @test */
    public function the_command_generates_an_archive_file()
    {
        $this->artisan('archive rick-astley');

        $this->assertTrue(Storage::exists('rick-astley/rick-astley.tgz'));
    }
}
