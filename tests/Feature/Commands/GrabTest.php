<?php

namespace Tests\Feature\Commands;

use Tests\TestCase;
use Symfony\Component\Console\Exception\RuntimeException;

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
    public function currently_the_command_only_allows_tailwindcss_as_argument()
    {
        $this->artisan('grab tailwindcss')
            ->assertExitCode(0);

        $this->artisan('grab nottailwindcss')
            ->expectsOutput('The doc requested does not seem to be supported.')
            ->assertExitCode(1);
    }

    /** @test */
    public function the_command_downloads_the_docs_in_storage()
    {
        $this->assertDirectoryExists('storage/tailwindcss');
    }
}
