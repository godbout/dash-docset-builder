<?php

namespace Tests\Feature\Commands;

use Illuminate\Support\Facades\File;
use Tests\TestCase;

class NewwTest extends TestCase
{
    protected $originalRickAstleyContent;

    protected function setup(): void
    {
        parent::setUp();

        $this->originalRickAstleyContent = File::get(app_path() . '/Docsets/RickAstley.php');
    }

    protected function tearDown(): void
    {
        parent::tearDown();

        File::put(app_path() . '/Docsets/RickAstley.php', $this->originalRickAstleyContent);
        File::delete(app_path() . '/Docsets/HelloWorld.php');
    }

    /** @test */
    public function it_can_be_called_with_or_without_argument()
    {
        $this->artisan('new');

        $this->artisan('new hello-world');

        $this->assertTrue(true);
    }

    /** @test */
    public function calling_the_command_without_argument_will_create_the_Rick_Astley_docset_class_file()
    {
        $this->assertStringContainsString('namespace Godbout\DashDocsetBuilder\Docsets', $this->originalRickAstleyContent);
        $this->assertStringNotContainsString('namespace App\Docset', $this->originalRickAstleyContent);

        $this->artisan('new');

        $generatedClassContent = File::get(app_path() . '/Docsets/RickAstley.php');
        $this->assertStringContainsString('namespace App\Docset', $generatedClassContent);
        $this->assertStringNotContainsString('namespace Godbout\DashDocsetBuilder\Docsets', $generatedClassContent);
    }

    /** @test */
    public function calling_with_argument_will_create_a_docset_class_file()
    {
        $helloWorldClassFile = app_path() . '/Docsets/HelloWorld.php';

        $this->assertFalse(File::exists($helloWorldClassFile));

        $this->artisan('new hello-world');

        $this->assertTrue(File::exists($helloWorldClassFile));
    }

    /** @test */
    public function the_docset_class_file_created_while_passing_an_argument_gets_its_placeholders_replaced_by_the_argument()
    {
        $className = 'Alfred4';
        $codeName = 'alfred-4';
        $docsetName = 'Alfred 4';
        $url = 'alfred-4.com';

        $this->artisan('new alfred-4');

        $alfred4FileContent = File::get(app_path() . '/Docsets/Alfred4.php');

        $this->assertStringContainsString('class Alfred4', $alfred4FileContent);
        $this->assertStringContainsString("CODE = 'alfred-4'", $alfred4FileContent);
        $this->assertStringContainsString("NAME = 'Alfred 4'", $alfred4FileContent);
        $this->assertStringContainsString("URL = 'alfred-4.com'", $alfred4FileContent);
    }
}
