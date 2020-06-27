<?php

namespace Tests\Feature\Commands;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\Console\Exception\RuntimeException;
use Tests\TestCase;

class BuildTest extends TestCase
{
    /** @test */
    public function the_command_requires_a_docset_name_as_argument()
    {
        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Not enough arguments (missing:');

        $this->artisan('build');
    }

    /** @test */
    public function the_command_returns_an_info_message_if_the_docset_is_not_supported()
    {
        $this->artisan('build unsupported')
            ->expectsOutput('The doc requested does not seem to be supported.')
            ->assertExitCode(1);
    }

    /**
     * @test
     * @group download
     */
    public function the_command_can_be_run_and_create_a_bunch_of_shit_that_is_a_pain_to_test()
    {
        Storage::deleteDirectory('rick-astley');

        $this->artisan('build rick-astley')
            ->assertExitCode(0);

        $this->assertTrue(Storage::exists('rick-astley/rick-astley.docset'));
        $this->assertTrue(Storage::exists('rick-astley/rick-astley.tgz'));
    }
}
