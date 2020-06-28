<?php

namespace Godbout\DashDocsetBuilder\Services;

use Godbout\DashDocsetBuilder\Contracts\Docset;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

final class DocsetPackager
{
    protected $docset;


    public function __construct(Docset $docset)
    {
        $this->docset = $docset;
    }

    public function removePreviousDocsetFile()
    {
        return Storage::deleteDirectory(
            $this->docset->file()
        );
    }

    public function createDocsetFile()
    {
        return Storage::makeDirectory(
            $this->docset->innerDirectory()
        );
    }

    public function copyDocFiles()
    {
        return File::copyDirectory(
            "storage/{$this->docset->downloadedDirectory()}",
            "storage/{$this->docset->innerDirectory()}"
        );
    }

    public function createInfoPlist()
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
    <string>https://</string>
    <key>DashDocSetPlayURL</key>
    <string>{$this->docset->playground()}</string>
    <key>isJavaScriptEnabled</key>
    <true/>
    <key>isDashDocset</key>
    <true/>
    <key>DashDocSetFamily</key>
    <string>dashtoc</string>
    <key>DashDocSetDeclaredInStyle</key>
    <string>originalName</string>
</dict>
</plist>
EOT;

        return Storage::put(
            $this->docset->infoPlistFile(),
            $infoPlist
        );
    }

    public function createAndPopulateSQLiteIndex()
    {
        Config::set(
            'database.connections.sqlite.database',
            "storage/{$this->docset->databaseFile()}"
        );

        $this->createSQLiteIndex();

        $this->populateSQLiteIndex();
    }

    protected function createSQLiteIndex()
    {
        Storage::put(
            $this->docset->databaseFile(),
            null
        );

        Artisan::call('migrate');
    }

    protected function populateSQLiteIndex()
    {
        $entries = $this->docsetEntries();

        $entries->each(static function ($entry) {
            DB::table('searchIndex')->insert([
                'name' => $entry['name'],
                'type' => $entry['type'],
                'path' => $entry['path'],
            ]);
        });
    }

    protected function docsetEntries()
    {
        $files = $this->docset->htmlFiles();

        $entries = collect();

        $files->each(function ($file) use (&$entries) {
            $entries = $entries
                ->merge($this->docset->entries($file))
                ->unique(function ($entry) {
                    return $entry['name'] . $entry['type'];
                });
        });

        return $entries;
    }

    public function formatDocFiles()
    {
        $files = $this->docset->htmlFiles();

        $files->each(function ($file) {
            $formattedContent = $this->docset->format($file);
            Storage::put($file, $formattedContent);
        });
    }

    public function copyIcons()
    {
        if ($this->docset->icon16()) {
            Storage::copy(
                "{$this->docset->downloadedDirectory()}/{$this->docset->icon16()}",
                "{$this->docset->file()}/icon.png"
            );
        }

        if ($this->docset->icon32()) {
            Storage::copy(
                "{$this->docset->downloadedDirectory()}/{$this->docset->icon32()}",
                "{$this->docset->file()}/icon@2x.png"
            );
        }
    }
}
