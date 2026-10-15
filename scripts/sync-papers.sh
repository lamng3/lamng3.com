#!/usr/bin/env bash
# Copy the paper PDFs the site hosts from their source repositories.
# Run from the repository root when a paper or the OntoDB book changes:
#   scripts/sync-papers.sh
# The source repos are expected next to this one (../hermes, ../ontodb, ../OntoCheck).
set -euo pipefail
src="$(cd "$(dirname "$0")/../.." && pwd)"
dest="$(cd "$(dirname "$0")/.." && pwd)/assets/papers"
mkdir -p "$dest"
cp "$src/hermes/paper/hermes.pdf" "$dest/hermes.pdf"
cp "$src/ontodb/book/ontodb-book.pdf" "$dest/ontodb-book.pdf"
cp "$src/OntoCheck/SupplementaryMaterials/2605-KunduMehdiTran-OntoCheck-SupplementaryMaterial.pdf" "$dest/ontocheck-supplementary.pdf"
ls -la "$dest"
