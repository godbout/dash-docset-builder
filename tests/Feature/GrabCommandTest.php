<?php

namespace Tests\Feature;

use Tests\TestCase;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;

class GrabCommandTest extends TestCase
{
    /** @test */
    public function the_command_requires_a_docset_name_as_argument()
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Not enough arguments (missing: "docs").');

        $this->artisan('grab');
    }

    /** @test */
    public function currently_the_command_only_allows_tailwindcss_as_argument()
    {
        $this->artisan('grab tailwindcss')
            ->assertExitCode(0);

        $this->artisan('grab nottailwindcss')
            ->expectsOutput('Only the tailwindcss doc is currently available.')
            ->assertExitCode(1);
    }

    /** @test */
    public function the_command_downloads_the_docs_in_storage()
    {
        $this->artisan('grab tailwindcss');

        /**
         * We do not delete the doc folder before running the test
         * because it would redownload the whole site which is a
         * bit dumb. The test is here mainly for beauty.
         */
        $this->assertDirectoryExists('storage/tailwindcss');
    }
}
