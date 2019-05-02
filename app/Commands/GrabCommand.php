<?php

namespace App\Commands;

use LaravelZero\Framework\Commands\Command;

class GrabCommand extends BaseCommand
{
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

        $this->download(self::DOCS[$doc]);

        $this->task('Download finished', function () {
            return true;
        });
    }

    protected function download($doc)
    {
        shell_exec(
            "wget \
            --mirror \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --quiet \
            --show-progress \
            --directory-prefix=storage/{$doc['code']} \
            {$doc['url']}"
        );
    }
}
