<?php

namespace App\Commands;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Wa72\HtmlPageDom\HtmlPageCrawler;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Storage;

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

        $this->info('Package creation started');

        $this->package(self::DOCS[$doc]);

        $this->info('Package creation finished');
    }

    protected function package($doc)
    {
        $this->task(' - Remove previous .docset', function () use ($doc) {
            $this->removePreviousDocsetFile($doc);

            return true;
        });

        $this->task(' - Create new .docset', function () use ($doc) {
            $this->createDocsetFile($doc);

            return true;
        });

        $this->task(' - Copy original doc files', function () use ($doc) {
            $this->copyDocFiles($doc);

            return true;
        });

        $this->task(' - Create Info.plist', function () use ($doc) {
            $this->createInfoPlist($doc);

            return true;
        });

        $this->task(' - Populate SQLiteIndex', function () use ($doc) {
            $this->createAndPopulateSQLiteIndex($doc);

            return true;
        });

        $this->task(' - Format doc files for Dash', function () use ($doc) {
            $this->cleanDocFiles($doc);

            return true;
        });

        $this->task(' - Copy icons', function () use ($doc) {
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
    <key>DashDocSetFamily</key>
    <string>dashtoc</string>
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
        $crawler = HtmlPageCrawler::create(
            Storage::get("{$doc['code']}/{$doc['code']}.docset/Contents/Resources/Documents/index.html")
        );

        $this->populateSQLiteIndexWithGuides($crawler);

        $this->populateSQLiteIndexWithSections($crawler);
    }

    protected function populateSQLiteIndexWithGuides(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#nav h5')->each(function (HtmlPageCrawler $node) {
            DB::table('searchIndex')->insert([
                'name' => $node->text(),
                'type' => 'Guide',
                'path' => $node->siblings()->filter('a')->attr('href')
            ]);
        });
    }

    protected function populateSQLiteIndexWithSections(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#nav li a')->each(function (HtmlPageCrawler $node) {
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
                $crawler = HtmlPageCrawler::create(Storage::get($file));

                $this->removeNavbar($crawler);
                $this->removeLeftSidebar($crawler);
                $this->removeRightSidebar($crawler);
                $this->removeJavaScript($crawler);
                $this->updateCSS($crawler);
                $this->insertDashTableOfContents($crawler);

                Storage::put($file, $crawler->saveHTML());
            }
        }
    }

    protected function removeNavbar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body > div:first-child')->remove();
    }

    protected function removeLeftSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#sidebar')->remove();
    }

    protected function removeRightSidebar(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#content > div.flex > div.hidden')->remove();
    }

    protected function removeJavaScript(HtmlPageCrawler $crawler)
    {
        $crawler->filter('script')->remove();
    }

    protected function updateCSS(HtmlPageCrawler $crawler)
    {
        $this->updateTopPadding($crawler);

        $this->updateHeader($crawler);

        $this->updateContainerWidth($crawler);

        $this->updateBottomPadding($crawler);
    }

    protected function insertDashTableOfContents(HtmlPageCrawler $crawler)
    {
        $crawler->filter('h1')
            ->after('<a name="//apple_ref/cpp/Section/Top" class="dashAnchor absolute -mt-24"></a>');

        $crawler->filter('h2')->each(function (HtmlPageCrawler $node) {
            $node->after(
                '<p><a name="//apple_ref/cpp/Section/' . $node->text() . '" class="dashAnchor absolute -mt-16"></a></p>'
            );
        });
    }

    protected function updateTopPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#app > #content')
            ->removeClass('pt-24')
            ->removeClass('pb-16')
            ->removeClass('lg:pt-28')
            ->addClass('pt-2');
    }

    protected function updateHeader(HtmlPageCrawler $crawler)
    {
        $crawler->filter('#content > div.markdown')
            ->removeClass('lg:ml-0')
            ->removeClass('lg:mr-auto')
            ->removeClass('xl:mx-0')
            ->removeClass('xl:p-12')
            ->removeClass('xl:w-3/4')
            ->removeClass('max-w-3xl')
            ->removeClass('xl:px-12')
            ->addClass('pt-2');
    }

    protected function updateContainerWidth(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body > div:first-child')
            ->removeClass('max-w-screen-xl');

        $crawler->filter('#content-wrapper')
            ->removeClass('lg:static')
            ->removeClass('lg:max-h-full')
            ->removeClass('lg:overflow-visible')
            ->removeClass('lg:w-3/4')
            ->removeClass('xl:w-4/5');

        $crawler->filter('#content > div.flex > div.markdown')
            ->removeClass('xl:p-12')
            ->removeClass('max-w-3xl')
            ->removeClass('lg:ml-0')
            ->removeClass('lg:mr-auto')
            ->removeClass('xl:w-3/4')
            ->removeClass('xl:px-12')
            ->removeClass('xl:mx-0');
    }

    protected function updateBottomPadding(HtmlPageCrawler $crawler)
    {
        $crawler->filter('body')
            ->addClass('pb-8');
    }

    protected function copyIcon($doc)
    {
        Storage::copy(
            "{$doc['code']}/{$doc['url']}/favicon-32x32.png",
            "{$doc['code']}/{$doc['code']}.docset/icon.png"
        );
    }
}
