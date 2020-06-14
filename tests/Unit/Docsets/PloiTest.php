<?php

namespace Tests\Unit\Docsets;

use Tests\TestCase;
use App\Docsets\Ploi;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\Storage;

/** @group ploi */
class PloiTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new Ploi();
        $this->builder = new DocsetBuilder($this->docset);
    }

    /** @test */
    public function it_generates_a_table_of_contents()
    {
        $toc = $this->docset->entries(
            $this->docset->downloadedIndex()
        );

        $this->assertNotEmpty($toc);
    }

    /** @test */
    public function it_can_format_the_documentation_files()
    {
        $header = '<header';

        $this->assertStringContainsString(
            $header,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $header,
            $this->docset->format(
                Storage::get($this->docset->downloadedIndex())
            )
        );
    }
}
