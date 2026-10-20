#!/usr/bin/env bash
# Refresh the `stars:` snapshot of each project in _data/projects.yml from GitHub.
# Needs the authenticated gh CLI. Run from anywhere: scripts/update-stars.sh
set -euo pipefail
file="$(cd "$(dirname "$0")/.." && pwd)/_data/projects.yml"
for repo in $(grep -E '^  repo: ' "$file" | awk '{print $2}'); do
  stars=$(gh api "repos/$repo" -q .stargazers_count)
  # The stars line follows the repo line.
  perl -0pi -e "s|(  repo: \Q$repo\E\n  stars: )\d+|\${1}$stars|" "$file"
  echo "$repo $stars"
done
