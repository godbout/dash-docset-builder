<?php

namespace App\Services;

use App\Contracts\Docset;

class DocsetGrabber
{
    public $docset;


    public function __construct(Docset $docset)
    {
        $this->docset = $docset;
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
            wget --input-file - {$this->wgetOptions()}",
            $result
        );

        return $result == 0;
    }

    public function grabFromIndex()
    {
        system(
            "wget {$this->docset->url()} {$this->wgetOptions()}",
            $result
        );

        return $result == 0;
    }

    protected function wgetOptions()
    {
        return "--mirror \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --no-directories \
            --span-hosts \
            --domains={$this->docset->externalDomains()} \
            --level=1 \
            --quiet \
            --directory-prefix=storage/{$this->docset->downloadedDirectory()}";
    }
}
