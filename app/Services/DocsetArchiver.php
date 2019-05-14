<?php

namespace App\Services;

use App\Contracts\Docset;

class DocsetArchiver
{
    public $docset;


    public function __construct(Docset $docset)
    {
        $this->docset = $docset;
    }

    public function archive()
    {
        $archiveFile = "{$this->docset->code()}/{$this->docset->code()}.tgz";

        return system(
            "tar \
            --exclude='.DS_Store' \
            -czf \
            storage/$archiveFile \
            storage/{$this->docset->file()}"
        );
    }
}
