<?php

namespace Tests\Unit\Docsets;

use Tests\TestCase;
use App\Docsets\TailwindCSS;
use App\Services\DocsetBuilder;
use Illuminate\Support\Facades\Storage;

/** @group tailwindcss */
class TailwindCSSTest extends TestCase
{
    public function setUp(): void
    {
        parent::setUp();

        $this->docset = new TailwindCSS();
        $this->builder = new DocsetBuilder($this->docset);
    }

    /** @test */
    public function it_can_generate_a_table_of_contents()
    {
        // Sample entries
        $toc = $this->docset->entries(
            $this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/components/alerts/index.html'
        );

        $this->assertNotEmpty($toc);

        // Resource entries
        $toc = $this->docset->entries(
            $this->docset->downloadedDirectory() . '/' . $this->docset->url() . '/resources/index.html'
        );

        $this->assertNotEmpty($toc);

        // All other entries
        $toc = $this->docset->entries(
            $this->docset->downloadedIndex()
        );

        $this->assertNotEmpty($toc);
    }

    /** @test */
    public function it_can_format_the_documentation_files()
    {
        $navbar = 'id="sidebar-open"';

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
