<?php

namespace App\Commands;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use LaravelZero\Framework\Commands\Command;
use Symfony\Component\DomCrawler\Crawler;
use Wa72\HtmlPageDom\HtmlPage;
use Wa72\HtmlPageDom\HtmlPageCrawler;

class PackageCommand extends BaseCommand
{
    protected $signature = 'package {docs}';

    protected $description = 'Package the docs specified as argument as a Dash docset file.';


    public function handle()
    {
        $doc = $this->argument('docs');

        if (! $this->isValid($doc)) {
            $this->comment('Only the tailwindcss doc is currently available.');

            return 1;
        }

        $this->task('Package creation started', function () {
            return true;
        });

        $this->package(self::DOCS[$doc]);

        $this->task('Package creation finished', function () {
            return true;
        });
    }

    protected function package($doc)
    {
        $this->task('Remove previous .docset', function () use ($doc) {
            $this->removePreviousDocsetFile($doc);

            return true;
        });

        $this->task('Create .docset', function () use ($doc) {
            $this->createDocsetFile($doc);

            return true;
        });

        $this->task('Copy doc files', function () use ($doc) {
            $this->copyDocFiles($doc);

            return true;
        });

        $this->task('Create Info.plist', function () use ($doc) {
            $this->createInfoPlist($doc);

            return true;
        });

        $this->task('Populate SQLiteIndex', function () use ($doc) {
            $this->createAndPopulateSQLiteIndex($doc);

            return true;
        });

        $this->task('Clean doc files', function () use ($doc) {
            $this->cleanDocFiles($doc);

            return true;
        });

        $this->task('Copy icons', function () use ($doc) {
            $this->copyIcon($doc);

            return true;
        });
    }

    protected function removePreviousDocsetFile($doc)
    {
        Storage::deleteDirectory("{$doc['code']}/{$doc['code']}.docset");
    }

    protected function createDocsetFile($doc)
    {
        Storage::makeDirectory("{$doc['code']}/{$doc['code']}.docset/Contents/Resources/Documents");
    }

    protected function copyDocFiles($doc)
    {
        File::copyDirectory(
            "storage/{$doc['code']}/{$doc['url']}",
            "storage/{$doc['code']}/{$doc['code']}.docset/Contents/Resources/Documents"
        );
    }

    protected function createInfoPlist($doc)
    {
        $infoPlist = <<<EOT
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>{$doc['code']}</string>
    <key>CFBundleName</key>
    <string>{$doc['name']}</string>
    <key>DocSetPlatformFamily</key>
    <string>{$doc['code']}</string>
    <key>dashIndexFilePath</key>
    <string>index.html</string>
    <key>DashDocSetFallbackURL</key>
    <string>{$doc['url']}</string>
    <key>DashDocSetPlayURL</key>
    <string>{$doc['playground']}</string>
    <key>isJavaScriptEnabled</key>
    <true/>
    <key>isDashDocset</key>
    <true/>
</dict>
</plist>
EOT;

        Storage::put("{$doc['code']}/{$doc['code']}.docset/Contents/Info.plist", $infoPlist);
    }

    protected function createAndPopulateSQLiteIndex($doc)
    {
        Config::set(
            'database.connections.sqlite.database',
            "storage/{$doc['code']}/{$doc['code']}.docset/Contents/Resources/docSet.dsidx"
        );

        $this->createSQLiteIndex($doc);

        $this->populateSQLiteIndex($doc);
    }

    protected function createSQLiteIndex($doc)
    {
        Storage::put(
            "{$doc['code']}/{$doc['code']}.docset/Contents/Resources/docSet.dsidx",
            null
        );

        $this->callSilent('migrate');
    }

    protected function populateSQLiteIndex($doc)
    {
        $crawler = new Crawler(
            Storage::get("{$doc['code']}/{$doc['code']}.docset/Contents/Resources/Documents/index.html")
        );

        $this->populateSQLiteIndexWithGuides($crawler);

        $this->populateSQLiteIndexWithSections($crawler);
    }

    protected function populateSQLiteIndexWithGuides(Crawler $crawler)
    {
        $crawler->filter('#nav h5')->each(function (Crawler $node, $i) {
            DB::table('searchIndex')->insert([
                'name' => $node->text(),
                'type' => 'Guide',
                'path' => $node->siblings()->filter('a')->eq(0)->attr('href')
            ]);
        });
    }

    protected function populateSQLiteIndexWithSections(Crawler $crawler)
    {
        $crawler->filter('#nav li a')->each(function (Crawler $node, $i) {
            DB::table('searchIndex')->insert([
                'name' => $node->children('.relative')->text(),
                'type' => 'Section',
                'path' => $node->attr('href')
            ]);
        });
    }

    protected function cleanDocFiles($doc)
    {
        $files = Storage::Allfiles(
            "{$doc['code']}/{$doc['code']}.docset/Contents/Resources/Documents/"
        );

        foreach ($files as $file) {
            if (substr($file, -5) === '.html') {
                $page = HtmlPageCrawler::create(Storage::get($file));

                $this->removeNavbar($page, $doc);
                $this->removeLeftSidebar($page, $doc);
                $this->removeRightSidebar($page, $doc);
                $this->removeJavaScript($page, $doc);
                $this->updateCss($page, $doc);

                Storage::put($file, $page->saveHTML());
            }
        }
    }

    protected function removeNavbar($page, $doc)
    {
        $page->filter('body > div:first-child')->remove();
    }

    protected function removeLeftSidebar($page, $doc)
    {
        $page->filter('#sidebar')->remove();
    }

    protected function removeRightSidebar($page, $doc)
    {
        $page->filter('.hidden')->remove();
    }

    protected function removeJavaScript($page, $doc)
    {
        $page->filter('script')->remove();
    }

    protected function updateCss($page, $doc)
    {
        $page->filter('#app > #content')
            ->removeClass('pt-24')
            ->removeClass('pb-16')
            ->removeClass('lg:pt-28')
            ->addClass('pt-12');
    }

    protected function copyIcon($doc)
    {
        Storage::copy(
            "{$doc['code']}/{$doc['url']}/favicon-32x32.png",
            "{$doc['code']}/{$doc['code']}.docset/icon.png"
        );
    }
}
