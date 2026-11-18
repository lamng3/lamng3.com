---
description: Write up a paper note from its sticky notes, on the note's pull request.
argument-hint: <slug or PR number>
---

Write up the paper note `$ARGUMENTS` on lamng3.com. The rules for paper notes are in `CLAUDE.md` under "Paper notes"; read them first.

1. Get the draft. If `$ARGUMENTS` is a number, run `gh pr checkout $ARGUMENTS`. Otherwise run `git fetch origin paper-notes/$ARGUMENTS` and `git switch paper-notes/$ARGUMENTS`. If there is no such branch but `_papers/$ARGUMENTS.md` is on `main`, run `git switch -c paper-notes/$ARGUMENTS origin/main`. Commit or stash nothing of your own first; if the working tree is dirty, stop and say so.
2. Read `_papers/<slug>.md`. The `stickies` are Lam's own notes, taken while reading: never edit, reorder, or delete them. Open the paper from `link` (the arXiv abstract or HTML page) to check facts and numbers.
3. Write the body below the front matter. If there is already a body, improve it rather than replacing it, and keep Lam's sentences.
   - `## Summary`: two to four sentences on the problem, the idea, and the result.
   - `## Key ideas`: one `###` per idea, built from the stickies. Keep Lam's wording where a sticky already says it well. Give numbers from the paper with their table or section.
   - `## Questions`: the question and critique stickies, each with what the paper says about it, or that it leaves it open.
   - `## Connections`: other notes as `/papers/<slug>/`, and algorithm topics as `/blog/<slug>/#<id>` when one fits.
   - Math in `$…$`. No paragraph, list item, or heading may end on a lone word. Use `[[Name]]` for an idea that has no note yet.
4. Front matter: add a quoted one-sentence `description` if missing, set `status: written`, and add an idea to `ideas` only when the write-up leans on it. Keep `updated` as today's date (`YYYY-MM-DD`, quoted).
5. Commit with a message like `Write up the notes on <title>.` and push to the same branch. Do not merge. Lam reviews and publishes at https://lamng3.com/papers/desk/.
