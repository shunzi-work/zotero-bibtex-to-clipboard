# Changelog

## Unreleased


## 2.1.4 - 2026-11-18

### Added

- Added export preferences for publisher, edition, address, keywords, and Extra note fields.

### Changed

- Apply LaTeX escaping consistently to exported metadata fields and tags.
- Generate citation keys and check for duplicates across each item's entire library, regardless of collection; generated fallback keys use an available numeric suffix.
- Replaced the local version-bump script and multi-step release process with a single workflow that updates the version, creates a matching tag, builds the XPI, and publishes the release.

## 2.1.2 - 2026-11-16

### Fixed

- Fixed the toolbar button remaining disabled when Zotero initializes the item view after the plugin. The selection listener is now attached on the later window-load callback, and the button state is initialized from the current selection.
