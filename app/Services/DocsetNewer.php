<?php

namespace Godbout\DashDocsetBuilder\Services;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;

final class DocsetNewer
{
    public function new(string $newDocset = null)
    {
        $userDocsetsDirectory = $this->makeUserDocsetsDirectoryIfNeeded();

        if (! $newDocset) {
            return $this->generateRickAstleyDocsetClass($userDocsetsDirectory);
        }

        return $this->generateUserArgumentDocsetClass($userDocsetsDirectory, $newDocset);
    }

    protected function makeUserDocsetsDirectoryIfNeeded()
    {
        $userDocsetsDirectory = app_path() . '/../../../../app/Docsets';

        /**
         * Dirty shit to be able to run tests on this repo
         */
        if (! Str::contains($userDocsetsDirectory, '/vendor/godbout/dash-docset-builder/')) {
            $userDocsetsDirectory = Str::replaceFirst('/../../../../app', '', $userDocsetsDirectory);
        }

        File::makeDirectory($userDocsetsDirectory, 0755, true, true);

        return $userDocsetsDirectory;
    }

    protected function generateRickAstleyDocsetClass(string $userDocsetsDirectory)
    {
        return File::copy(
            app_path() . '/Services/stubs/RickAstley.stub',
            $userDocsetsDirectory . '/RickAstley.php'
        );
    }

    protected function generateUserArgumentDocsetClass(string $userDocsetsDirectory, string $argument)
    {
        $docsetStubContent = File::get(app_path() . '/Services/stubs/NewDocset.stub');

        $docsetStubContent = strtr($docsetStubContent, [
            '{{ class }}' => Str::studly($argument),
            '{{ code }}' => Str::kebab($argument),
            '{{ name }}' => str_replace('-', ' ', Str::title($argument)),
            '{{ url }}' => Str::lower($argument) . '.com',
        ]);

        return File::put(
            $userDocsetsDirectory . '/' . Str::studly($argument) . '.php',
            $docsetStubContent
        );
    }
}
