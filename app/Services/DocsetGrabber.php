<?php

namespace Godbout\DashDocsetBuilder\Services;

use Godbout\DashDocsetBuilder\Contracts\Docset;

final class DocsetGrabber
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
            "echo; wget {$this->docset->url()}/sitemap.xml --quiet --output-document - | \
            egrep --only-matching '{$this->docset->url()}[^<]+' | \
            wget --input-file - {$this->wgetOptions()}",
            $result
        );

        return $result === 0;
    }

    public function grabFromIndex()
    {
        system(
            "echo; wget {$this->docset->url()} {$this->wgetOptions()}",
            $result
        );

        return $result === 0;
    }

    protected function wgetOptions()
    {
        return "--mirror \
            --trust-server-names \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --span-hosts \
            --domains={$this->docset->externalDomains()} \
            --directory-prefix=storage/{$this->docset->downloadedDirectory()} \
            -e robots=off \
            --quiet \
            --show-progress";
    }
}
