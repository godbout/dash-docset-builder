<?php

namespace App\Commands;

use LaravelZero\Framework\Commands\Command;

class GrabCommand extends Command
{
    const DOCS = [
        'tailwindcss' => 'https://next.tailwindcss.com'
    ];

    /**
     * The signature of the command.
     *
     * @var string
     */
    protected $signature = 'grab {docs}';

    /**
     * The description of the command.
     *
     * @var string
     */
    protected $description = 'Download the docs specified as argument.';

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

        $this->task('Download started', function () {
            return true;
        });

        $this->download($doc);

        $this->task('Download finished', function () {
            return true;
        });
    }

    protected function isValid($doc)
    {
        return array_key_exists($doc, self::DOCS);
    }

    protected function download($doc)
    {
        shell_exec(
            "wget \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --quiet \
            --show-progress \
            --directory-prefix=storage/$doc \
            " . self::DOCS[$doc]
        );
    }
}
