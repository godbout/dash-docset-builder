<?php

namespace Tests\Feature\Commands;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;
use Tests\TestCase;

class GrabTest extends TestCase
{
    /** @test */
    public function the_command_requires_a_docset_name_as_argument()
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Not enough arguments (missing:');

        $this->artisan('grab');
    }

    /** @test */
    public function the_command_returns_an_info_message_if_the_docset_is_not_supported()
    {
        $this->artisan('grab unsupported')
            ->expectsOutput('The doc requested does not seem to be supported.')
            ->assertExitCode(1);
    }

    /** @test */
    public function the_command_downloads_the_docs_in_storage()
    {
        $this->assertTrue(Storage::exists('rick-astley'));
    }
}
