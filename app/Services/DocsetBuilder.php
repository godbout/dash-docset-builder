<?php

namespace App\Services;

use App\Contracts\Docset;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use LaravelZero\Framework\Commands\Command;

class DocsetBuilder
{
    public function build(Docset $docset, Command $command)
    {
        $this->grab($docset, $command);
        $this->package($docset, $command);

        return;
    }

    public function grab(Docset $docset, Command $command)
    {
        $command->task('  - Downloading online doc', function () use ($docset, $command) {
            $command->line(PHP_EOL);

            return passthru(
                "httrack 'https://{$docset->url()}' \
                --path 'storage/{$docset->code()}/docs' \
                --connection-per-second=50 \
                --sockets=80 \
                --keep-alive \
                --display \
                --verbose \
                --advanced-progressinfo \
                --disable-security-limits \
                -s0 \
                -o0 \
                -F 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36' \
                --max-rate=0 \
                --depth=5"
            );
        });
    }

    public function package(Docset $docset, Command $command)
    {
        $command->task('  - Remove previous .docset', function () use ($docset) {
            return $this->removePreviousDocsetFile($docset);
        });

        $command->task('  - Create new .docset', function () use ($docset) {
            return $this->createDocsetFile($docset);
        });

        $command->task('  - Copy original doc files', function () use ($docset) {
            $this->copyDocFiles($docset);
        });

        $command->task('  - Create Info.plist', function () use ($docset) {
            $this->createInfoPlist($docset);
        });

        $command->task('  - Populate SQLiteIndex', function () use ($docset) {
            $this->createAndPopulateSQLiteIndex($docset);
        });

        $command->task('  - Format doc files for Dash', function () use ($docset) {
            $this->formatDocFiles($docset);
        });

        $command->task('  - Copy icons', function () use ($docset) {
            $this->copyIcons($docset);
        });
    }

    protected function removePreviousDocsetFile(Docset $docset)
    {
        Storage::deleteDirectory(
            $this->docsetFile($docset)
        );
    }

    protected function createDocsetFile(Docset $docset)
    {
        Storage::makeDirectory(
            $this->docsetInnerDirectory($docset)
        );
    }

    protected function copyDocFiles(Docset $docset)
    {
        File::copyDirectory(
            "storage/{$this->docsetDownloadedDirectory($docset)}",
            "storage/{$this->docsetInnerDirectory($docset)}"
        );
    }

    protected function createInfoPlist(Docset $docset)
    {
        $infoPlist = <<<EOT
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleIdentifier</key>
    <string>{$docset->code()}</string>
    <key>CFBundleName</key>
    <string>{$docset->name()}</string>
    <key>DocSetPlatformFamily</key>
    <string>{$docset->code()}</string>
    <key>dashIndexFilePath</key>
    <string>index.html</string>
    <key>DashDocSetFallbackURL</key>
    <string>{$docset->url()}</string>
    <key>DashDocSetPlayURL</key>
    <string>{$docset->playground()}</string>
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
            $this->docsetInfoPlistFile($docset),
            $infoPlist
        );
    }

    protected function createAndPopulateSQLiteIndex(Docset $docset)
    {
        Config::set(
            'database.connections.sqlite.database',
            "storage/{$this->docsetDatabaseFile($docset)}"
        );

        $this->createSQLiteIndex($docset);

        $this->populateSQLiteIndex($docset);
    }

    protected function createSQLiteIndex(Docset $docset)
    {
        Storage::put(
            $this->docsetDatabaseFile($docset),
            null
        );

        Artisan::call('migrate');
    }

    protected function populateSQLiteIndex(Docset $docset)
    {
        $html = Storage::get(
            "{$this->docsetInnerDirectory($docset)}/index.html"
        );

        foreach ($docset->entries($html) as $entry) {
            DB::table('searchIndex')->insert([
                'name' => $entry['name'],
                'type' => $entry['type'],
                'path' => $entry['path']
            ]);
        }
    }

    protected function formatDocFiles(Docset $docset)
    {
        $files = Storage::Allfiles(
            $this->docsetInnerDirectory($docset)
        );

        foreach ($files as $file) {
            if (substr($file, -5) === '.html') {
                Storage::put(
                    $file,
                    $docset->format(Storage::get($file))
                );
            }
        }
    }

    protected function copyIcons($docset)
    {
        Storage::copy(
            "{$this->docsetDownloadedDirectory($docset)}/{$docset->icon16()}",
            "{$this->docsetFile($docset)}/icon.png"
        );

        Storage::copy(
            "{$this->docsetDownloadedDirectory($docset)}/{$docset->icon32()}",
            "{$this->docsetFile($docset)}/icon@2x.png"
        );
    }

    protected function docsetFile(Docset $docset)
    {
        return "{$docset->code()}/{$docset->code()}.docset";
    }

    protected function docsetInnerDirectory(Docset $docset)
    {
        return "{$docset->code()}/{$docset->code()}.docset/Contents/Resources/Documents";
    }

    protected function docsetDownloadedDirectory(Docset $docset)
    {
        return "{$docset->code()}/docs/{$docset->url()}";
    }

    protected function docsetInfoPlistFile(Docset $docset)
    {
        return "{$this->docsetFile($docset)}/Contents/Info.plist";
    }

    protected function docsetDatabaseFile(Docset $docset)
    {
        return "{$this->docsetFile($docset)}/Contents/Resources/docSet.dsidx";
    }
}
