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
        $archiveDirectory = "storage/{$this->docset->code()}";

        system(
            "tar \
            --exclude='.DS_Store' \
            -czf \
            $archiveDirectory/{$this->docset->code()}.tgz \
            -C $archiveDirectory \
            {$this->docset->code()}.docset",
            $result
        );

        return $result == 0;
    }
}
