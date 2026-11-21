#!/usr/bin/env bash
# Build every study-notes PDF: notes-src/<slug>/main.tex -> assets/notes/<slug>.pdf.
# Uses Tectonic (https://tectonic-typesetting.github.io), which downloads the
# LaTeX packages it needs the first time. Netlify doesn't run LaTeX, so commit
# the PDFs this writes.
set -euo pipefail
cd "$(dirname "$0")/.."

TECTONIC="${TECTONIC:-$(command -v tectonic || echo "$HOME/.local/bin/tectonic")}"
mkdir -p assets/notes

for dir in notes-src/*/; do
  slug=$(basename "$dir")
  [ -f "$dir/main.tex" ] || continue
  out=$(mktemp -d)
  (cd "$dir" && "$TECTONIC" --outdir "$out" main.tex >"$out/log.txt" 2>&1) || {
    cat "$out/log.txt"
    exit 1
  }
  mv "$out/main.pdf" "assets/notes/$slug.pdf"
  rm -rf "$out"
  echo "built assets/notes/$slug.pdf"
done
