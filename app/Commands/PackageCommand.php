<?php

namespace App\Commands;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use LaravelZero\Framework\Commands\Command;

class PackageCommand extends Command
{
    const DOCS = [
        'tailwindcss' => [
            'code' => 'tailwindcss',
            'name' => 'Tailwind CSS',
            'url' => 'next.tailwindcss.com'
        ]
    ];

    /**
     * The signature of the command.
     *
     * @var string
     */
    protected $signature = 'package {docs}';

    /**
     * The description of the command.
     *
     * @var string
     */
    protected $description = 'Package the docs specified as argument as a Dash docset file.';

    /**
     * Execute the console command.
     *
     * @return mixed
     */
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

    protected function isValid($doc)
    {
        return array_key_exists($doc, self::DOCS);
    }

    protected function package($doc)
    {
        $this->createDocsetFile($doc);

        $this->copyDocFiles($doc);

        $this->createInfoPlist($doc);

        $this->createSQLiteIndex($doc);
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
    <key>isDashDocset</key>
    <true/>
</dict>
</plist>
EOT;

        Storage::put("{$doc['code']}/{$doc['code']}.docset/Contents/Info.plist", $infoPlist);
    }

    protected function createSQLiteIndex($doc)
    {
        Config::set(
            'database.connections.sqlite.database',
            "storage/{$doc['code']}/{$doc['code']}.docset/Contents/Resources/docSet.dsidx"
        );

        Storage::put(
            "{$doc['code']}/{$doc['code']}.docset/Contents/Resources/docSet.dsidx",
            null
        );

        $this->callSilent('migrate');
    }
}
