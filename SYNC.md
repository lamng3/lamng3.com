# Syncing projects with this site

[OntoDB](#syncing-ontodb-with-this-site) is kept in step with this site. It lives in several repos that must agree; when one changes, walk its list.

## Syncing OntoDB with this site

OntoDB lives in four places that must agree. When one changes, walk this list.

| Where  | Repo             | What it holds                                                                   |
| ------ | ---------------- | ------------------------------------------------------------------------------- |
| Code   | `../ontodb`      | The engine, `PLAN.md`, `README.md`, `docs/architecture.md`                      |
| Book   | `../ontodb/book` | _OntoDB: Database Internals by Example_ (LaTeX, PDF committed)                  |
| Manual | `../ontodb-docs` | <https://lamng3.com/ontodb/>, built from `content/`                             |
| Site   | this repo        | The hosted book PDF, the publication entry, the Databases lecture, the homepage |

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

## Where the manuals are served

Each project manual is built and hosted by its own `<name>-docs` repo on GitHub Pages, and this site proxies it so the URL stays on lamng3.com, as for `/keras-js/`. The rules are in `_redirects`:

| URL on this site | Repo behind it       |
| ---------------- | -------------------- |
| `/ontodb/`       | `lamng3/ontodb-docs` |
| `/kroma/`        | `lamng3/kroma-docs`  |
| `/hermes/`       | `lamng3/hermes-docs` |

Link to the lamng3.com address, never to `lamng3.github.io/...`, in `_data`, READMEs, and the manuals. The manuals use relative links, so they work under the prefix. A new manual needs a Pages site, a rule here, and no `<name> -> <name>/` redirect (Netlify ignores trailing slashes, so it would loop).

The home page of each manual has a live demo that replays real output; `demo_data.py` in each `-docs` repo regenerates it.

## Linking to projects

In prose (the homepage, topic pages, project text) link a project to its publications page (`/publications/<slug>/`) and/or its manual (`https://lamng3.com/<name>/`), not to GitHub, arXiv, or a PDF in a repo. The publication page carries the overview, the PDF, and the code and manual links. Explicit `Code` or `GitHub` entries in `_data/*.yml`, and links to source files, are fine.

## Manual and showcase upkeep

The manuals share one design (`normalize.py` is copied into each manual and gives every page search, an on-this-page list, and previous and next links). Each manual's home page has a demo that replays real output; `demo_data.py` in each `-docs` repo regenerates its data from the project's recorded results, so rerun it when results change, then rebuild.

| Manual     | Demo shows                                           | Regenerate from          |
| ---------- | ---------------------------------------------------- | ------------------------ |
| `/ontodb/` | queries and plans printed by the shell               | a built `ontodb` binary  |
| `/kroma/`  | prompts built by KROMA's code, with recorded answers | KROMA's recorded results |
| `/hermes/` | four systems on one question, and the leaderboard    | `hermes/results/ck26`    |

After a deploy, test the live sites: crawl every page for dead links, anchors, console errors, and overflow at 390px, and click through each demo.

## Wording

Label the link to a repository `Code` (not `GitHub`, `OntoDB`, or the repo name), in `projects.yml` and `publications.yml` alike.

Call each project's guide a **Manual**, never "documentation" or "docs": in link labels (`Manual`), page titles (`Page — Name Manual`), sidebar headings, footers, and README badges, including the Toolbox and Hermit entries. A link to a blog lecture is labelled `Lecture`, not `Walkthrough`. The repos keep the `-docs` suffix and the sidebar-less home page is the exception to the title format.

## Leaderboards

Manuals have a **Leaderboard** page drawn by `arena.js` (copied into each manual; its CSS is appended to each `style.css`). Each `-docs` repo has a `leaderboard_data.py` that reads the project's recorded results into `leaderboard-data.json`, so rerun it when results change, then rebuild:

| Manual                     | Boards                                                 | Reads                                   |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| `/hermes/leaderboard.html` | ck26 and db26, Hermes runs beside the official systems | `hermes/results/LEADERBOARD.md`         |
| `/kroma/leaderboard.html`  | F1 per track against baselines and ablations           | `kroma/README.md` (the paper's Table 3) |

OntoDB has none: its benchmarks are timing tables that do not rank. Link a project's leaderboard from its publication entry (`Leaderboard`), never to a results file in the repo.

## Playgrounds

Every manual has a **Playground** page that runs in the visitor's browser, with no server of ours. Each says what it is and is not: the Python projects are not run in the browser, so each playground is either an engine stand-in on real data or a JavaScript port of part of the project, and each port is tested against the Python.

| Manual                    | What runs                                                                                                                    | How it is checked                                                       |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `/ontodb/playground.html` | SPARQL on Oxigraph (WebAssembly) over Pizza or your Turtle, store in IndexedDB; OntoDB's own plans, recorded                 | every example runs; updates survive a reload                            |
| `/hermes/playground.html` | the real corporate graph (26.9k triples) on Oxigraph; recorded queries of four systems; step-by-step replay; a model you run | prompt, extraction and repair ports equal the Python                    |
| `/kroma/playground.html`  | KROMA's prompt for any two concepts; a model you run                                                                         | prompt, extraction and voting ports equal the Python for all real pairs |

No model is hosted. Where a playground calls a model, the visitor chooses where it runs: Ollama on their computer (detected when they open the panel, with its installed models listed; `OLLAMA_ORIGINS="*" ollama serve`), a tiny model in the page on WebGPU (Gemma 3 270M or LFM2.5 350M through jax-js, a few hundred MB that the browser caches), or another OpenAI-compatible endpoint. Settings stay in their browser. The tiny models follow formats but get tasks wrong: LFM2.5 350M answers No to every KROMA pair and writes no parsable query for any of Hermes's eight sample questions. Chrome asks permission before a page reaches a local server; Safari does not allow it, so every playground that calls a model also accepts a pasted reply. Each `-docs` repo has a `playground_data.py` that exports the ground truth from the real code; rerun it when the code changes, and rerun the page's tests. The shared helper is `playground/pg.js` (copied into each manual). The engine and Oxigraph load from a pinned jsDelivr URL.

After a change, validate the HTML (`html-validate`), lint every page's text, crawl every page, and click through each demo and playground in a real browser.
