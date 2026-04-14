/**
 * bootstrap.js — BibClip
 * Zotero 7/8 bootstrapped plugin entry point.
 */

var chromeHandle;
var BibClip;

function install(data, reason) {}
function uninstall(data, reason) {}

function startup({ id, version, rootURI }, reason) {
    // Register chrome:// content and locale paths — required for XPI file access
    var aomStartup = Components.classes["@mozilla.org/addons/addon-manager-startup;1"]
        .getService(Components.interfaces.amIAddonManagerStartup);
    var manifestURI = Services.io.newURI(rootURI + "manifest.json");
    chromeHandle = aomStartup.registerChrome(manifestURI, [
        ["content", "bibclip", "chrome/content/"],
        ["locale",  "bibclip", "en-US", "chrome/locale/en-US/"]
    ]);

    // Load main plugin code into global scope
    Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/bibclip.js");

    // Initialise and inject into any already-open windows
    BibClip.init({ id, version, rootURI });
    BibClip.addToAllWindows();
}

function shutdown({ id, version, rootURI }, reason) {
    if (reason === APP_SHUTDOWN) return;

    BibClip.removeFromAllWindows();
    BibClip = undefined;

    if (chromeHandle) {
        chromeHandle.destruct();
        chromeHandle = null;
    }
}

// Zotero 8 per-window hooks (ignored by Zotero 7)
function onMainWindowLoad({ window }) {
    BibClip && BibClip.addToWindow(window);
}

function onMainWindowUnload({ window }) {
    BibClip && BibClip.removeFromWindow(window);
}
