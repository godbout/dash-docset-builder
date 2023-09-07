<h1 align="center">DASH DOCSET BUILDER</h1>

<p align="center">
    <a href="https://packagist.org/packages/godbout/dash-docset-builder"><img src="https://img.shields.io/packagist/v/godbout/dash-docset-builder" alt="latest stable version"></a>
    <a href="https://github.com/godbout/dash-docset-builder/actions"><img src="https://img.shields.io/github/actions/workflow/status/godbout/dash-docset-builder/main.yml?branch=master" alt="build status"></a>
    <a href="https://scrutinizer-ci.com/g/godbout/dash-docset-builder"><img src="https://img.shields.io/scrutinizer/quality/g/godbout/dash-docset-builder" alt="quality score"></a>
    <a href="https://scrutinizer-ci.com/g/godbout/dash-docset-builder"><img src="https://img.shields.io/scrutinizer/coverage/g/godbout/dash-docset-builder" alt="code coverage"></a>
    <a href="https://packagist.org/packages/godbout/dash-docset-builder"><img src="https://img.shields.io/packagist/dt/godbout/dash-docset-builder" alt="total downloads"></a>
</p>

<p align="center">
    That shit creates Dash Docsets for you. Of course you still need to declare some stuff in your own class. That shit doesn't read minds yet. See more below.
</p>

___

## DASH IS LOVE

When coding with Sublime + Chrome in Split View, [Dash](http://kapeli.com/) is the savior ❤️

## HOW TO USE (ALSO KNOWN AS USAGE)

### Install the awesome tool (ambiguous meaning)

```bash
composer require godbout/dash-docset-builder
```

### Generate your pretty Docset class
```bash
dash-docset new my-pretty-docset
```

You now have a beautiful `MyPrettyDocset` class that you're gonna have to edit. See below.

### Edit your pretty Docset class

Your Docset Class has to extend the [BaseDocset class](https://github.com/godbout/dash-docset-builder/blob/master/app/Docsets/BaseDocset.php) that implements the [Docset interface](https://github.com/godbout/dash-docset-builder/blob/master/app/Contracts/Docset.php). That allows the Builder to make your Docset with just a little configuration.

Your Docset Class has to define the following constants:

```php
// To generate the docset filename
public const CODE = 'tailwindcss';
// What name will show up in Dash
public const NAME = 'Tailwind CSS';
// Where to download the doc from
public const URL = 'tailwindcss.com';
// What page should the docset show by default
public const INDEX = 'installation.html';
// A link to try the service/app, if any
public const PLAYGROUND = 'https://codesandbox.io/s/github/lbogdan/tailwindcss-playground';
// Where to grab the icon in 16x16 res
public const ICON_16 = 'favicon-16x16.png';
// Where to grab the icon in 32x32 res
public const ICON_32 = 'favicon-32x32.png';
// List of external domains where images or other files have to
// be downloaded, if not from URL defined above
public const EXTERNAL_DOMAINS = [
    'refactoring-ui.nyc3.cdn.digitaloceanspaces.com',
    'jsdelivr.net',
    'code.jquery.com',
    'rsms.me',
    'googleapis.com',
];
```

Then there are two mandatory methods to define:

```php
/**
 * This method is responsible for generating the Dash Table of Contents
 *
 * For each HTML file of your downloaded doc, this method will be called.
 * You have to parse the file (how you want) and return a collection of
 * entries. See Docsets in
 * https://github.com/godbout/dash-docsets/tree/master/app/Docsets
 * for examples.
 */
public function entries(string $file): Collection
{
    $crawler = HtmlPageCrawler::create(Storage::get($file));

    $entries = collect();
    $entries = $this->generateEntries($crawler, $file);
        
    return $entries;
}

/**
 * This method is responsible for formatting the doc for Dash
 *
 * For each HTML file of your downloaded doc, this method will be called.
 * You have to update the content of the file and return that content.
 * The file is passed as argument rather than its content because sometimes
 * the file name is the only way you have to generate the Dash Online Redirection.
 * See Docsets in 
 * https://github.com/godbout/dash-docsets/tree/master/app/Docsets
 * for examples.
 */
public function format(string $file): string
{
    $crawler = HtmlPageCrawler::create(Storage::get($file));

    $this->modifyHtml($crawler, $file);

    return $crawler->saveHTML();
}
```

The Builder provides a generic way to download your Docset docs. It'll use a `sitemap.xml` if found, else it'll go through your Docset index. If you need to provide your own way of downloading your docs, you can define a `grab()` method in your Docset. The Builder will catch it and use your custom method instead.

```php
public function grab(): bool
{
    system(
        "wget doc.tiki.org/All-the-Documentation \
            --mirror \
            -e robots=off \
            --header 'Cookie: javascript_enabled_detect=true' \
            --reject-regex='/Plugins-|Plugins\.html|fullscreen=|PDF\.js|tikiversion=|comzone=|structure=|wp_files_sort_mode[0-9]=|offset=|\?refresh|\?session_filters|\?sort_mode' \
            --accept-regex='/Plugin|/LIST|Tiki_org_family|\.css|\.js|\.jpg|\.png|\.gif|\.svg|\.ico|\.webmanifest' \
            --page-requisites \
            --adjust-extension \
            --convert-links \
            --span-hosts \
            --domains={$this->externalDomains()} \
            --directory-prefix=storage/{$this->downloadedDirectory()}",
        $result
    );

    return $result === 0;
}
```

### Build your Docset

Once your class is set up, run:
```bash
dash-docset build my-pretty-docset
```

This will download the doc, package it into a .docset file, and create an archive—useful if you want to contribute it to Dash—in the storage folder.

## ENJOY

Enjoy your new fresh Docset and maybe also share it with the community that would be nice kiss kiss: https://github.com/Kapeli/Dash-User-Contributions.

## DOCSETS GENERATED WITH THIS BUILDER

Elderlies go first:
* [Laravel-Zero](https://github.com/godbout/laravel-zero-dash-docset)
* [Jigsaw by Tighten](https://github.com/godbout/jigsaw-dash-docset)
* [Tailwind CSS](https://github.com/godbout/tailwindcss-dash-docset)
* [Tiki](https://github.com/godbout/tiki-dash-docset)
* ~~[Stripe](https://github.com/godbout/dash-docset-builder/tree/stripe/storage/stripe)~~ — **DECEASED**
* ~~[Stripe API](https://github.com/godbout/dash-docset-builder/tree/stripe-api/storage/stripe-api)~~ — **DECEASED**
* [Ploi API](https://github.com/godbout/ploi-api-dash-docset)
* [Bulma](https://github.com/godbout/bulma-dash-docset)
* [Alfred 4](https://github.com/godbout/alfred-dash-docset)
* [Chart.js](https://github.com/godbout/chartjs-dash-docset)
* [Alpine.js](https://github.com/godbout/alpinejs-dash-docset)
* [chartjs-plugin-datalabels](https://github.com/godbout/chartjs-plugin-datalabels-dash-docset)
* [webpack](https://github.com/godbout/webpack-dash-docset)
* [Laravel Mix](https://github.com/godbout/laravel-mix-dash-docset)
