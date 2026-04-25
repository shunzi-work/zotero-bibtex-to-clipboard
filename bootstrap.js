/**
 * bootstrap.js — BibClip
 */

var chromeHandle;
var BibClip;

function install(data, reason) {}
function uninstall(data, reason) {}

function startup({ id, version, rootURI }, reason) {
    // Register chrome:// content and locale paths — required for XPI file access
    try {
        var aomStartup = Components.classes["@mozilla.org/addons/addon-manager-startup;1"]
            .getService(Components.interfaces.amIAddonManagerStartup);
        var manifestURI = Services.io.newURI(rootURI + "manifest.json");
        chromeHandle = aomStartup.registerChrome(manifestURI, [
            ["content", "bibclip", "chrome/content/"]
        ]);
    } catch(e) {
        Components.utils.reportError("[BibClip] Chrome registration failed: " + e);
        return;
    }

    // Load main plugin code into global scope
    try {
        Services.scriptloader.loadSubScript(rootURI + "chrome/content/scripts/bibclip.js");
    } catch(e) {
        Components.utils.reportError("[BibClip] Failed to load bibclip.js: " + e);
        return;
    }

    // Initialise and inject into any already-open windows
    try {
        BibClip.init({ id, version, rootURI });
    } catch(e) {
        Components.utils.reportError("[BibClip] init() failed: " + e);
        return;
    }

    // Register preferences pane in startup() where rootURI is available
    // and Zotero.PreferencePanes is guaranteed to exist
    try {
        Zotero.PreferencePanes.register({
            pluginID: id,
            src:      rootURI + "chrome/content/preferences.xhtml",
            label:    "BibClip",
            image:    rootURI + "chrome/content/icon.svg",
        });
        Zotero.log("[BibClip] Preferences pane registered");
    } catch(e) {
        Components.utils.reportError("[BibClip] Preferences pane registration failed: " + e);
    }

    try {
        BibClip.addToAllWindows();
    } catch(e) {
        Components.utils.reportError("[BibClip] addToAllWindows() failed: " + e);
    }
}

function shutdown({ id, version, rootURI }, reason) {
    if (reason === APP_SHUTDOWN) return;
    try { BibClip.removeFromAllWindows(); } catch(e) {}
    BibClip = undefined;
    if (chromeHandle) {
        try { chromeHandle.destruct(); } catch(e) {}
        chromeHandle = null;
    }
}

function onMainWindowLoad({ window }) {
    try {
        BibClip && BibClip.addToWindow(window);
    } catch(e) {
        Components.utils.reportError("[BibClip] onMainWindowLoad failed: " + e);
    }
}

function onMainWindowUnload({ window }) {
    try { BibClip && BibClip.removeFromWindow(window); } catch(e) {}
}