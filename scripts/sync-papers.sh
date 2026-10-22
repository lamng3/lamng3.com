#!/usr/bin/env bash
# Copy the paper PDFs the site hosts from their source repositories.
# Run from the repository root when a paper, or the OntoDB book, changes:
#   scripts/sync-papers.sh
# The source repos are expected next to this one (../kroma, ../hermes, ../ontodb, ../memcommit).
set -euo pipefail
src="$(cd "$(dirname "$0")/../.." && pwd)"
dest="$(cd "$(dirname "$0")/.." && pwd)/assets/papers"
mkdir -p "$dest"
cp "$src/kroma/full.pdf" "$dest/kroma-full.pdf"
cp "$src/hermes/paper/hermes.pdf" "$dest/hermes.pdf"
cp "$src/ontodb/book/ontodb-book.pdf" "$dest/ontodb-book.pdf"
cp "$src/ontodb/paper/ontodb-semantic.pdf" "$dest/ontodb-semantic.pdf"
cp "$src/memcommit/paper/memcommit.pdf" "$dest/memcommit.pdf"
ls -la "$dest"
