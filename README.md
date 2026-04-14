# Export BibTeX to Clipboard in Zotero - "BibClip"

A [Zotero](https://www.zotero.org/) plugin for one-click BibTeX copying with LaTeX-safe encoding.

> **Written by [Claude](https://claude.ai) (Anthropic), with iterative refinement through conversation.**

## Features

Select one or more items in Zotero, right-click, and choose **Copy as BibTeX**. The entry is copied to the clipboard, ready to paste into any `.bib` file. BibClip handles the following LaTeX formatting:

- Accented characters are converted to LaTeX commands (`ü` → `{\"u}`, `é` → `{\'e}`, etc.)
- Special characters are escaped (`&` → `\&`, `#` → `\#`, `%` → `\%`)
- Rogue Unicode whitespace inserted by Zotero's CSL engine is removed
- Citation keys are auto-generated if missing, and are always unique across the library

## Installation

**Requirements:** Zotero 8.0 or later

1. Download the latest `bibclip-x.x.x.xpi` from the [Releases](https://github.com/shunzi-work/zotero-bibtex-to-clipboard/releases) page
2. In Zotero: **Tools → Plugins → ⚙️ → Install Plugin from File...**
3. Select the `.xpi` file

## Usage

1. Select one or more items in your Zotero library
2. Right-click → **Copy as BibTeX**
3. Paste into your `.bib` file

### Citation key behaviour

BibClip uses Zotero's built-in **Citation Key** field (visible in the item Info panel):

- If a citation key is already set, it is used as-is 
- If the field is empty, BibClip generates a key, saves it to the field, and then exports

### Citation key format

```
firstauthor_secondauthor_year
```

| Authors | Year | Generated key |
|---|---|---|
| Smith | 2023 | `smith_2023` |
| Smith, Jones | 2021 | `smith_jones_2021` |
| Müller, García | 2019 | `muller_garcia_2019` |
| Smith, Jones, Brown | 2020 | `smith_jones_2020` |

## How BibTeX fields are generated

BibClip uses the bundled `bibtex.csl` file (a [custom CSL style](https://github.com/shunzi-work/styles)) to render BibTeX fields via Zotero's CSL engine. This is the same engine Zotero uses for all citation formatting, so field content is accurate and consistent. The CSL is automatically installed into Zotero's style manager on first use — you don't need to install it manually.

If the CSL engine is unavailable for any reason, BibClip falls back to reading fields directly from Zotero's item data using the same field mapping.

## Text Processing
### Accent to LaTeX Conversion (in field values)

| Unicode | LaTeX     |
| :------ | :-------- |
| `ü`     | `{"u}` |
| `é`     | `{\'e}` |
| `ñ`     | `{\~{n}}` |
| `ç`     | `{\c{c}}` |
| `ø`     | `{\o}`   |
| `ł`     | `{\l}`   |
| `ß`     | `{\ss}`  |
| `–`     | `--`      |
| `—`     | `---`     |
| `α`     | `{$\alpha$}` |

### Special Character Escaping

| Input | Output |
| :---- | :----- |
| `&`   | `\&`  |
| `#`   | `\#`  |
| `%`   | `\%`  |

### Rogue Whitespace Removal

Unicode characters U+202F (narrow no-break space) and U+00A0 (non-breaking space) are automatically removed if they appear before punctuation characters (i.e., `?`, `!`, `;`, `:`). These are often automatically inserted by Zotero's CSL engine when using certain locale settings, such as French.

## File structure

```
bibclip/
├── .github/
│   └── workflows/
│       └── release.yml                   — Auto-build XPI on git tag
├── .gitignore
├── manifest.json                         — Plugin identity and Zotero version range
├── bootstrap.js                          — Plugin lifecycle (startup/shutdown/window hooks)
├── prefs.js                              — Default preferences
├── README.md
└── chrome/
    ├── content/
    │   ├── bibtex.csl                    — Bundled CSL style
    │   └── scripts/
    │       └── bibclip.js                — All plugin logic
    └── locale/
        └── en-US/
            └── bibclip.ftl               — Menu label strings
```

## License

MIT — do whatever you want with it.
