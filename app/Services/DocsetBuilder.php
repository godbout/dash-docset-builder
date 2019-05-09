<?php

namespace App\Services;

use App\Contracts\Docset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use LaravelZero\Framework\Commands\Command;
use Illuminate\Console\Command as LaravelCommand;

class DocsetBuilder
{
    protected $docset;
    protected $command;

    public function __construct(Docset $docset, Command $command = null)
    {
        $this->docset = $docset;
        $this->command = $command ?? new LaravelCommand();
    }

    public function build()
    {
        $this->grab();
        $this->package();
        $this->archive();
    }

    public function grab()
    {
        $this->command->task('  - Downloading doc', function () {
            if ($this->sitemapExists()) {
                return $this->grabFromSitemap();
            }

            return $this->grabFromIndex();
        });
    }

    public function package()
    {
        $this->command->task('  - Remove previous .docset', function () {
            return $this->removePreviousDocsetFile($this->docset);
        });

        $this->command->task('  - Create new .docset', function () {
            return $this->createDocsetFile($this->docset);
        });

        $this->command->task('  - Copy original doc files', function () {
            $this->copyDocFiles($this->docset);
        });

        $this->command->task('  - Create Info.plist', function () {
            $this->createInfoPlist($this->docset);
        });

        $this->command->task('  - Populate SQLiteIndex', function () {
            $this->createAndPopulateSQLiteIndex($this->docset);
        });

        $this->command->task('  - Format doc files for Dash', function () {
            $this->formatDocFiles($this->docset);
        });

        $this->command->task('  - Copy icons', function () {
            $this->copyIcons($this->docset);
        });
    }

    public function archive()
    {
        $this->command->task('  - Archiving package', function () {
            $archiveFile = "{$this->docset->code()}/{$this->docset->code()}.tgz";

            return system(
                "tar \
                --exclude='.DS_Store' \
                -czf \
                storage/$archiveFile \
                storage/{$this->docsetFile()}"
            );
        });
    }

    protected function sitemapExists()
    {
        return @file_get_contents("https://{$this->docset->url()}/sitemap.xml");
    }

    protected function grabFromSitemap()
    {
        return passthru(
            "wget {$this->docset->url()}/sitemap.xml --quiet --output-document - | \
            egrep --only-matching '{$this->docset->url()}[^<]+' | \
            wget --input-file - \
            --mirror \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --quiet \
            --directory-prefix=storage/{$this->docset->code()}/docs"
        );
    }

    protected function grabFromIndex()
    {
        return passthru(
            "wget {$this->docset->url()} \
            --mirror \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --quiet \
            --directory-prefix=storage/{$this->docset->code()}/docs"
        );
    }

    protected function removePreviousDocsetFile()
    {
        Storage::deleteDirectory(
            $this->docsetFile($this->docset)
        );
    }

    protected function createDocsetFile()
    {
        Storage::makeDirectory(
            $this->docsetInnerDirectory($this->docset)
        );
    }

    protected function copyDocFiles()
    {
        File::copyDirectory(
            "storage/{$this->docsetDownloadedDirectory($this->docset)}",
            "storage/{$this->docsetInnerDirectory($this->docset)}"
        );
    }

    protected function createInfoPlist()
    {
        $infoPlist = <<<EOT
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>{$this->docset->code()}</string>
    <key>CFBundleName</key>
    <string>{$this->docset->name()}</string>
    <key>DocSetPlatformFamily</key>
    <string>{$this->docset->code()}</string>
    <key>dashIndexFilePath</key>
    <string>{$this->docset->index()}</string>
    <key>DashDocSetFallbackURL</key>
    <string>{$this->docset->url()}</string>
    <key>DashDocSetPlayURL</key>
    <string>{$this->docset->playground()}</string>
    <key>isJavaScriptEnabled</key>
    <true/>
    <key>isDashDocset</key>
    <true/>
    <key>DashDocSetFamily</key>
    <string>dashtoc</string>
</dict>
</plist>
EOT;

        Storage::put(
            $this->docsetInfoPlistFile($this->docset),
            $infoPlist
        );
    }

    protected function createAndPopulateSQLiteIndex()
    {
        Config::set(
            'database.connections.sqlite.database',
            "storage/{$this->docsetDatabaseFile($this->docset)}"
        );

        $this->createSQLiteIndex($this->docset);

        $this->populateSQLiteIndex($this->docset);
    }

    protected function createSQLiteIndex()
    {
        Storage::put(
            $this->docsetDatabaseFile($this->docset),
            null
        );

        Artisan::call('migrate');
    }

    protected function populateSQLiteIndex()
    {
        $html = Storage::get(
            $this->docsetIndex($this->docset)
        );

        foreach ($this->docset->entries($html) as $entry) {
            DB::table('searchIndex')->insert([
                'name' => $entry['name'],
                'type' => $entry['type'],
                'path' => $entry['path']
            ]);
        }
    }

    protected function formatDocFiles()
    {
        $files = Storage::Allfiles(
            $this->docsetInnerDirectory($this->docset)
        );

        foreach ($files as $file) {
            if (substr($file, -5) === '.html') {
                Storage::put(
                    $file,
                    $this->docset->format(Storage::get($file))
                );
            }
        }
    }

    protected function copyIcons()
    {
        if ($this->docset->icon16()) {
            Storage::copy(
                "{$this->docsetDownloadedDirectory($this->docset)}/{$this->docset->icon16()}",
                "{$this->docsetFile($this->docset)}/icon.png"
            );
        }

        if ($this->docset->icon32()) {
            Storage::copy(
                "{$this->docsetDownloadedDirectory($this->docset)}/{$this->docset->icon32()}",
                "{$this->docsetFile($this->docset)}/icon@2x.png"
            );
        }
    }

    public function docsetFile()
    {
        return "{$this->docset->code()}/{$this->docset->code()}.docset";
    }

    public function docsetInnerDirectory()
    {
        return "{$this->docset->code()}/{$this->docset->code()}.docset/Contents/Resources/Documents";
    }

    public function docsetIndex()
    {
        return "{$this->docsetInnerDirectory()}/{$this->docset->index()}";
    }

    public function docsetDownloadedDirectory()
    {
        return "{$this->docset->code()}/docs/{$this->docset->url()}";
    }

    public function docsetInfoPlistFile()
    {
        return "{$this->docsetFile($this->docset)}/Contents/Info.plist";
    }

    public function docsetDatabaseFile()
    {
        return "{$this->docsetFile($this->docset)}/Contents/Resources/docSet.dsidx";
    }
}
