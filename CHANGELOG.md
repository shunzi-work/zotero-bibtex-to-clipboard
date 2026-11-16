# Changelog

## 2.1.2 - 2026-11-16

### Fixed

- Fixed the toolbar button remaining disabled when Zotero initializes the item view after the plugin. The selection listener is now attached on the later window-load callback, and the button state is initialized from the current selection.
