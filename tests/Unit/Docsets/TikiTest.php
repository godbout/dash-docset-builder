<?php

namespace Tests\Unit\Docsets;

use Tests\TestCase;
use App\Docsets\Tiki;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\Storage;

/** @group tiki */
class TikiTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new Tiki();
        $this->builder = new DocsetBuilder($this->docset);
    }

    /** @test */
    public function it_can_generate_a_table_of_contents()
    {
        $toc = $this->docset->entries(
            $this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/PluginList-filter-control-block.html'
        );

        $this->assertNotEmpty($toc);
    }

    /** @test */
    public function it_can_format_the_documentation_files()
    {
        $navbar = 'nav-breadcrumb';

        $this->assertStringContainsString(
            $navbar,
            Storage::get($this->docset->downloadedIndex())
        );

        $this->assertStringNotContainsString(
            $navbar,
            $this->docset->format(Storage::get($this->docset->downloadedIndex()))
        );
    }
}
