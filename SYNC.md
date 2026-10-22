# Syncing projects with this site

Two projects are kept in step with this site: [OntoDB](#syncing-ontodb-with-this-site) and [MemCommit](#syncing-memcommit-with-this-site). Each lives in several repos that must agree; when one changes, walk its list.

## Syncing OntoDB with this site

OntoDB lives in four places that must agree. When one changes, walk this list.

| Where | Repo | What it holds |
| --- | --- | --- |
| Code | `../ontodb` | The engine, `PLAN.md`, `README.md`, `docs/architecture.md` |
| Book | `../ontodb/book` | *OntoDB: Database Internals by Example* (LaTeX, PDF committed) |
| Manual | `../ontodb-docs` | <https://lamng3.com/ontodb/>, built from `content/` |
| Site | this repo | The hosted book PDF, the publication entry, the Databases lecture, the homepage |

All four repos sit side by side in the same parent directory.

### When to sync

After every PLAN slice that starts passing (`scripts/status` in `../ontodb` shows `pass`), and after any edit to the book. One slice is one round: code, book, manual, site, each committed and pushed.

### 1. Code (`../ontodb`)

- `scripts/check <slice>` passes, and the slice's tests no longer have the `DISABLED_` prefix.
- `PLAN.md`: the "Building" table's notes (which slice is next, "x.y is done"), and "Runs now" if the shell gained a behavior.
- `README.md`: the feature bullets under "What it is" when a feature changes what OntoDB does. The README has no progress badge or status table now that every slice passes; add one back only if new unfinished work goes into `PLAN.md`.
- `docs/architecture.md`: sentences that say a path is not built yet, and the Deviations list if the code differs from the plan.
- Find stale text: `grep -rn "PLAN <x.y>\|plan <x.y>\|next item\|not built yet\|of 53" PLAN.md README.md docs`.

### 2. Book (`../ontodb/book`)

- The chapter's **Status** box (`\begin{status}`) for the slice. `chapters/a-map.tex` maps chapters to slices.
- The preface's Status box (`chapters/00-preface.tex`) when a whole feature finishes.
- Any `\begin{ontodb}` box whose claims the implementation changed (names, sizes, choices such as which permutations were kept).
- Design decisions (`\begin{decision}{Title}`): every choice the slice made gets a box in the chapter that teaches the theory, with Choice, Alternatives, Why, and Cost (`\dpart{...}`). When a planned decision is built, drop `(planned)` from its title; if the code chose differently, rewrite the box. The list after the contents updates itself.
- Questions: if the slice adds a concept a reader should be able to reason about, add a question to the chapter's `checkyourself` list and its answer to `chapters/b-answers.tex`.
- Find stale text: `grep -n "plan <x.y>\|next item\|today\|not yet" chapters/*.tex`.
- Build: `cd book && tectonic ontodb-book.tex` (or `make` if `pdflatex` is installed). Commit the `.tex` changes and `ontodb-book.pdf` together.
- Note the page count: `pdfinfo ontodb-book.pdf | grep Pages`.

### 3. Manual (`../ontodb-docs`)

- `content/next.md`: the `lede` (`N of 53 slices are done` and what comes next) and the "Next" list.
- The internals page for the feature (`indexes.md`, `buffer-pool.md`, `b-plus-tree.md`, `dictionary.md`, `query-engine.md`, `optimizer.md`, `concurrency.md`, `recovery.md`, `durability.md`): "this is plan x.y", "throws PLAN x.y", "next item to build".
- `content/config.md`: settings that answered `not built yet` and now work.
- Find stale text: `grep -rn "PLAN <x.y>\|plan <x.y>\|of 53\|next item\|being built" content`.
- Build: `python3 build.py`. Commit `content/` and the regenerated HTML together.

### 4. Site (this repo)

- Copy the PDF: `scripts/sync-papers.sh`. The hosted copy is `assets/papers/ontodb-book.pdf`.
- If the page count changed: `venue: "Book, N pages"` in `_data/publications.yml`, and `(PDF, N pages)` in `_pages/topics/databases.md`.
- If the book's scope changed: `tldr` and `abstract` of `ontodb-book` in `_data/publications.yml`, and `description` in `_pages/publications/ontodb-book.md`.
- `_pages/topics/databases.md`, section `{#database-engine}`: sentences about what OntoDB runs today. Bump `last_updated` when this page changes.
- `_pages/about.md`: the OntoDB project line, when a whole feature lands (for example, indexes or ARIES).
- Find stale text: `grep -n -i "ontodb\|pages)" _pages/topics/databases.md _pages/about.md _data/publications.yml`.
- Do not rename the `{#id}` anchors; `_redirects` and other pages link to them.

### 5. Learning notes (`../ontodb/.vibe-wise/`, local only)

- `project-map.md`: move the slice's component from planned to implemented, and update Main Flow and Unknowns.
- `progress.md`: close any pending decision for the slice and record what was learned. These files are not committed.

### Commits

One commit per repo per round, pushed to `main`. Messages are one plain sentence ending in a period, in the style of the existing history, for example `Implement the triple key (PLAN 0.2).`, `Update the book for the triple key.`, `Sync the OntoDB book: 0.2 done.`

## Syncing MemCommit with this site

MemCommit lives in six places that must agree. When one changes, walk this list.

| Where | Repo | What it holds |
| --- | --- | --- |
| Code | `../memcommit` | The library, `PLAN.md`, `README.md`, `docs/design.md`, `docs/decisions.md`, `results/` |
| Paper | `../memcommit/paper` | *MemCommit: A Transactional Memory Layer for Agents* (LaTeX, PDF committed) |
| Manual | `../memcommit-docs` | <https://lamng3.com/memcommit/>, built from `content/` |
| Users | `../agentic-ontologist`, `../agentic-ontologist-docs`, `../kroma`, `../aegis`, `../ontodb` | Code that imports `memcommit`, and the docs and showcase that describe the shared memory |
| Site | this repo | The hosted paper PDF, the publication entry, the project entry, the homepage |

All repos sit side by side in the same parent directory.

### When to sync

After every change to what MemCommit does, and after every rerun of a benchmark. One feature or one result is one round: code, paper, manual, users, site, each committed and pushed.

### 1. Code (`../memcommit`)

- `uv run ruff check . && uv run python -m pytest -q` pass.
- `PLAN.md`: the feature bullets under "Runs now", and the benchmark line when a benchmark changes.
- `README.md`: "What it is" bullets, the results table, and the usage blocks, when a feature or a result changes what MemCommit does or shows. The Quick start output must match `memcommit demo`.
- `docs/design.md`: the section for the feature. `docs/decisions.md`: a dated entry for every choice, with Choice, Alternatives, Why, and Cost; when a later change makes an earlier entry wrong, amend it and say so.
- A benchmark rerun writes `results/memory/<date>.json` or `results/policies/<date>.json`; update `results/memory/README.md` (generate its tables from the JSON, not by hand) and the table in `README.md`.
- Find stale text: `grep -rn "Mneme\|mneme" . --include='*.py' --include='*.md' --include='*.tex'` should find only the rename entry in `docs/decisions.md`.

### 2. Paper (`../memcommit/paper`)

- `results/memory/*.json` changed: `make figures` redraws `fig/memory.pdf`; update Table 1 and the text of Section 5.1 (every number is quoted from the JSON). `results/policies/*.json` changed: Table 2 and Section 5.2.
- A feature changed: Sections 3 and 4, and the abstract and contributions if the claim moved.
- Keep the threats to validity true: if a result stops being circular or a caveat stops applying, say so; if a new one appears, add it.
- Build: `cd paper && make` (`tectonic` when `pdflatex` is absent). Commit the `.tex` changes and `memcommit.pdf` together. Note the page count: `pdfinfo memcommit.pdf | grep Pages`.

### 3. Manual (`../memcommit-docs`)

- `content/*.md`: the page for the feature (`structure`, `sessions`, `notes`, `dreaming`, `recall`, `tiers`, `agents`, `audit`, `cli`, `api`, `benchmarks`, `log`, `provenance`, `storage`, `roadmap`). `benchmarks.md` quotes the results tables; `roadmap.md` lists what is next.
- `content/decisions.md` is generated from `../memcommit/docs/decisions.md` by the build; do not edit it.
- Find stale text: `grep -rn "not built yet\|planned\|will be" content`.
- Build: `python3 build.py`. Commit `content/` and the regenerated HTML together.

### 4. Users

- `../agentic-ontologist`: `src/agentic_ontologist/integrations/memcommit/` (the declared `STRUCTURE` in `structure.py`, and the kinds in `cache.py` and `traces.py`), `tests/integration/test_memcommit.py`, `examples/shared_memory_workflow.py`, and the "Shared memory" section of `README.md`. Run with `PYTHONPATH=../memcommit/src uv run python -m pytest tests/integration`.
- `../agentic-ontologist/showcase`: the Memory structure tab is generated from `STRUCTURE`. After changing it, `PYTHONPATH=../memcommit/src uv run python showcase/build.py results/agentic_workflow/2026-10-18.json`, then commit `showcase/` (GitHub Pages republishes it).
- `../agentic-ontologist-docs/architecture.html`: the "Shared memory" section and the package-map row.
- `../kroma`, `../aegis`: import `memcommit`; run their tests with `PYTHONPATH=../memcommit/src`. `../ontodb/README.md`: the "Agent memory" bullet and the `urn:memcommit:` namespace.
- A rename of the package or of the OntoDB engine's namespace touches all of them.

### 5. Site (this repo)

- Copy the PDF: `scripts/sync-papers.sh`. The hosted copy is `assets/papers/memcommit.pdf`.
- `_data/publications.yml`, entry `memcommit`: `tldr`, `abstract`, and `highlights` when the paper's claims or numbers change. When the code and manual repos are public, add `Code` and `Manual` to its `links`.
- `_data/projects.yml`, entry `memcommit`: `lead` and `body`; when the repos are public, replace "The code and manual will be public soon." and add `GitHub` and `Manual` links, `repo: lamng3/memcommit`, an `image`, and `notable: true` if it should be on the homepage.
- `_pages/about.md`: the MemCommit mention under the research interests, when the project's scope changes.
- Find stale text: `grep -n -i "memcommit" _data/projects.yml _data/publications.yml _pages/about.md`.

### 6. Commits

One commit per repo per round, pushed to the default branch (`main`; `master` in `agentic-ontologist`). Messages are one plain sentence ending in a period, for example `Add offline dreaming: extract learnings from finished sessions, resolve conflicts, merge duplicates, and split oversized notes, with preview and undo.`

## Where the manuals are served

Each project manual is built and hosted by its own `<name>-docs` repo on GitHub Pages, and this site proxies it so the URL stays on lamng3.com, as for `/keras-js/`. The rules are in `_redirects`:

| URL on this site | Repo behind it |
| --- | --- |
| `/memcommit/` | `lamng3/memcommit-docs` |
| `/ontodb/` | `lamng3/ontodb-docs` |
| `/kroma/` | `lamng3/kroma-docs` |
| `/aegis/` | `lamng3/aegis-docs` |
| `/hermes/` | `lamng3/hermes-docs` |
| `/agentic-ontologist/` | `lamng3/agentic-ontologist-docs` |
| `/agentic-ontologist/showcase/` | `lamng3/agentic-ontologist` (its Pages site; this rule comes first) |

Link to the lamng3.com address, never to `lamng3.github.io/...`, in `_data`, READMEs, and the manuals. The manuals use relative links, so they work under the prefix. A new manual needs a Pages site, a rule here, and no `<name> -> <name>/` redirect (Netlify ignores trailing slashes, so it would loop).

The home page of each manual has a live demo that replays real output; `demo_data.py` in each `-docs` repo regenerates it. See the decision "Manuals share one design" in `memcommit/docs/decisions.md`.

## Linking to projects

In prose (the homepage, topic pages, project text) link a project to its publications page (`/publications/<slug>/`) and/or its manual (`https://lamng3.com/<name>/`), not to GitHub, arXiv, or a PDF in a repo. The publication page carries the overview, the PDF, and the code and manual links. Explicit `Code` or `GitHub` entries in `_data/*.yml`, and links to source files, are fine.

## Manual and showcase upkeep

Six manuals share one design (`memcommit-docs/restyle.py` applies it; `memcommit-docs/normalize.py` is copied into each manual and gives every page search, an on-this-page list, and previous and next links). Each manual's home page has a demo that replays real output; `demo_data.py` in each `-docs` repo regenerates its data from the project's recorded results, so rerun it when results change, then rebuild.

| Manual | Demo shows | Regenerate from |
| --- | --- | --- |
| `/memcommit/` | a real memory log and its stale cascade | `memcommit` library |
| `/ontodb/` | queries and plans printed by the shell | a built `ontodb` binary |
| `/kroma/` | prompts built by KROMA's code, with recorded answers | `agentic-ontologist` results |
| `/aegis/` | attack and defence results | `aegis/results/attack_defense` |
| `/hermes/` | four systems on one question, and the leaderboard | `hermes/results/ck26` |
| `/agentic-ontologist/` | routing quality against cost, and one decision | `agentic-ontologist/results/agentic_workflow` |

Two projects also have a showcase, a single page built from the recorded runs with `showcase/build.py`: `/agentic-ontologist/showcase/` and the Aegis one (served from the `aegis` repo's Pages site, so add `/aegis/showcase/* -> https://lamng3.github.io/aegis/` ahead of `/aegis/*` in `_redirects` once that repo is public). Both inline `showcase/base.css` and `base.js`, copies of `memcommit-docs/showcase`.

After a deploy, test the live sites: crawl every page for dead links, anchors, console errors, and overflow at 390px, and click through each demo.

## Wording

Call each project's guide a **Manual**, never "documentation" or "docs": in link labels (`Manual`), page titles (`Page — Name Manual`), sidebar headings, footers, and README badges. The repos keep the `-docs` suffix and the sidebar-less home page is the exception to the title format.
