<?php

namespace Godbout\DashDocsetBuilder\Services;

use Godbout\DashDocsetBuilder\Contracts\Docset;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
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
            '<?php blah blah blah'
        );

        return true;
    }
}
