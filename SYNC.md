# Syncing OntoDB with this site

OntoDB lives in four places that must agree. When one changes, walk this list.

| Where | Repo | What it holds |
| --- | --- | --- |
| Code | `../ontodb` | The engine, `PLAN.md`, `README.md`, `docs/architecture.md` |
| Book | `../ontodb/book` | *OntoDB: Database Internals by Example* (LaTeX, PDF committed) |
| Manual | `../ontodb-docs` | <https://lamng3.github.io/ontodb-docs/>, built from `content/` |
| Site | this repo | The hosted book PDF, the publication entry, the Databases lecture, the homepage |

All four repos sit side by side in the same parent directory.

## When to sync

After every PLAN slice that starts passing (`scripts/status` in `../ontodb` shows `pass`), and after any edit to the book. One slice is one round: code, book, manual, site, each committed and pushed.

## 1. Code (`../ontodb`)

- `scripts/check <slice>` passes, and the slice's tests no longer have the `DISABLED_` prefix.
- `PLAN.md`: the "Building" table's notes (which slice is next, "x.y is done"), and "Runs now" if the shell gained a behavior.
- `README.md`: the progress badge (`plan-N%2F53`), the Status table row (🚧 to ✅ when a whole feature is done), and the `N of 53 slices pass` line.
- `docs/architecture.md`: sentences that say a path is not built yet, and the Deviations list if the code differs from the plan.
- Find stale text: `grep -rn "PLAN <x.y>\|plan <x.y>\|next item\|not built yet\|of 53" PLAN.md README.md docs`.

## 2. Book (`../ontodb/book`)

- The chapter's **Status** box (`\begin{status}`) for the slice. `chapters/a-map.tex` maps chapters to slices.
- The preface's Status box (`chapters/00-preface.tex`) when a whole feature finishes.
- Any `\begin{ontodb}` box whose claims the implementation changed (names, sizes, choices such as which permutations were kept).
- Design decisions (`\begin{decision}{Title}`): every choice the slice made gets a box in the chapter that teaches the theory, with Choice, Alternatives, Why, and Cost (`\dpart{...}`). When a planned decision is built, drop `(planned)` from its title; if the code chose differently, rewrite the box. The list after the contents updates itself.
- Questions: if the slice adds a concept a reader should be able to reason about, add a question to the chapter's `checkyourself` list and its answer to `chapters/b-answers.tex`.
- Find stale text: `grep -n "plan <x.y>\|next item\|today\|not yet" chapters/*.tex`.
- Build: `cd book && tectonic ontodb-book.tex` (or `make` if `pdflatex` is installed). Commit the `.tex` changes and `ontodb-book.pdf` together.
- Note the page count: `pdfinfo ontodb-book.pdf | grep Pages`.

## 3. Manual (`../ontodb-docs`)

- `content/next.md`: the `lede` (`N of 53 slices are done` and what comes next) and the "Being built" list.
- The internals page for the feature (`indexes.md`, `buffer-pool.md`, `b-plus-tree.md`, `dictionary.md`, `query-engine.md`, `optimizer.md`, `concurrency.md`, `recovery.md`, `durability.md`): "this is plan x.y", "throws PLAN x.y", "next item to build".
- `content/config.md`: settings that answered `not built yet` and now work.
- Find stale text: `grep -rn "PLAN <x.y>\|plan <x.y>\|of 53\|next item\|being built" content`.
- Build: `python3 build.py`. Commit `content/` and the regenerated HTML together.

## 4. Site (this repo)

- Copy the PDF: `scripts/sync-papers.sh`. The hosted copy is `assets/papers/ontodb-book.pdf`.
- If the page count changed: `venue: "Book, N pages"` in `_data/publications.yml`, and `(PDF, N pages)` in `_pages/topics/databases.md`.
- If the book's scope changed: `tldr` and `abstract` of `ontodb-book` in `_data/publications.yml`, and `description` in `_pages/publications/ontodb-book.md`.
- `_pages/topics/databases.md`, section `{#database-engine}`: sentences about what OntoDB runs today. Bump `last_updated` when this page changes.
- `_pages/about.md`: the OntoDB project line, when a whole feature lands (for example, indexes or ARIES).
- Find stale text: `grep -n -i "ontodb\|pages)" _pages/topics/databases.md _pages/about.md _data/publications.yml`.
- Do not rename the `{#id}` anchors; `_redirects` and other pages link to them.

## 5. Learning notes (`../ontodb/.vibe-wise/`, local only)

- `project-map.md`: move the slice's component from planned to implemented, and update Main Flow and Unknowns.
- `progress.md`: close any pending decision for the slice and record what was learned. These files are not committed.

## Commits

One commit per repo per round, pushed to `main`. Messages are one plain sentence ending in a period, in the style of the existing history, for example `Implement the triple key (PLAN 0.2).`, `Update the book for the triple key.`, `Sync the OntoDB book: 0.2 done.`
