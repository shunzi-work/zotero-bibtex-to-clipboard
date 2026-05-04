#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 <new-version> [--no-tag]"
  exit 1
fi

VERSION="$1"
TAG=true
if [ "${2-}" = "--no-tag" ]; then
  TAG=false
fi

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST_FILE="$ROOT_DIR/manifest.json"
PREFS_FILE="$ROOT_DIR/prefs.js"

python3 <<PYTHON
import json
import re
from pathlib import Path
root = Path('${ROOT_DIR}')
version = '${VERSION}'
manifest_path = root / 'manifest.json'
prefs_path = root / 'prefs.js'

manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
manifest['version'] = version
manifest_path.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')

prefs_text = prefs_path.read_text(encoding='utf-8')
new_prefs_text, count = re.subn(r'^(// BibClip v)([0-9]+\.[0-9]+\.[0-9]+)', r'\\1' + version, prefs_text, count=1, flags=re.MULTILINE)
if count != 1:
    raise SystemExit('Failed to update version banner in prefs.js')
prefs_path.write_text(new_prefs_text, encoding='utf-8')
PYTHON

if git diff --quiet -- "$MANIFEST_FILE" "$PREFS_FILE"; then
  echo "No changes detected in manifest.json or prefs.js."
  exit 1
fi

git add "$MANIFEST_FILE" "$PREFS_FILE"
git commit -m "Bump version to $VERSION"

if [ "$TAG" = true ]; then
  git tag -a "v$VERSION" -m "v$VERSION"
  echo "Created git tag v$VERSION."
fi

echo "Bumped version to $VERSION in manifest.json and prefs.js."
