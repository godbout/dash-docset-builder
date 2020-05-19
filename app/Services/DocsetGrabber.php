<?php

namespace App\Services;

use App\Contracts\Docset;

final class DocsetGrabber
{
    public $docset;


    public function __construct(Docset $docset)
    {
        $this->docset = $docset;
    }

    public function specificPagesGiven()
    {
        return !! count($this->docset->specificPages());
    }

    public function grabFromSpecificPages()
    {
        $specificPages = implode(" ", $this->docset->specificPages());

        system(
            "wget $specificPages {$this->wgetOptions()}",
            $result
        );

        return $result === 0;
    }

    public function sitemapExists()
    {
        return @file_get_contents("https://{$this->docset->url()}/sitemap.xml");
    }

    public function grabFromSitemap()
    {
        system(
            "wget {$this->docset->url()}/sitemap.xml --quiet --output-document - | \
            egrep --only-matching '{$this->docset->url()}[^<]+' | \
            wget --input-file - --mirror {$this->wgetOptions()}",
            $result
        );

        return $result === 0;
    }

    public function grabFromIndex()
    {
        system(
            "wget {$this->docset->url()} --mirror {$this->wgetOptions()}",
            $result
        );

        return $result === 0;
    }

    protected function wgetOptions()
    {
        return "-e robots=off \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --no-directories \
            --span-hosts \
            --domains={$this->docset->externalDomains()} \
            --quiet \
            --directory-prefix=storage/{$this->docset->downloadedDirectory()}";
    }
}
