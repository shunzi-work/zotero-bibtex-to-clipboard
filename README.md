# Export BibTeX to Clipboard in Zotero - "BibClip"

A [Zotero](https://www.zotero.org/) plugin for one-click BibTeX copying with LaTeX-safe encoding.

> **Written by [Claude](https://claude.ai) (Anthropic), with iterative refinement through conversation.**

## Features

Click the clipboard icon in the Zotero toolbar to copy selected item(s) as BibTeX, ready to paste into any `.bib` file. BibClip handles all the LaTeX formatting automatically:

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
2. Click the **clipboard icon** in the toolbar above the item list
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

Rules: max two authors · all lowercase · diacritics stripped · non-alphanumeric removed · missing year → `xxxx`

## Journal names

For journal articles, BibClip checks the item's **Journal Abbr** field first. If that field is populated, the abbreviation is used as the `journal` value. If not, the full journal name is used as a fallback.


## Settings

Open **Edit → Preferences → BibClip** (or **Zotero → Settings → BibClip** on macOS) to choose which fields to include in the BibTeX output.


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

## License

MIT — do whatever you want with it.
