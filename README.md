<h1 align="center">DASH DOCSET BUILDER</h1>

<p align="center">
    <a href="https://packagist.org/packages/godbout/dash-docset-builder"><img src="https://poser.pugx.org/godbout/dash-docset-builder/v/stable" alt="Latest Stable Version"></a>
    <a href="https://travis-ci.com/godbout/dash-docset-builder"><img src="https://img.shields.io/travis/com/godbout/dash-docset-builder/master.svg?style=flat-square" alt="Build Status"></a>
    <a href="https://scrutinizer-ci.com/g/godbout/dash-docset-builder"><img src="https://img.shields.io/scrutinizer/g/godbout/dash-docset-builder.svg?style=flat-square" alt="Quality Score"></a>
    <a href="https://scrutinizer-ci.com/g/godbout/dash-docset-builder"><img src="https://scrutinizer-ci.com/g/godbout/dash-docset-builder/badges/coverage.png?b=master" alt="Code Coverage"></a>
    <a href="https://packagist.org/packages/godbout/dash-docset-builder"><img src="https://poser.pugx.org/godbout/dash-docset-builder/downloads" alt="Total Downloads"></a>
</p>

<p align="center">
    That shit creates Dash Docsets for you. Of course you still need to declare some stuff in your own class. That shit doesn't read minds yet. Read more below.
</p>

___

# DASH IS LOVE

When coding with Sublime + Chrome in Split View, [Dash](http://kapeli.com/) is the savior ❤️

# CREATE YOUR OWN DOCSET

## Your Docset Class

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

The Builder provides a generic way to download your Docset docs. It'll use a sitemap.xml if found, else it'll go through your Docset index. If you need to provide your own way of downloading your docs, you can define a `grab()` method in your Docset. The Builder will catch it and use your custom method instead.

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

## Build your Docset

Once your class is set up, run:
```bash
php dash-docset build your_docset_class
```

This will download the doc, package it into a .docset file, and create an archive—useful if you want to contribute it to Dash—in the storage folder.

## ENJOY

You can then add your docset into Dash for personal use, or [contribute it](https://github.com/Kapeli/Dash-User-Contributions).

# DOCSETS GENERATED WITH THIS BUILDER

See the [Dash Docsets](https://github.com/godbout/dash-docsets) repo.
