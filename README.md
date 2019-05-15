# DASH IS LOVE

When coding with Sublime + Chrome in Split View, [Dash](http://kapeli.com/) is the savior ❤️

# DASH DOCSET BUILDER

I made that builder for myself and was not planning to release it, but if you want to create a docset without bothering and you play with PHP, you might find it useful.

# CREATE YOUR OWN DOCSET

## Your Docset Class

Your Docset Class has to extend the [BaseDocset class](https://github.com/godbout/dash-docset-builder/blob/master/app/Docsets/BaseDocset.php) that implements the [Docset interface](https://github.com/godbout/dash-docset-builder/blob/master/app/Contracts/Docset.php). That allows the builder to make your Docset with just a little configuration.

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
public const EXTERNAL_DOMAINS = [];
```

>**Note**: the base directory is the directory where the doc is downloaded, and the whole site is flattened (no folder), so you can just define your INDEX and ICONS just by their names.


Then there are two methods to define:

```php
/**
 * This method is responsible for generating the Dash Table of Contents
 *
 * For each HTML file of your downloaded doc, this method will be called.
 * You have to parse the file (how you want) and return a collection of
 * entries. See Docsets included as examples.
 */
public function entries(string $file): Collection
{
    $entries = collect();

    // Parse the file and build your entries...
        
    return $entries;
}

/**
 * This method is responsible for formatting the doc for Dash
 *
 * For each HTML file of your downloaded doc, this method will be called.
 * You receive in argument the HTML of those files (not the files themselves!),
 * you just have to modify and return it. See Docsets included as examples.
 */
public function format(string $html): string
{
    return $this->modifyHtml($html);
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
