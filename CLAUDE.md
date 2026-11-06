# Working notes

Lam Nguyen's site, hosted on Netlify. A profile, projects, a code library, and algorithm notes, in a white, minimal style modeled on ekzhang.com. There is no profile photo.

## Pages

- `_pages/about.md` is the homepage (`permalink: /`). Its "Notable work" list comes from projects with `notable: true` in `_data/projects.yml`.
- `_pages/projects.md` is /projects/, built from `_data/projects.yml` in the order listed there (research first, then tools; the page can also sort by date or stars). A project with no `links` shows no links or screenshot. Screenshots live in `assets/img/projects/` (960px JPEG). Refresh star counts with `scripts/update-stars.sh`.
- `_pages/resume.md` is /resume/: a simplified academic version of the PhD CV (`../phd_cv/phd/cv/main.tex`), in the same order: education with graduate and undergraduate technical coursework (course names from the CWRU transcript, including every technical course taken for credit; never grades, GPA or IDs), publications, talks, research and industry experience, teaching, awards, services, extracurriculars. Leave out the CV's phone number, references, and skills, and keep industry entries free of team names.
- The homepage text follows Lam's own wording and the framing of the PhD CV and statement of purpose: semantic data infrastructure for trustworthy AI agents. Keep edits to it small. GPU vector search stays in the research interests even though the CV omits it.
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

## OntoDB

The OntoDB book, manual, and code are kept in step with this site. `SYNC.md` lists what to update, where, and in what order.

## Before committing

CI runs `npx prettier . --check` on every push, so a file Prettier would reformat fails the build. Run `npx prettier --write <changed files>` (or `npx prettier . --check` to see what fails) before every commit, and commit the formatted files. Markdown tables are the usual cause: Prettier realigns every row when one cell grows.
