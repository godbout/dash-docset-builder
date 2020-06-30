<?php

namespace Godbout\DashDocsetBuilder\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

final class DocsetNewer
{
    protected $docsetName;

    public function __construct(?string $docsetName)
    {
        $this->docsetName = $docsetName;
    }

    public function new()
    {
        $userDocsetsDirectory = app_path() . '/../../../../app/Docsets';

        /**
         * Dirty shit to be able to run tests on this repo
         */
        if (! Str::contains($userDocsetsDirectory, '/vendor/godbout/dash-docset-builder/')) {
            $userDocsetsDirectory = Str::replaceFirst('/../../../../app', '', $userDocsetsDirectory);
        }

        File::makeDirectory($userDocsetsDirectory, 0755, true, true);

        if (! $this->docsetName) {
            File::copy(
                app_path() . '/Services/stubs/RickAstley.stub',
                $userDocsetsDirectory . '/RickAstley.php'
            );

            return true;
        }

        File::put(
            $userDocsetsDirectory . '/' . Str::studly($this->docsetName) . '.php',
            '<?php'
        );

        return true;
    }
}
