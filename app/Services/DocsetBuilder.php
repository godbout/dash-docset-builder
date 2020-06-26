<?php

namespace Godbout\DashDocsetBuilder\Services;

use LaravelZero\Framework\Commands\Command;
use Godbout\DashDocsetBuilder\Contracts\Docset;
use Illuminate\Console\Command as LaravelCommand;

class DocsetBuilder
{
    protected $docset;

    protected $grabber;
    protected $packager;
    protected $archiver;

    protected $command;


    public function __construct(Docset $docset, ?Command $command = null)
    {
        $this->docset = $docset;

        $this->grabber = new DocsetGrabber($this->docset);
        $this->packager = new DocsetPackager($this->docset);
        $this->archiver = new DocsetArchiver($this->docset);

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
        if (method_exists($this->docset, 'grab')) {
            return $this->grabFromDocset();
        }

        if ($this->grabber->sitemapExists()) {
            return $this->grabFromSitemap();
        }

        return $this->grabFromIndex();
    }

    protected function grabFromDocset()
    {
        return $this->command->task('  - Downloading doc from docset custom instructions', function () {
            return $this->docset->grab();
        });
    }

    protected function grabFromSitemap()
    {
        return $this->command->task('  - Downloading doc from sitemap', function () {
            return $this->grabber->grabFromSitemap();
        });
    }

    protected function grabFromIndex()
    {
        return $this->command->task('  - Downloading doc from index', function () {
            return $this->grabber->grabFromIndex();
        });
    }

    public function package()
    {
        $this->command->task('  - Remove previous .docset', function () {
            $this->packager->removePreviousDocsetFile();
        });

        $this->command->task('  - Create new .docset', function () {
            return $this->packager->createDocsetFile();
        });

        $this->command->task('  - Copy original doc files', function () {
            return $this->packager->copyDocFiles();
        });

        $this->command->task('  - Create Info.plist', function () {
            return $this->packager->createInfoPlist();
        });

        $this->command->task('  - Populate SQLiteIndex', function () {
            return $this->packager->createAndPopulateSQLiteIndex();
        });

        $this->command->task('  - Format doc files for Dash', function () {
            return $this->packager->formatDocFiles();
        });

        $this->command->task('  - Copy icons', function () {
            $this->packager->copyIcons();
        });
    }

    public function archive()
    {
        $this->command->task('  - Archiving package', function () {
            return $this->archiver->archive();
        });
    }
}
