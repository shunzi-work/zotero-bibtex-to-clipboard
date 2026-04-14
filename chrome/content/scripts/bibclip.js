/**
 * bibclip.js — BibClip v1.0.0
 *
 * A Zotero plugin for one-click BibTeX copying with LaTeX-safe encoding.
 *
 * Behaviour:
 *  - Right-click any item(s) → "Copy as BibTeX" → clipboard
 *  - Citation key: uses the item's existing Citation Key field if set;
 *    otherwise generates firstauthor_secondauthor_year (lowercase),
 *    saves it to the field, and ensures uniqueness across the library
 *  - BibTeX fields rendered via bundled CSL; falls back to native field extraction
 *  - All text fields: accented chars → LaTeX commands, HTML tags stripped,
 *    rogue Unicode whitespace removed, & # % escaped
 */

// ── Module-level constants (built once, reused on every call) ────────────────

// Suffix sequence for disambiguating duplicate base keys:
// a, b, …, z, aa, ab, …, zz  (702 entries — sufficient for any library)
var BIBCLIP_SUFFIXES = (function() {
    var letters = "abcdefghijklmnopqrstuvwxyz";
    var seq = [];
    for (var i = 0; i < letters.length; i++) {
        seq.push(letters[i]);
    }
    for (var i = 0; i < letters.length; i++) {
        for (var j = 0; j < letters.length; j++) {
            seq.push(letters[i] + letters[j]);
        }
    }
    return seq;
})();

// Accent / special character → LaTeX command map
var BIBCLIP_ACCENT_MAP = {
    // Uppercase accented
    "À":'{\\`{A}}',"Á":"{\\'A}","Â":"{\\^{A}}","Ã":"{\\~{A}}","Ä":'{\\"A}',"Å":"{\\AA}","Æ":"{\\AE}","Ç":"{\\c{C}}",
    "È":'{\\`{E}}',"É":"{\\'E}","Ê":"{\\^{E}}","Ë":'{\\"E}',"Ì":'{\\`{I}}',"Í":"{\\'I}","Î":"{\\^{I}}","Ï":'{\\"I}',
    "Ð":"{\\DH}","Ñ":"{\\~{N}}","Ò":'{\\`{O}}',"Ó":"{\\'O}","Ô":"{\\^{O}}","Õ":"{\\~{O}}","Ö":'{\\"O}',"Ø":"{\\O}",
    "Ù":'{\\`{U}}',"Ú":"{\\'U}","Û":"{\\^{U}}","Ü":'{\\"U}',"Ý":"{\\'Y}","Þ":"{\\TH}","ß":"{\\ss}",
    // Lowercase accented
    "à":'{\\`{a}}',"á":"{\\'a}","â":"{\\^{a}}","ã":"{\\~{a}}","ä":'{\\"a}',"å":"{\\aa}","æ":"{\\ae}","ç":"{\\c{c}}",
    "è":'{\\`{e}}',"é":"{\\'e}","ê":"{\\^{e}}","ë":'{\\"e}',"ì":'{\\`{i}}',"í":"{\\'i}","î":"{\\^{i}}","ï":'{\\"i}',
    "ð":"{\\dh}","ñ":"{\\~{n}}","ò":'{\\`{o}}',"ó":"{\\'o}","ô":"{\\^{o}}","õ":"{\\~{o}}","ö":'{\\"o}',"ø":"{\\o}",
    "ù":'{\\`{u}}',"ú":"{\\'u}","û":"{\\^{u}}","ü":'{\\"u}',"ý":"{\\'y}","þ":"{\\th}","ÿ":'{\\"y}',
    // Extended Latin
    "Ā":"{\\={A}}","ā":"{\\={a}}","Ă":"{\\u{A}}","ă":"{\\u{a}}","Ą":"{\\k{A}}","ą":"{\\k{a}}",
    "Ć":"{\\'C}","ć":"{\\'c}","Č":"{\\v{C}}","č":"{\\v{c}}","Ď":"{\\v{D}}","ď":"{\\v{d}}",
    "Đ":"{\\DJ}","đ":"{\\dj}","Ē":"{\\={E}}","ē":"{\\={e}}","Ę":"{\\k{E}}","ę":"{\\k{e}}","Ě":"{\\v{E}}","ě":"{\\v{e}}",
    "Ğ":"{\\u{G}}","ğ":"{\\u{g}}","Ģ":"{\\c{G}}","ģ":"{\\c{g}}",
    "Ī":"{\\={I}}","ī":"{\\={i}}","Į":"{\\k{I}}","į":"{\\k{i}}","İ":"{\\.{I}}","ı":"{\\i}",
    "Ķ":"{\\c{K}}","ķ":"{\\c{k}}","Ĺ":"{\\'L}","ĺ":"{\\'l}","Ļ":"{\\c{L}}","ļ":"{\\c{l}}","Ľ":"{\\v{L}}","ľ":"{\\v{l}}",
    "Ł":"{\\L}","ł":"{\\l}","Ń":"{\\'N}","ń":"{\\'n}","Ņ":"{\\c{N}}","ņ":"{\\c{n}}","Ň":"{\\v{N}}","ň":"{\\v{n}}",
    "Ō":"{\\={O}}","ō":"{\\={o}}","Ő":"{\\H{O}}","ő":"{\\H{o}}","Œ":"{\\OE}","œ":"{\\oe}",
    "Ŕ":"{\\'R}","ŕ":"{\\'r}","Ř":"{\\v{R}}","ř":"{\\v{r}}",
    "Ś":"{\\'S}","ś":"{\\'s}","Ş":"{\\c{S}}","ş":"{\\c{s}}","Š":"{\\v{S}}","š":"{\\v{s}}",
    "Ţ":"{\\c{T}}","ţ":"{\\c{t}}","Ť":"{\\v{T}}","ť":"{\\v{t}}",
    "Ū":"{\\={U}}","ū":"{\\={u}}","Ů":"{\\r{U}}","ů":"{\\r{u}}","Ű":"{\\H{U}}","ű":"{\\H{u}}","Ų":"{\\k{U}}","ų":"{\\k{u}}",
    "Ź":"{\\'Z}","ź":"{\\'z}","Ż":"{\\.{Z}}","ż":"{\\.{z}}","Ž":"{\\v{Z}}","ž":"{\\v{z}}","Ÿ":'{\\"Y}',
    // Greek (math mode)
    "α":"{$\\alpha$}","β":"{$\\beta$}","γ":"{$\\gamma$}","δ":"{$\\delta$}","ε":"{$\\epsilon$}",
    "ζ":"{$\\zeta$}","η":"{$\\eta$}","θ":"{$\\theta$}","λ":"{$\\lambda$}","μ":"{$\\mu$}",
    "π":"{$\\pi$}","σ":"{$\\sigma$}","τ":"{$\\tau$}","φ":"{$\\phi$}","ψ":"{$\\psi$}","ω":"{$\\omega$}",
    // Typographic punctuation
    "–":"--","—":"---","…":"{\\ldots}",
    "\u2018":"`","\u2019":"'","\u201C":"``","\u201D":"''"
};

// ── Plugin object ─────────────────────────────────────────────────────────────

BibClip = {

    id:          null,
    version:     null,
    rootURI:     null,
    initialized: false,

    MENU_ITEM_ID: "bibclip-menuitem",
    SEPARATOR_ID: "bibclip-separator",
    CSL_STYLE_ID: "http://www.zotero.org/styles/bibtex_short",

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    init({ id, version, rootURI }) {
        if (this.initialized) return;
        this.id = id;
        this.version = version;
        this.rootURI = rootURI;
        this.initialized = true;
        Zotero.log("[BibClip] Initialized v" + version);
    },

    addToAllWindows() {
        // Zotero 8: getMainWindow() returns the single main window
        try {
            var win = Zotero.getMainWindow();
            if (win && win.ZoteroPane) {
                this.addToWindow(win);
                return;
            }
        } catch(e) {}
        // Zotero 7 fallback
        var en = Services.wm.getEnumerator("navigator:browser");
        while (en.hasMoreElements()) {
            var w = en.getNext();
            if (w.ZoteroPane) this.addToWindow(w);
        }
    },

    addToWindow(window) {
        var doc = window.document;
        if (!doc || doc.getElementById(this.MENU_ITEM_ID)) return;

        var itemmenu = doc.getElementById("zotero-itemmenu");
        if (!itemmenu) {
            Zotero.log("[BibClip] zotero-itemmenu not found — skipping window");
            return;
        }

        var sep = doc.createXULElement("menuseparator");
        sep.id = this.SEPARATOR_ID;
        itemmenu.appendChild(sep);

        var menuitem = doc.createXULElement("menuitem");
        menuitem.id = this.MENU_ITEM_ID;
        menuitem.setAttribute("label", "Copy as BibTeX");
        menuitem.setAttribute("tooltiptext", "Copy LaTeX-safe BibTeX to clipboard");

        var self = this;
        menuitem.addEventListener("command", function() {
            try {
                var items = Zotero.getActiveZoteroPane().getSelectedItems();
                self._handleCommand(items || []);
            } catch(e) {
                Zotero.logError(e);
            }
        });

        itemmenu.appendChild(menuitem);
        Zotero.log("[BibClip] Menu item injected");
    },

    removeFromAllWindows() {
        // Use only one code path to avoid double-removing from the main window
        try {
            var en = Services.wm.getEnumerator("navigator:browser");
            while (en.hasMoreElements()) {
                this.removeFromWindow(en.getNext());
            }
        } catch(e) {}
    },

    removeFromWindow(window) {
        try {
            var doc = window.document;
            var sep = doc.getElementById(this.SEPARATOR_ID);
            if (sep) sep.remove();
            var item = doc.getElementById(this.MENU_ITEM_ID);
            if (item) item.remove();
        } catch(e) {}
    },

    uninit() {
        this.removeFromAllWindows();
        this.initialized = false;
    },

    // ── Command handler ───────────────────────────────────────────────────────

    _handleCommand(items) {
        var self = this;
        var regular = items.filter(function(i) {
            return !i.isNote() && !i.isAttachment();
        });

        if (!regular.length) {
            Zotero.log("[BibClip] No exportable items selected.");
            return;
        }

        // Ensure citation keys sequentially — each item must be saved before
        // the next one checks for conflicts, preventing duplicate keys in
        // same-batch selections.
        var chain = Promise.resolve();
        regular.forEach(function(item) {
            chain = chain.then(function() { return self._ensureCiteKey(item); });
        });

        chain
            .then(function() {
                // BibTeX generation can safely run in parallel once all keys are saved
                return Promise.all(regular.map(function(i) {
                    return self._generateBibtex(i);
                }));
            })
            .then(function(entries) {
                self._copyToClipboard(entries.join("\n\n"));
                var n = entries.length;
                Zotero.log("[BibClip] Copied " + n + " entr" + (n > 1 ? "ies" : "y") + " to clipboard");
            })
            .catch(function(e) {
                Zotero.logError(e);
                try {
                    Zotero.getMainWindow().alert("BibClip error:\n" + e.message);
                } catch(e2) {}
            });
    },

    // ── Citation key management ───────────────────────────────────────────────

    /**
     * If the item has no citation key, generate a unique one and save it.
     * Returns a Promise.
     */
    _ensureCiteKey(item) {
        if (item.getField("citationKey")) return Promise.resolve();
        return this._buildUniqueKey(item).then(function(key) {
            item.setField("citationKey", key);
            return item.saveTx().then(function() {
                Zotero.log("[BibClip] Assigned citationKey: " + key);
            });
        });
    },

    /**
     * Generate a base key (firstauthor_secondauthor_year, all lowercase),
     * then append letter suffixes (a, b, …, z, aa, ab, …) until unique
     * across the entire library.
     * Returns a Promise<string>.
     */
    _buildUniqueKey(item) {
        var baseKey = this._buildBaseKey(item);
        return Zotero.Items.getAll(Zotero.Libraries.userLibraryID)
            .then(function(allItems) {
                // Build a set of all citation keys already in use (excluding this item)
                var usedKeys = {};
                for (var i = 0; i < allItems.length; i++) {
                    var other = allItems[i];
                    if (!other.isRegularItem() || other.id === item.id) continue;
                    var k = other.getField("citationKey");
                    if (k) usedKeys[k] = true;
                }

                // Return base key if free
                if (!usedKeys[baseKey]) return baseKey;

                // Try suffixed candidates
                for (var j = 0; j < BIBCLIP_SUFFIXES.length; j++) {
                    var candidate = baseKey + BIBCLIP_SUFFIXES[j];
                    if (!usedKeys[candidate]) return candidate;
                }

                // Fallback: should never be reached in any real library
                return baseKey + "_" + Date.now();
            });
    },

    /**
     * Build the base citation key: firstauthor_secondauthor_year
     * Max 2 authors, all lowercase, diacritics stripped, non-alphanumeric removed.
     */
    _buildBaseKey(item) {
        var creators  = item.getCreators();
        var authorTypeId = Zotero.CreatorTypes.getID("author");
        var authors   = creators.filter(function(c) { return c.creatorTypeID === authorTypeId; });
        var pool      = authors.length ? authors : creators;

        var parts = [];
        for (var i = 0; i < Math.min(2, pool.length); i++) {
            var name = this._normalizeNameForKey(pool[i].lastName || pool[i].name || "");
            if (name) parts.push(name);
        }

        var year = this._extractYear(item.getField("date") || "");
        return (parts.length ? parts.join("_") : "unknown") + "_" + year;
    },

    _normalizeNameForKey(str) {
        return str
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");      // keep only alphanumeric
    },

    _extractYear(dateStr) {
        var m = dateStr.match(/\b(\d{4})\b/);
        return m ? m[1] : "xxxx";
    },

    // ── BibTeX generation ─────────────────────────────────────────────────────

    /**
     * Generate a full BibTeX entry string for one item.
     * Tries the bundled CSL first; falls back to native field extraction.
     */
    _generateBibtex(item) {
        var self     = this;
        var citeKey  = item.getField("citationKey");
        var entryType = this._getEntryType(item);

        return this._buildFieldsFromCSL(item)
            .then(function(fields) {
                return self._assembleBibtex(entryType, citeKey, fields);
            })
            .catch(function(e) {
                Zotero.log("[BibClip] CSL unavailable, using native fields: " + e.message);
                return self._assembleBibtex(entryType, citeKey, self._buildFieldsNative(item));
            });
    },

    _getEntryType(item) {
        var map = {
            book: "book", graphic: "book", legalCase: "book",
            legislation: "book", motionPicture: "book", song: "book",
            bookSection: "inbook",
            journalArticle: "article", magazineArticle: "article", newspaperArticle: "article",
            thesis: "phdthesis",
            manuscript: "unpublished",
            conferencePaper: "inproceedings",
            report: "techreport"
        };
        return map[Zotero.ItemTypes.getName(item.itemTypeID)] || "misc";
    },

    // ── CSL-based field rendering ─────────────────────────────────────────────

    _buildFieldsFromCSL(item) {
        var self = this;
        var style = Zotero.Styles.get(this.CSL_STYLE_ID);

        var getStyle = style
            ? Promise.resolve(style)
            : this._installBundledCSL().then(function() {
                var s = Zotero.Styles.get(self.CSL_STYLE_ID);
                if (!s) throw new Error("Bundled CSL could not be loaded after install.");
                return s;
            });

        return getStyle.then(function(style) {
            var cslEngine = style.getCiteProc("en-US");
            cslEngine.updateItems([item.id]);
            var bibResult = cslEngine.makeBibliography();
            var rendered  = bibResult && bibResult[1] && bibResult[1][0]
                ? bibResult[1][0].trim() : null;
            if (!rendered) throw new Error("CSL engine returned an empty result.");
            return self._parseBibtexString(rendered);
        });
    },

    _installBundledCSL() {
        var cslURI = this.rootURI + "chrome/content/bibtex.csl";
        return fetch(cslURI)
            .then(function(r) {
                if (!r.ok) throw new Error("Could not fetch bundled CSL from: " + cslURI);
                return r.text();
            })
            .then(function(cslText) {
                return Zotero.Styles.install({ string: cslText }, cslURI, true);
            })
            .then(function() {
                Zotero.log("[BibClip] Bundled CSL installed.");
            });
    },

    /**
     * Parse a raw BibTeX string into a { fieldName: value } object.
     * Handles nested braces correctly. Applies latexEscape() to each value.
     */
    _parseBibtexString(bibtexStr) {
        var fields = {};
        var bodyMatch = bibtexStr.match(/@\w+\{[^,]+,([\s\S]*)\}/);
        if (!bodyMatch) return fields;

        var body = bodyMatch[1];
        var i = 0;

        while (i < body.length) {
            // Skip whitespace and commas between fields
            while (i < body.length && /[\s,]/.test(body[i])) i++;
            if (i >= body.length) break;

            // Read field name (up to "=" or newline)
            var nameStart = i;
            while (i < body.length && body[i] !== "=" && body[i] !== "\n") i++;
            var fieldName = body.slice(nameStart, i).trim().toLowerCase();
            if (!fieldName || body[i] !== "=") { i++; continue; }
            i++; // skip "="

            // Skip whitespace after "="
            while (i < body.length && /[ \t]/.test(body[i])) i++;

            // Value must be wrapped in { }
            if (body[i] !== "{") { i++; continue; }
            i++; // skip opening "{"

            // Read value, tracking brace depth to handle nesting
            var depth = 1;
            var valueStart = i;
            while (i < body.length && depth > 0) {
                if      (body[i] === "{") depth++;
                else if (body[i] === "}") depth--;
                if (depth > 0) i++;
                else break;
            }

            var rawValue = body.slice(valueStart, i).trim();
            i++; // skip closing "}"

            if (fieldName) {
                fields[fieldName] = this.latexEscape(rawValue);
            }
        }

        return fields;
    },

    // ── Native field extraction (CSL fallback) ────────────────────────────────

    _buildFieldsNative(item) {
        var self     = this;
        var fields   = {};
        var typeName = Zotero.ItemTypes.getName(item.itemTypeID);
        var creators = item.getCreators();
        var authorId = Zotero.CreatorTypes.getID("author");
        var editorId = Zotero.CreatorTypes.getID("editor");
        var authors  = creators.filter(function(c) { return c.creatorTypeID === authorId; });
        var editors  = creators.filter(function(c) { return c.creatorTypeID === editorId; });

        // Title: double-braced to preserve capitalisation in LaTeX
        var title = item.getField("title");
        if (title) fields.title = "{" + this.latexEscape(title) + "}";

        // Authors / editors
        if (authors.length)        fields.author = this._formatCreators(authors);
        else if (creators.length)  fields.author = this._formatCreators(creators);
        if (editors.length)        fields.editor = this._formatCreators(editors);

        // Year
        var dateStr = item.getField("date") || "";
        if (dateStr) fields.year = this._extractYear(dateStr);

        // Journal / booktitle (depends on item type)
        var container = item.getField("publicationTitle")
            || item.getField("bookTitle")
            || item.getField("proceedingsTitle");
        if (container) {
            if (typeName === "bookSection" || typeName === "conferencePaper")
                fields.booktitle = this.latexEscape(container);
            else
                fields.journal = this.latexEscape(container);
        }

        // Publisher (field name varies by type)
        var publisher = item.getField("publisher");
        if (publisher) {
            if      (typeName === "thesis")  fields.school      = this.latexEscape(publisher);
            else if (typeName === "report")  fields.institution = this.latexEscape(publisher);
            else                             fields.publisher   = this.latexEscape(publisher);
        }

        var place  = item.getField("place");   if (place)  fields.address = this.latexEscape(place);
        var volume = item.getField("volume");  if (volume) fields.volume  = volume;
        var number = item.getField("issue") || item.getField("number");
        if (number) fields.number = number;
        var pages  = item.getField("pages");
        if (pages)  fields.pages  = pages.replace(/[–—]/g, "--");
        var doi    = item.getField("DOI");    if (doi)    fields.doi     = doi;
        var url    = item.getField("url");    if (url)    fields.url     = url;
        var isbn   = item.getField("ISBN");   if (isbn)   fields.isbn    = isbn;
        var issn   = item.getField("ISSN");   if (issn)   fields.issn    = issn;
        var lang   = item.getField("language"); if (lang) fields.language = lang;

        return fields;
    },

    _formatCreators(creators) {
        var self = this;
        return creators.map(function(c) {
            if (c.lastName && c.firstName)
                return self.latexEscape(c.lastName) + ", " + self.latexEscape(c.firstName);
            return self.latexEscape(c.lastName || c.name || "");
        }).join(" and ");
    },

    // ── BibTeX assembly ───────────────────────────────────────────────────────

    _assembleBibtex(entryType, citeKey, fields) {
        var lines   = ["@" + entryType + "{" + citeKey + ","];
        var entries = Object.entries(fields);
        entries.forEach(function(pair, idx) {
            var comma = idx < entries.length - 1 ? "," : "";
            lines.push("  " + pair[0] + " = {" + pair[1] + "}" + comma);
        });
        lines.push("}");
        return lines.join("\n");
    },

    // ── Text processing ───────────────────────────────────────────────────────

    /**
     * Strip HTML tags and rogue Unicode whitespace from a string.
     * Called first inside latexEscape().
     *
     * Zotero stores some titles with HTML markup (e.g. <i>p</i>CO<sub>2</sub>).
     * Zotero's CSL engine also injects U+202F (narrow no-break space) before
     * punctuation under French locale rules.
     */
    _cleanText(str) {
        if (!str) return str;
        // Strip all HTML tags, keep inner text
        str = str.replace(/<[^>]+>/g, "");
        // Remove U+202F / U+00A0 immediately before punctuation (CSL French locale artefact)
        str = str.replace(/[\u202F\u00A0]([?!;:])/g, "$1");
        // Convert any remaining U+202F / U+00A0 to a regular space
        str = str.replace(/[\u202F\u00A0]/g, " ");
        return str;
    },

    /**
     * Convert a string to LaTeX-safe output:
     *  1. Strip HTML tags and rogue whitespace (_cleanText)
     *  2. Replace accented/special characters with LaTeX commands
     *  3. Escape & # %
     */
    latexEscape(str) {
        if (!str) return str;

        str = this._cleanText(str);

        var out = "";
        for (var i = 0; i < str.length; i++) {
            var ch = str[i];
            out += (BIBCLIP_ACCENT_MAP[ch] !== undefined) ? BIBCLIP_ACCENT_MAP[ch] : ch;
        }

        return out
            .replace(/&/g, "\\&")
            .replace(/#/g, "\\#")
            .replace(/%/g, "\\%");
    },

    // ── Utilities ─────────────────────────────────────────────────────────────

    _copyToClipboard(text) {
        Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper)
            .copyString(text);
    }
};
