<?php

namespace Tests\Unit\Docsets;

use Tests\TestCase;
use App\Docsets\LaravelZero;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\Storage;

/** @group laravel-zero */
class LaravelZeroTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new LaravelZero();
        $this->builder = new DocsetBuilder($this->docset);
    }

    /** @test */
    public function it_can_generate_a_table_of_contents()
    {
        $toc = $this->docset->entries(
            $this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/docs/logging/index.html'
        );

        $this->assertNotEmpty($toc);
    }

    /** @test */
    public function it_can_format_the_documentation_files()
    {
        $header = '<header';

        $this->assertStringContainsString(
            $header,
            Storage::get($this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/docs/logging/index.html')
        );

        $this->assertStringNotContainsString(
            $header,
            $this->docset->format(
                Storage::get($this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/docs/logging/index.html')
            )
        );
    }
}
