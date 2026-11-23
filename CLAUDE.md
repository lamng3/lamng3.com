# Working notes

Lam Nguyen's site, hosted on Netlify. A profile, projects, a code library, and algorithm notes, in a white, minimal style modeled on ekzhang.com. There is no profile photo.

## Pages

- `_pages/about.md` is the homepage (`permalink: /`). Its "Notable work" list comes from projects with `notable: true` in `_data/projects.yml`.
- `_pages/projects.md` is /projects/, built from `_data/projects.yml` in the order listed there (research first, then tools; the page can also sort by date or stars). A project with no `links` shows no links or screenshot. Screenshots live in `assets/img/projects/` (960px JPEG). Refresh star counts with `scripts/update-stars.sh`.
- `_pages/resume.md` is /resume/: a simplified academic version of the PhD CV (`../phd_cv/phd/cv/main.tex`), in the same order: education with graduate and undergraduate technical coursework (course names from the CWRU transcript, including every technical course taken for credit; never grades, GPA or IDs), publications, talks, research and industry experience, teaching, awards, services, extracurriculars. Leave out the CV's phone number, references, and skills, and keep industry entries free of team names.
- The homepage text follows Lam's own wording and the framing of the PhD CV and statement of purpose: semantic data infrastructure for trustworthy AI agents. Keep edits to it small. Research interests are five one-line groups; keep each to one line on desktop (the vector search line nearly fills it). Vector search comes first, named broadly rather than as ANN search because it spans graph-based indexes (HNSW, DiskANN), partitioning (IVF), hardware-aware algorithms (GPUs included), and graph theory, the taxonomy of `../awesome-semantic-data-systems`. Algorithms is second: batch-dynamic graphs, tree search, and bandits (it replaced decision theory; keep tree search general rather than naming MCTS or UCT, and don't call the line parallel algorithms until there is parallel work to show). Semantic data is third, in the SoP's terms (dynamic knowledge bases, governance). The dream engine is MemCommit's offline dreaming pass. The intro reads LLM reasoning through the lens of databases and algorithms.
- `_pages/library.md` is /library/, the code library. It is not in the nav; it is reached from its entry on /projects/ (slug `library`), and the nav highlights "projects" on library pages. `scripts/sync-library.py` generates `_data/library.yml` and `_pages/library/*.md` from `../competitive-programming` (lamng3/competitive-programming-notebook); do not edit those by hand, rerun the script.
- `_layouts/default.liquid` holds the masthead (name, section name, lowercase nav) and the contact footer. `assets/js/pages.js` sorts projects, filters the library, and switches template tabs.
- `_pages/blog.md` is the Algorithms index, shown as "algorithms" in the nav. Its URLs stay under `/blog/` so existing links keep working: a card grid of topics with their last-updated dates, in the order of `_data/topics.yml`. Topic names stay generic, like cp-algorithms or the USACO Guide (Binary Search, Range Queries, Hashing), so each one can hold many techniques.
- `_pages/leetcode.md` is Selected LeetCode Problems. Each row's topic links into a topic page.
- Topic pages use `layout: post`. With no `date`, the layout shows "Updated" and `last_updated`.

## Topic pages (`_pages/topics/`)

The algorithm notes are grouped by technique, like cp-algorithms. One page per topic, at `/blog/<slug>/`. There are no dated posts.

Write for readers who like math: derivation-first, clearly motivated, and readable. Follow the thought process: the first instinct, why it fails, and the question that unblocks it.

```yaml
---
layout: post
title: "Topic Name"
description: "One or two sentences about the topic."
permalink: /blog/<slug>/
last_updated: YYYY-MM-DD
author: Lam Nguyen
toc:
  sidebar: right
---
```

- Each technique is one `## Title {#id}` section. Its subsections are `###`, so the table of contents lists techniques and their parts.
- The `{#id}` is a public link target. Do not rename it. `_redirects` and `_pages/leetcode.md` point at these ids.
- To add a technique: add a section to the topic page, bump `last_updated`, and add `{id, title}` under that topic in `_data/topics.yml`. A new topic needs a new page and a new entry in `_data/topics.yml`. Prepend a line to `_data/recent.yml` (date, title, topic, url) so it shows under Recent on the Algorithms index. Keep that list short; drop lines that are no longer current.
- Link between techniques with `/blog/<slug>/#<id>`, or `#<id>` within the same page.
- Quote `title` and `description`. A `: ` inside an unquoted YAML value breaks the page.
- `_redirects` maps the old dated post URLs (`/blog/2026/<slug>/`) to their sections. Keep it.

## Study notes (`notes-src/`, /notes/)

The **notes** tab (`_pages/notes.md`) lists study notes from courses Lam follows, one LaTeX document per course, from `_data/notes.yml` (slug, title, course, course_url, practice_url, updated). The list keeps each to one line: the title, the PDF, and the practice code. The title opens `/notes/<slug>/` (`_pages/notes/<slug>.md`, layout `study-note`), which says which course it follows, when it was updated, and shows the PDF. The nav's 0.95rem type and 1rem gaps keep its five tabs on one line beside every section name.

- **Sources** are `notes-src/<slug>/main.tex`, with one chapter per lecture in `chapters/` (start from `chapters/_template.tex`). `scripts/build-notes.sh` builds each `main.tex` with Tectonic into `assets/notes/<slug>.pdf`. Commit the PDF, since Netlify doesn't run LaTeX, and bump `\updated` in `main.tex` and `updated` in `_data/notes.yml`. `notes-src` is excluded from the Jekyll build.
- **Lam writes the notes; Claude writes them up.** Lam types or scans the notes for a lecture, and Claude turns them into a clean chapter that keeps Lam's understanding, in the teaching voice of the topic pages. Don't copy the course's material in, and don't write chapters ahead of Lam's notes.
- **The notes are for passing around and studying from**, so every chapter reads on its own and looks the same: the template's sections, a header block (lecture and date from the course page, the reading, Lam's code), numbered figures, tables, and algorithms, and the same notation throughout (work $W$, span $S$, processors $P$). Cite Lam's code with `\notebook{<path>}` (or `\notebook[label]{<path>}`) and show it in `code` environments, put pseudocode in `algorithm` blocks placed with `[H]`, and include the measured `cppar` tables with what they show. A build should log no overfull boxes or font warnings; read the PDF pages before committing.
- **Practice code** lives in the competitive programming notebook (`../competitive-programming`), in `notebook/parallel/<problem>/<algorithm>.cpp` (examples from the reading in `notebook/parallel/book/`, one file each, named for what it computes): one small program per algorithm that times it against a sequential version with `parbench::run` (`tools/parbench.h`), which checks every answer against the first. `cppar <algorithm>` times it on several thread counts, `cppar <algorithm> --check` checks it with sanitizers, and `cppar <problem>` runs the whole folder. Write it as production C++ (specific includes, `std::` names, no aliases like `ll`), with short comments. Add problems only as Lam reaches them, leave the `TODO`s for Lam, and review Lam's code when asked.

## Paper notes (`_papers/`, /papers/)

Notes on papers Lam reads, one file per paper at `_papers/<slug>.md`, published at `/papers/<slug>/` (layout `paper-note`, set by the `papers` collection in `_config.yml`). They are not in the public nav (it has five tabs, and a sixth would wrap the masthead onto two lines on section pages), and nothing on the site links to the desk: Lam opens `/papers/desk/` directly, so visitors see only the main work.

- **Writing happens at `/papers/desk/`**, a page that talks to the GitHub API from the browser with a fine-grained token Lam pastes in (Contents and Pull requests, read and write, this repository only; kept in localStorage). It is `noindex` and disallowed in `robots.txt`, but the token is what keeps it private: without push access the page can do nothing. Anyone else can only open a PR from a fork, and the desk ignores those.
- **Each draft is a branch `paper-notes/<slug>` with an open PR.** The desk saves every keystroke to localStorage first, and pushes to the branch on Save (⌘S), a minute after the last edit, and when the tab is hidden. If the branch moved (Claude pushed a write-up), it merges three ways (`mergeNotes` in `assets/js/papernotes.js`) and retries. Publish squash-merges the PR and deletes the branch; Discard closes it. Editing a published note opens a new PR.
- **Front matter**: quoted `title`, optional `description`, `authors`, `year`, `venue`, `link`, `status` (`reading`, `read`, `written`), `started`, `updated`, `ideas` (free text; they become the map's idea nodes and the index filters), `related` (other paper slugs), `bibtex` (the entry as pasted; the page shows it in a Cite box), and `stickies`: a list of `{text, kind, where, at}` with `kind` one of idea, question, quote, critique, todo. The body is the write-up.
- **BibTeX**: pasting an entry at the desk (when starting a paper, or in the details panel) fills title, authors as "First Last", year, venue, and link (`parseBibtex` in `assets/js/papernotes.js`). A Scholar or arXiv style key such as `dao2022flashattention` becomes the slug; otherwise the slug comes from the title, cut at a word boundary within 60 characters.
- **Stickies are Lam's own words.** Never edit, reorder, or delete them. `[[Name]]` in a sticky or the body links to the paper with that slug, or else to the idea; the desk adds such names to `related` or `ideas` when it saves.
- **Write-ups**: `/paper-note <slug or PR#>` (`.claude/commands/paper-note.md`) checks out the PR branch, writes the body from the stickies (Summary, Key ideas, Questions, Connections), and pushes to the same PR. Lam reviews and publishes from the desk.
- **The desk home** shows each open draft as a card with its status, latest sticky notes, and ideas (read from the PR branch, or from the browser when it has unsaved edits), then **To read**: the reading queue in `_data/reading.yml` (title, link, optional topic, added, bibtex), committed straight to `main` by the desk. Read later adds to it; Start notes turns an item into a draft and removes it. To add papers for Lam, append items there in the same shape. Every queue change rebuilds the site; the page never shows the queue publicly, but the file is readable on GitHub.
- `/papers/` is the index (filter by text and idea, `?idea=` preselects one), `/papers/map/` is the force-directed map (d3, from `/papers/graph.json`; open drafts join it, dashed, when the browser is signed in at the desk).
- `_papers/` and `_data/reading.yml` are in `.prettierignore` because the desk writes them; `netlify.toml` skips deploy previews for `paper-notes/*` branches, which get a commit a minute while Lam writes.
- Code: `assets/js/papernotes.js` (format, GitHub client, merge; also loads in Node for tests), `assets/js/desk.js`, `assets/js/papermap.js`, `assets/js/papers.js` (index filter and `[[links]]` on a note page).

## OntoDB

The OntoDB book, manual, and code are kept in step with this site. `SYNC.md` lists what to update, where, and in what order.

## Before committing

CI runs `npx prettier . --check` on every push, so a file Prettier would reformat fails the build. Run `npx prettier --write <changed files>` (or `npx prettier . --check` to see what fails) before every commit, and commit the formatted files. Markdown tables are the usual cause: Prettier realigns every row when one cell grows.
