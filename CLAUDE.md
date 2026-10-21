# Working notes

Lam Nguyen's site, hosted on Netlify. A profile, projects, a code library, and a blog, in a white, minimal style modeled on ekzhang.com. There is no profile photo.

## Pages

- `_pages/about.md` is the homepage (`permalink: /`). Its "Notable work" list comes from projects with `notable: true` in `_data/projects.yml`.
- `_pages/projects.md` is /projects/, built from `_data/projects.yml` in the order listed there (research first, then tools; the page can also sort by date or stars). A project with no `links` (Aegis, still private) shows no links or screenshot. Screenshots live in `assets/img/projects/` (960px JPEG). Refresh star counts with `scripts/update-stars.sh`.
- `_pages/resume.md` is /resume/: work, education with graduate and undergraduate coursework (course names from the CWRU transcript; never grades, GPA or IDs), awards, service.
- The homepage text follows Lam's original wording. Keep edits to it small.
- `_pages/library.md` is /library/, the code library. It is not in the nav; it is reached from its entry on /projects/ (slug `library`), and the nav highlights "projects" on library pages. `scripts/sync-library.py` generates `_data/library.yml` and `_pages/library/*.md` from `../competitive-programming` (lamng3/competitive-programming-notebook); do not edit those by hand, rerun the script.
- `_layouts/default.liquid` holds the masthead (name, section name, lowercase nav) and the contact footer. `assets/js/pages.js` sorts projects, filters the library, and switches template tabs.
- `_pages/blog.md` is the blog index: a card grid of topics with their last-updated dates, in the order of `_data/topics.yml`. Topic names stay generic, like cp-algorithms or the USACO Guide (Binary Search, Range Queries, Hashing), so each one can hold many techniques.
- `_pages/leetcode.md` is Selected LeetCode Problems. Each row's topic links into a topic page.
- Topic pages use `layout: post`. With no `date`, the layout shows "Updated" and `last_updated`.

## Topic pages (`_pages/topics/`)

The blog is grouped by technique, like cp-algorithms. One page per topic, at `/blog/<slug>/`. There are no dated posts.

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
- To add a technique: add a section to the topic page, bump `last_updated`, and add `{id, title}` under that topic in `_data/topics.yml`. A new topic needs a new page and a new entry in `_data/topics.yml`. Prepend a line to `_data/recent.yml` (date, title, topic, url) so it shows under Recent on the blog index. Keep that list short; drop lines that are no longer current.
- Link between techniques with `/blog/<slug>/#<id>`, or `#<id>` within the same page.
- Quote `title` and `description`. A `: ` inside an unquoted YAML value breaks the page.
- `_redirects` maps the old dated post URLs (`/blog/2026/<slug>/`) to their sections. Keep it.

## OntoDB and MemCommit

The OntoDB book, manual, and code, and the MemCommit paper, manual, code, and the projects that use it, are kept in step with this site. `SYNC.md` lists what to update, where, and in what order, for each.

MemCommit's repos are still private, so its project entry links only the paper; add its code and manual links when they are public (see `SYNC.md`, section 5).
