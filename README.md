# The Pf2ools Data Repository

A project in the [Pf2ools](https://github.com/Pf2ools) ecosystem to represent all Pathfinder 2nd Edition game content in JSON format.

- [Overview](#overview)
  - [Data structure](#data-structure)
  - [Directory structure](#directory-structure)
  - [Conventions](#conventions)
- [Using the data](#using-the-data)
  - [Bundles and indexes](#bundles-and-indexes)
  - [Versioning](#versioning)
- [Contributing](#contributing)
- [Legal](#legal)

## Overview

All the actual game data is in the [`data/`](./data/) directory.

### Directory structure

All Paizo-made content is in the [`core/`](./data/core/) directory, and all homebrew content is in the [`homebrew/`](./data/homebrew/) directory. In each of these directories, there is one directory for each source, named according to its title. In each of these directories, there is a source file which describes that source, and further directories for each datatype that source contains. The actual content-data files are within these lattermost directories.

In addition to [`core/`](./data/core/) and [`homebrew/`](./data/homebrew/), there is also a [`common/`](./data/common/) directory. which contains directories for any [license](./data/common/license/) or [source group](./data/common/sourceGroup/) files.

### Data structure

All files are JSON objects with the following properties:

- `type`, which defines the type of data described;
- `name` or `title`, which defines the content's name;
- `data`, which represents the content itself.

There might also be a `tags` property, which contains various categories and variables that don't directly define the statblock itself.

The exact form of each of these properties can be investigated over in the [Pf2ools Schema](https://github.com/Pf2ools/pf2ools-schema).

### Conventions

Pf2ools follows the following standardisation conventions:

- Files _must_ be encoded with UTF-8 (without BOM), use "LF" as the end-of-line sequence, and end with a newline.
- Files _must_ use tabs for indentation and have no trailing whitespace.
- Filenames _must_ match the contained data's `name.display` or use the format `<name.display> - <name.specifier>.json` (e.g. `Attack of Opportunity - Swashbuckler.json`) if `specifier` is defined. The only exceptions are source, source group, and license files (which are all named following their `title.full`). Filesystem-unsafe characters (e.g. "?", ":") _must_ be replaced with an underscore "\_".

## Using the data

The data is yours! Although the master [data](./data/) is stored in a 'statblock-by-statblock' manner, this is primarily for ease of maintenance. For developer- and application-use, you may find more use with it in another format.

### Bundles and indexes

The [`bundles/`](./bundles) directory contains a series of directories containing JSON files. These files mirror the master [data](./data/), but are (as you might expect) bundled together for ease of use in other applications.

The [`indexes/`](./indexes) directory contains a series of JSON files that serve as indexes of the existing data. Some of these are used internally, but you may generally find them easier to iterate through instead of the files directly!

In both cases, the files should be named fairly intutiively.

_Note:_ you can run the generating scripts yourself on a local copy, but you must ensure that you have [PowerShell 7](https://github.com/PowerShell/PowerShell) installed. It's recommended that you use `npm run <script>` to call the commands. Some scripts accept optional parameters; see the comments at the top of each for more information; you can use them via `npm run <script> -- -Parameter 'value' -Switch`.

### Versioning

Pf2ools gets better all the time!

Although bundled releases will be published from time to time, this will typically only occur when something 'substantial' has happened. For instance, there'll be a new release when we finish converting a new set of core content or update the schema... or if it's just been a while and there's a lot of typo fixes pending. This is admittedly fairly arbitrary, but we'll aim for a new release _at least_ once every 4 months.

The [`bundles/`](./bundles/) and [`indexes/`](./indexes/) directories will be regenerated only when a new release is published.

## Contributing

Please see [`CONTRIBUTING.md`](./CONTRIBUTING.md).

## Legal

Content maintained by Pf2ools is reproduced without claim of ownership and under its respective license. Please refer to each source object's `license` property and cross-reference with the respective file in the [`data/common/license/`](./data/common/license/) directory for more information.

Content published by Paizo Inc. is reproduced in accordance with the [Community Use Policy](./CUP.license).

All other original content (e.g. [scripts](./scripts/)) is licensed under the [MIT license](./LICENSE).
