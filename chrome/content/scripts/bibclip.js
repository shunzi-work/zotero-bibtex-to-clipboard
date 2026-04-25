/**
 * bibclip.js — BibClip
 */

// ── Module-level constants (built once, reused on every call) ────────────────

// Suffix sequence for disambiguating duplicate base keys:
// a, b, …, z, aa, ab, …, zz  (702 entries — sufficient for any library)
var BIBCLIP_SUFFIXES = (function() {
    var L = "abcdefghijklmnopqrstuvwxyz";
    var s = [];
    for (var i = 0; i < L.length; i++) s.push(L[i]);
    for (var i = 0; i < L.length; i++)
        for (var j = 0; j < L.length; j++)
            s.push(L[i] + L[j]);
    return s;
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

    id: null, version: null, rootURI: null, initialized: false,
    TOOLBAR_BTN_ID: "bibclip-toolbar-btn",
    TOOLBAR_SEP_ID: "bibclip-toolbar-sep",

    init({ id, version, rootURI }) {
        if (this.initialized) return;
        this.id = id; this.version = version; this.rootURI = rootURI;
        this.initialized = true;
        Zotero.log("[BibClip] Initialized v" + version);
    },

    addToAllWindows() {
        try {
            var win = Zotero.getMainWindow();
            if (win && win.ZoteroPane) { this.addToWindow(win); return; }
        } catch(e) {}
        var en = Services.wm.getEnumerator("navigator:browser");
        while (en.hasMoreElements()) {
            var w = en.getNext();
            if (w.ZoteroPane) this.addToWindow(w);
        }
    },

    addToWindow(window) {
        try {
            var doc = window.document;
            if (!doc || doc.getElementById(this.TOOLBAR_BTN_ID)) return;

            var toolbar = doc.getElementById("zotero-items-toolbar");
            if (!toolbar) { Zotero.log("[BibClip] toolbar not found"); return; }

            var sep = doc.createXULElement("toolbarseparator");
            sep.id = this.TOOLBAR_SEP_ID;
            toolbar.appendChild(sep);

            var btn = doc.createXULElement("toolbarbutton");
            btn.id = this.TOOLBAR_BTN_ID;
            btn.setAttribute("label", "Copy as BibTeX");
            btn.setAttribute("tooltiptext", "Copy selected item(s) as LaTeX-safe BibTeX");
            btn.setAttribute("class", "zotero-tb-button");
            btn.setAttribute("image", this.rootURI + "chrome/content/icon.svg");
            btn.setAttribute("disabled", "true");

            var pane = window.ZoteroPane;
            if (pane && pane.itemsView) {
                var updateState = function() {
                    try {
                        var hasItems = pane.getSelectedItems().some(function(i) {
                            return !i.isNote() && !i.isAttachment();
                        });
                        btn.setAttribute("disabled", hasItems ? "false" : "true");
                    } catch(e) {}
                };
                pane.itemsView.onSelect.addListener(updateState);
            }

            var self = this;
            btn.addEventListener("command", function() {
                try {
                    var items = Zotero.getActiveZoteroPane().getSelectedItems();
                    self._handleCommand(items || []);
                } catch(e) { Zotero.logError(e); }
            });

            toolbar.appendChild(btn);
            Zotero.log("[BibClip] Toolbar button injected");
        } catch(e) {
            Components.utils.reportError("[BibClip] addToWindow() failed: " + e);
        }
    },

    removeFromAllWindows() {
        try {
            var en = Services.wm.getEnumerator("navigator:browser");
            while (en.hasMoreElements()) this.removeFromWindow(en.getNext());
        } catch(e) {}
    },

    removeFromWindow(window) {
        try {
            var doc = window.document;
            var sep = doc.getElementById(this.TOOLBAR_SEP_ID); if (sep) sep.remove();
            var btn = doc.getElementById(this.TOOLBAR_BTN_ID); if (btn) btn.remove();
        } catch(e) {}
    },

    uninit() {
        this.removeFromAllWindows();
        this.initialized = false;
    },

    _pref(key) { return Zotero.Prefs.get("extensions.bibclip." + key, true); },
    _fieldEnabled(name) { return this._pref("field." + name) !== false; },

    _handleCommand(items) {
        var self = this;
        var regular = items.filter(function(i) { return !i.isNote() && !i.isAttachment(); });
        if (!regular.length) { Zotero.log("[BibClip] No exportable items selected."); return; }

        var chain = Promise.resolve();
        regular.forEach(function(item) {
            chain = chain.then(function() { return self._ensureCiteKey(item); });
        });
        chain
            .then(function() {
                return Promise.all(regular.map(function(i) { return self._generateBibtex(i); }));
            })
            .then(function(entries) {
                self._copyToClipboard(entries.join("\n\n"));
                Zotero.log("[BibClip] Copied " + entries.length + " entr" + (entries.length > 1 ? "ies" : "y"));
            })
            .catch(function(e) {
                Zotero.logError(e);
                try { Zotero.getMainWindow().alert("BibClip error:\n" + e.message); } catch(e2) {}
            });
    },

    _ensureCiteKey(item) {
        if (item.getField("citationKey")) return Promise.resolve();
        return this._buildUniqueKey(item).then(function(key) {
            item.setField("citationKey", key);
            return item.saveTx().then(function() { Zotero.log("[BibClip] Assigned key: " + key); });
        });
    },

    _buildUniqueKey(item) {
        var baseKey = this._buildBaseKey(item);
        return Zotero.Items.getAll(Zotero.Libraries.userLibraryID)
            .then(function(allItems) {
                var usedKeys = {};
                for (var i = 0; i < allItems.length; i++) {
                    var other = allItems[i];
                    if (!other.isRegularItem() || other.id === item.id) continue;
                    var k = other.getField("citationKey");
                    if (k) usedKeys[k] = true;
                }
                if (!usedKeys[baseKey]) return baseKey;
                for (var j = 0; j < BIBCLIP_SUFFIXES.length; j++) {
                    var candidate = baseKey + BIBCLIP_SUFFIXES[j];
                    if (!usedKeys[candidate]) return candidate;
                }
                return baseKey + "_" + Date.now();
            });
    },

    _buildBaseKey(item) {
        var authorTypeId = Zotero.CreatorTypes.getID("author");
        var creators = item.getCreators();
        var authors = creators.filter(function(c) { return c.creatorTypeID === authorTypeId; });
        var pool = authors.length ? authors : creators;
        var parts = [];
        for (var i = 0; i < Math.min(2, pool.length); i++) {
            var name = this._normalizeNameForKey(pool[i].lastName || pool[i].name || "");
            if (name) parts.push(name);
        }
        var year = this._extractYear(item.getField("date") || "");
        return (parts.length ? parts.join("_") : "unknown") + "_" + year;
    },

    _normalizeNameForKey(str) {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
    },

    _extractYear(dateStr) {
        var m = dateStr.match(/\b(\d{4})\b/);
        return m ? m[1] : "xxxx";
    },

    _generateBibtex(item) {
        var citeKey = item.getField("citationKey");
        var entryType = this._getEntryType(item);
        var fields = this._buildFields(item);
        return Promise.resolve(this._assembleBibtex(entryType, citeKey, fields));
    },

    _getEntryType(item) {
        var map = {
            book:"book", graphic:"book", legalCase:"book", legislation:"book",
            motionPicture:"book", song:"book", bookSection:"inbook",
            journalArticle:"article", magazineArticle:"article", newspaperArticle:"article",
            thesis:"phdthesis", manuscript:"unpublished",
            conferencePaper:"inproceedings", report:"techreport"
        };
        return map[Zotero.ItemTypes.getName(item.itemTypeID)] || "misc";
    },

    _buildFields(item) {
        var fields = {};
        var typeName = Zotero.ItemTypes.getName(item.itemTypeID);
        var creators = item.getCreators();
        var authorId = Zotero.CreatorTypes.getID("author");
        var editorId = Zotero.CreatorTypes.getID("editor");
        var authors = creators.filter(function(c) { return c.creatorTypeID === authorId; });
        var editors = creators.filter(function(c) { return c.creatorTypeID === editorId; });

        if (this._fieldEnabled("title")) {
            var title = item.getField("title");
            if (title) fields.title = "{" + this.latexEscape(title) + "}";
        }
        if (this._fieldEnabled("author")) {
            if (authors.length)       fields.author = this._formatCreators(authors);
            else if (creators.length) fields.author = this._formatCreators(creators);
            if (editors.length)       fields.editor = this._formatCreators(editors);
        }
        if (this._fieldEnabled("year")) {
            var year = this._extractYear(item.getField("date") || "");
            if (year !== "xxxx") fields.year = year;
        }
        if (this._fieldEnabled("journal")) {
            var isBook = (typeName === "bookSection" || typeName === "conferencePaper");
            if (isBook) {
                var bookTitle = item.getField("bookTitle") || item.getField("proceedingsTitle");
                if (bookTitle) fields.booktitle = this.latexEscape(bookTitle);
            } else {
                var journalName = item.getField("journalAbbreviation") || item.getField("publicationTitle") || "";
                if (journalName) fields.journal = this.latexEscape(journalName);
            }
        }
        if (this._fieldEnabled("publisher")) {
            var publisher = item.getField("publisher");
            if (publisher) {
                if      (typeName === "thesis")  fields.school      = this.latexEscape(publisher);
                else if (typeName === "report")  fields.institution = this.latexEscape(publisher);
                else                             fields.publisher   = this.latexEscape(publisher);
            }
        }
        if (this._fieldEnabled("address")) {
            var place = item.getField("place"); if (place) fields.address = this.latexEscape(place);
        }
        if (this._fieldEnabled("volume")) {
            var volume = item.getField("volume"); if (volume) fields.volume = volume;
        }
        if (this._fieldEnabled("number")) {
            var number = item.getField("issue") || item.getField("number"); if (number) fields.number = number;
        }
        if (this._fieldEnabled("pages")) {
            var pages = item.getField("pages"); if (pages) fields.pages = pages.replace(/[–—]/g, "--");
        }
        if (this._fieldEnabled("edition")) {
            var edition = item.getField("edition"); if (edition) fields.edition = edition;
        }
        if (this._fieldEnabled("doi")) {
            var doi = item.getField("DOI"); if (doi) fields.doi = doi;
        }
        if (this._fieldEnabled("url")) {
            var url = item.getField("url"); if (url) fields.url = url;
        }
        if (this._fieldEnabled("isbn")) {
            var isbn = item.getField("ISBN"); if (isbn) fields.isbn = isbn;
        }
        if (this._fieldEnabled("issn")) {
            var issn = item.getField("ISSN"); if (issn) fields.issn = issn;
        }
        if (this._fieldEnabled("language")) {
            var lang = item.getField("language"); if (lang) fields.language = lang;
        }
        if (this._fieldEnabled("abstract")) {
            var abstr = item.getField("abstractNote"); if (abstr) fields.abstract = this.latexEscape(abstr);
        }
        if (this._fieldEnabled("keywords")) {
            var tags = item.getTags();
            if (tags && tags.length) fields.keywords = tags.map(function(t) { return t.tag; }).join(", ");
        }
        if (this._fieldEnabled("note")) {
            var extra = item.getField("extra"); if (extra) fields.note = this.latexEscape(extra);
        }
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
        var lines = ["@" + entryType + "{" + citeKey + ","];
        var entries = Object.entries(fields);
        entries.forEach(function(pair, idx) {
            lines.push("  " + pair[0] + " = {" + pair[1] + "}" + (idx < entries.length - 1 ? "," : ""));
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
        return out.replace(/&/g, "\\&").replace(/#/g, "\\#").replace(/%/g, "\\%");
    },

    _copyToClipboard(text) {
        Components.classes["@mozilla.org/widget/clipboardhelper;1"]
            .getService(Components.interfaces.nsIClipboardHelper)
            .copyString(text);
    }
};