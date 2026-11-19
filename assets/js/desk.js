/* The paper desk (/papers/desk/): write sticky notes while reading, save them as a PR, publish by merging.
   Every keystroke is kept in this browser first; GitHub gets the note on Save, a minute after the last
   edit, and when the tab is hidden. */
(function () {
  "use strict";

  var P = window.PaperNotes;
  var gh = P.github;
  var $ = function (id) {
    return document.getElementById(id);
  };
  var SITE_BASE = location.origin;
  var PUSH_IDLE_MS = 60 * 1000;

  var state = {
    login: null,
    published: [], // [{slug, title}]
    prs: [], // open note PRs
    known: { papers: {}, ideas: [] }, // from /papers/graph.json and the drafts
    d: null, // the open draft
    pushing: false,
    pushAgain: false,
    pushTimer: null,
    saveTimer: null,
    lastDeleted: null,
    kind: P.store.get("papernotes.kind") || "idea",
  };

  /* ---------- small helpers ---------- */

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function show(id) {
    ["desk-loading", "desk-signin", "desk-home", "desk-editor"].forEach(function (x) {
      $(x).hidden = x !== id;
    });
  }
  function ago(ts) {
    if (!ts) return "";
    var s = Math.max(0, (Date.now() - new Date(ts).getTime()) / 1000);
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s / 60) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " d ago";
  }
  function errText(e) {
    if (!e) return "unknown error";
    if (e.status === 401) return "GitHub rejected the token (401). Sign out and sign in with a new one.";
    if (e.status === 403 || e.status === 404) return "GitHub said " + e.status + ": " + e.message + ". Check the token's permissions.";
    return e.message || String(e);
  }
  function linkify(html) {
    return html.replace(/\[\[([^\[\]\n]{1,80})\]\]/g, function (_, name) {
      var slug = P.slugify(name);
      var href = state.known.papers[slug] ? SITE_BASE + "/papers/" + slug + "/" : SITE_BASE + "/papers/?idea=" + encodeURIComponent(name);
      return '<a class="wikilink" href="' + href + '" target="_blank" rel="noopener">' + name + "</a>";
    });
  }
  function noop() {}
  function twoStep(btn, label, fn) {
    var original;
    btn.addEventListener("click", function () {
      if (btn.dataset.armed) {
        delete btn.dataset.armed;
        btn.textContent = original;
        fn();
        return;
      }
      original = btn.textContent;
      btn.dataset.armed = "1";
      btn.textContent = label;
      setTimeout(function () {
        if (btn.dataset.armed) {
          delete btn.dataset.armed;
          btn.textContent = original;
        }
      }, 4000);
    });
  }

  /* ---------- what the site already knows: titles and ideas ---------- */

  function loadKnown() {
    return fetch(SITE_BASE + "/papers/graph.json", { cache: "no-store" })
      .then(function (r) {
        return r.ok ? r.json() : { papers: [] };
      })
      .catch(function () {
        return { papers: [] };
      })
      .then(function (g) {
        var ideas = [];
        (g.papers || []).forEach(function (p) {
          state.known.papers[p.slug] = p.title;
          ideas = ideas.concat(p.ideas || []);
        });
        state.known.ideas = P.uniqCI(ideas);
        fillDatalists();
      });
  }
  function fillDatalists() {
    var ideas = state.known.ideas.slice();
    P.drafts.all().forEach(function (d) {
      ideas = ideas.concat(d.note.meta.ideas || []);
      state.known.papers[d.slug] = state.known.papers[d.slug] || d.note.meta.title;
    });
    $("dl-ideas").innerHTML = P.uniqCI(ideas)
      .map(function (i) {
        return '<option value="' + esc(i) + '">';
      })
      .join("");
    $("dl-papers").innerHTML = Object.keys(state.known.papers)
      .map(function (s) {
        return '<option value="' + esc(s) + '">' + esc(state.known.papers[s]) + "</option>";
      })
      .join("");
  }

  /* ---------- sign in ---------- */

  function start() {
    if (!window.jsyaml) {
      show("desk-signin");
      $("signin-error").hidden = false;
      $("signin-error").textContent = "A script failed to load from cdnjs. Reload the page.";
      return;
    }
    loadKnown();
    if (!P.getToken()) return show("desk-signin");
    gh.whoami()
      .then(function (me) {
        if (!me.canPush) throw new Error(me.login + " cannot push to lamng3/lamng3.com.");
        state.login = me.login;
        $("who").textContent = me.login;
        route();
      })
      .catch(function (e) {
        if (!e.status) {
          // GitHub is unreachable (offline): open anyway and work from this device's drafts.
          state.login = "offline";
          $("who").textContent = "(offline: notes are saved on this device)";
          return route();
        }
        if (e.status === 401) P.setToken(null);
        show("desk-signin");
        $("signin-error").hidden = false;
        $("signin-error").textContent = errText(e);
      });
  }

  $("signin-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    P.setToken($("token-input").value.trim());
    $("token-input").value = "";
    $("signin-error").hidden = true;
    show("desk-loading");
    start();
  });
  $("signout").addEventListener("click", function () {
    P.setToken(null);
    show("desk-signin");
  });

  /* ---------- routing ---------- */

  function route() {
    var add = /^#\/add\?(.*)$/.exec(location.hash);
    if (add) {
      if (state.d) leaveEditor();
      return fromTab(new URLSearchParams(add[1]));
    }
    var m = /^#\/edit\/([a-z0-9-]+)$/.exec(location.hash);
    if (state.d && (!m || m[1] !== state.d.slug)) leaveEditor();
    if (m) openNote(m[1]);
    else openHome();
  }
  window.addEventListener("hashchange", function () {
    if (state.login) route();
  });

  /* ---------- home: drafts and published notes ---------- */

  function openHome(message) {
    show("desk-home");
    $("home-banner").hidden = !message;
    if (message) $("home-banner").innerHTML = message;
    $("draft-list").innerHTML = '<li class="desk-empty">Loading…</li>';
    $("published-list").innerHTML = '<li class="desk-empty">Loading…</li>';
    $("queue-list").innerHTML = '<li class="desk-empty">Loading…</li>';
    loadQueue()
      .then(renderQueue)
      .catch(function (e) {
        $("queue-list").innerHTML = '<li class="desk-error">' + esc(errText(e)) + "</li>";
      });
    Promise.all([gh.notePRs(), gh.listDir(P.CFG.dir, P.CFG.base)])
      .then(function (r) {
        state.prs = r[0];
        state.published = r[1]
          .filter(function (f) {
            return /\.md$/.test(f.name);
          })
          .map(function (f) {
            var slug = f.name.replace(/\.md$/, "");
            return { slug: slug, title: state.known.papers[slug] || slug };
          });
        renderHome();
      })
      .catch(function (e) {
        state.prs = [];
        state.published = [];
        renderHome();
        $("home-banner").hidden = false;
        $("home-banner").textContent = "Could not reach GitHub (" + errText(e) + "). Showing the drafts on this device.";
      });
  }

  function renderHome() {
    var bySlug = {};
    state.prs.forEach(function (pr) {
      var slug = pr.head.ref.slice(P.CFG.prefix.length);
      bySlug[slug] = { slug: slug, title: pr.title.replace(/^Paper notes:\s*/, ""), pr: pr.number, url: pr.html_url, at: pr.updated_at };
    });
    P.drafts.all().forEach(function (d) {
      var row = bySlug[d.slug] || { slug: d.slug, pr: null, at: d.savedAt };
      row.title = d.note.meta.title || row.title || d.slug;
      row.local = d.dirty;
      row.stickies = d.note.stickies.length;
      if (!row.pr && !d.dirty && d.pr) return; // published or discarded elsewhere
      if (!row.pr && !d.dirty && !d.pr) return;
      bySlug[d.slug] = row;
    });
    var rows = Object.keys(bySlug)
      .map(function (k) {
        return bySlug[k];
      })
      .sort(function (a, b) {
        return new Date(b.at) - new Date(a.at);
      });
    $("draft-list").innerHTML = rows.length
      ? rows
          .map(function (r) {
            return (
              '<li class="draft-card" data-slug="' +
              esc(r.slug) +
              '">' +
              cardHTML(r, P.drafts.get(r.slug) ? P.drafts.get(r.slug).note : null) +
              "</li>"
            );
          })
          .join("")
      : '<li class="desk-empty">No drafts. Start one above.</li>';
    // Drafts that are not on this device: read their notes from the PR branch to fill the cards.
    rows.forEach(function (r) {
      if (!r.pr || P.drafts.get(r.slug)) return;
      gh.getFile(P.notePath(r.slug), P.branchOf(r.slug))
        .then(function (f) {
          var li = document.querySelector('.draft-card[data-slug="' + r.slug + '"]');
          if (f && li) li.innerHTML = cardHTML(r, P.parseNote(f.text));
        })
        .catch(noop);
    });

    var drafted = {};
    rows.forEach(function (r) {
      drafted[r.slug] = true;
    });
    $("published-list").innerHTML = state.published.length
      ? state.published
          .map(function (p) {
            return (
              '<li><a class="desk-row-title" href="' +
              SITE_BASE +
              "/papers/" +
              esc(p.slug) +
              '/">' +
              esc(p.title) +
              '</a><span class="desk-row-meta"><a href="#/edit/' +
              esc(p.slug) +
              '">' +
              (drafted[p.slug] ? "Edit (draft open)" : "Edit") +
              "</a></span></li>"
            );
          })
          .join("")
      : '<li class="desk-empty">Nothing published yet.</li>';
  }

  /* ---------- "Save to desk": the bookmark sends a paper's tab here as #/add?title=…&link=… ---------- */

  var BOOKMARKLET =
    "(function(){var m=function(n){return Array.prototype.map.call(document.querySelectorAll('meta[name=\"'+n+'\"],meta[property=\"'+n+'\"]'),function(e){return e.content})};" +
    "var u=location.href,x=u.match(/arxiv\\.org\\/(?:abs|pdf|html)\\/([0-9]{4}\\.[0-9]{4,5})/);if(x)u='https://arxiv.org/abs/'+x[1];" +
    "var t=(m('citation_title')[0]||m('og:title')[0]||document.title||'').replace(/\\s+/g,' ').trim();" +
    "var a=m('citation_author').map(function(s){var p=s.split(',');return p.length>1?p.slice(1).join(' ').trim()+' '+p[0].trim():s.trim()}).join(', ');" +
    "var y=((m('citation_publication_date')[0]||m('citation_date')[0]||m('citation_online_date')[0]||'').match(/[0-9]{4}/)||[''])[0];" +
    "var v=m('citation_conference_title')[0]||m('citation_journal_title')[0]||(x?'arXiv':'');" +
    "var q=new URLSearchParams({title:t,link:u,authors:a,year:y,venue:v});" +
    "window.open('" +
    SITE_BASE +
    "/papers/desk/#/add?'+q.toString(),'paperdesk')})()";
  $("bookmarklet").href = "javascript:" + BOOKMARKLET;
  $("bookmarklet").addEventListener("click", function (ev) {
    ev.preventDefault();
    $("home-banner").hidden = false;
    $("home-banner").textContent = "Drag Save to desk onto the bookmarks bar (⌘⇧B shows it), then click it on a paper's page.";
  });

  /* Open the paper's notes if it has some; otherwise fill the New paper form from the tab. */
  function fromTab(q) {
    var tab = {
      title: (q.get("title") || "").trim(),
      link: (q.get("link") || "").trim(),
      authors: (q.get("authors") || "").trim(),
      year: (q.get("year") || "").trim(),
      venue: (q.get("venue") || "").trim(),
    };
    history.replaceState(null, "", location.pathname + "#/");
    var key = P.normLink(tab.link);
    var local = P.drafts.all().filter(function (d) {
      return (key && P.normLink(d.note.meta.link) === key) || (tab.title && d.slug === P.slugify(tab.title));
    })[0];
    if (local) return route2edit(local.slug);
    show("desk-loading");
    Promise.all([gh.notePRs(), gh.listDir(P.CFG.dir, P.CFG.base)])
      .then(function (r) {
        var slug = P.slugify(tab.title);
        var pr = r[0].filter(function (p) {
          return p.head.ref === P.branchOf(slug);
        })[0];
        var pub = r[1].some(function (f) {
          return f.name === slug + ".md";
        });
        if (slug && (pr || pub)) return route2edit(slug);
        prefill(tab);
      })
      .catch(function () {
        prefill(tab);
      });
  }
  function route2edit(slug) {
    location.hash = "#/edit/" + slug;
  }
  function prefill(tab) {
    openHome(
      "From your tab: <strong>" +
        esc(tab.title || tab.link) +
        "</strong>" +
        (tab.authors ? " · " + esc(tab.authors) : "") +
        (tab.venue || tab.year ? " · " + esc([tab.venue, tab.year].filter(Boolean).join(" ")) : "") +
        ". Start notes now, or save it to read later."
    );
    $("new-title").value = tab.title;
    $("new-link").value = tab.link;
    state.extra = { authors: tab.authors, year: /^\d{4}$/.test(tab.year) ? Number(tab.year) : null, venue: tab.venue };
    $("new-title").focus();
  }

  /* One draft on the board: status, counts, its latest sticky notes, and its ideas. */
  function cardHTML(r, note) {
    var meta = note ? note.meta : {};
    var stickies = note ? note.stickies : [];
    var bits = [];
    if (meta.status) bits.push(esc(meta.status));
    if (note) bits.push(stickies.length + " sticky note" + (stickies.length === 1 ? "" : "s"));
    bits.push(ago(r.at));
    if (r.pr) bits.push('<a href="' + esc(r.url) + '" target="_blank" rel="noopener">PR #' + r.pr + "</a>");
    else bits.push("only on this device");
    if (r.local) bits.push('<span class="draft-unsaved">unsaved changes</span>');
    var latest = stickies.slice(-3).reverse();
    return (
      '<a class="draft-card-title" href="#/edit/' +
      esc(r.slug) +
      '">' +
      esc(meta.title || r.title) +
      "</a>" +
      (meta.authors ? '<p class="draft-card-authors">' + esc(meta.authors) + "</p>" : "") +
      '<p class="draft-card-meta">' +
      bits.join(" · ") +
      "</p>" +
      (latest.length
        ? '<ul class="draft-card-stickies">' +
          latest
            .map(function (s) {
              var t = s.text.length > 160 ? s.text.slice(0, 159) + "…" : s.text;
              return '<li class="kind-' + esc(s.kind) + '"><span class="draft-kind">' + esc(s.kind) + "</span> " + linkify(esc(t)) + "</li>";
            })
            .join("") +
          "</ul>"
        : note
          ? '<p class="draft-card-empty">No sticky notes yet.</p>'
          : "") +
      (meta.ideas && meta.ideas.length
        ? '<p class="draft-card-ideas">' +
          meta.ideas
            .slice(0, 6)
            .map(function (i) {
              return '<span class="chip">' + esc(i) + "</span>";
            })
            .join("") +
          "</p>"
        : "")
    );
  }

  $("draft-list").addEventListener("click", function (ev) {
    var card = ev.target.closest(".draft-card");
    if (!card || ev.target.closest("a")) return;
    location.hash = "#/edit/" + card.getAttribute("data-slug");
  });

  /* ---------- the reading queue: _data/reading.yml on main ---------- */

  var QUEUE_PATH = "_data/reading.yml";
  var QUEUE_HEAD =
    "# Papers to read, managed at https://lamng3.com/papers/desk/ (To read). Start notes there turns one into a draft.\n" +
    "# Each item: title, link, and optionally topic, added (YYYY-MM-DD), bibtex.\n";

  function queueKey(item) {
    return (item.link || item.title || "").trim().toLowerCase();
  }
  function parseQueue(text) {
    var list = text ? window.jsyaml.load(text) : [];
    return (Array.isArray(list) ? list : [])
      .filter(function (x) {
        return x && (x.title || x.link);
      })
      .map(function (x) {
        var out = { title: String(x.title || x.link) };
        ["link", "topic", "bibtex", "authors", "venue"].forEach(function (k) {
          if (x[k]) out[k] = String(x[k]);
        });
        if (x.year) out.year = Number(x.year) || x.year;
        if (x.added) out.added = x.added instanceof Date ? x.added.toISOString().slice(0, 10) : String(x.added);
        return out;
      });
  }
  function loadQueue() {
    return gh.getFile(QUEUE_PATH, P.CFG.base).then(function (f) {
      state.queue = { items: f ? parseQueue(f.text) : [], sha: f ? f.sha : null };
      return state.queue;
    });
  }
  /* Apply a change to the latest queue on GitHub and commit it; if someone else committed in between, reload and retry. */
  function saveQueue(change, message, retried) {
    return loadQueue()
      .then(function (q) {
        var items = change(q.items.slice());
        var text = QUEUE_HEAD + (items.length ? window.jsyaml.dump(items, { lineWidth: -1, noRefs: true, quotingType: '"' }) : "[]\n");
        return gh.putFile(QUEUE_PATH, text, message, P.CFG.base, q.sha).then(function (res) {
          state.queue = { items: items, sha: res.sha };
          return state.queue;
        });
      })
      .catch(function (e) {
        if (!retried && (e.status === 409 || e.status === 422)) return saveQueue(change, message, true);
        throw e;
      });
  }
  function queueAdd(item) {
    return saveQueue(
      function (items) {
        if (
          items.some(function (x) {
            return queueKey(x) === queueKey(item);
          })
        )
          return items;
        return items.concat([item]);
      },
      "Reading list: add " + item.title + "."
    );
  }
  function queueRemove(item, why) {
    return saveQueue(
      function (items) {
        return items.filter(function (x) {
          return queueKey(x) !== queueKey(item);
        });
      },
      "Reading list: " + (why || "remove") + " " + item.title + "."
    );
  }

  function renderQueue() {
    var items = (state.queue && state.queue.items) || [];
    $("queue-list").innerHTML = items.length
      ? items
          .map(function (x, i) {
            var meta = [x.authors, [x.venue, x.year].filter(Boolean).join(" "), x.topic, x.added ? "added " + x.added : ""]
              .filter(Boolean)
              .join(" · ");
            return (
              '<li data-i="' +
              i +
              '"><span class="queue-main">' +
              (x.link
                ? '<a class="desk-row-title" href="' + esc(x.link) + '" target="_blank" rel="noopener">' + esc(x.title) + "</a>"
                : '<span class="desk-row-title">' + esc(x.title) + "</span>") +
              (meta ? '<span class="desk-row-meta">' + esc(meta) + "</span>" : "") +
              '</span><span class="queue-actions"><button type="button" class="btn" data-q="start">Start notes</button><button type="button" class="btn danger" data-q="remove" aria-label="Remove from the reading list">Remove</button></span></li>'
            );
          })
          .join("")
      : '<li class="desk-empty">Nothing queued. Use Read later above to save a paper for later.</li>';
  }

  $("queue-list").addEventListener("click", function (ev) {
    var btn = ev.target.closest("[data-q]");
    if (!btn) return;
    var item = state.queue.items[Number(btn.closest("li").getAttribute("data-i"))];
    if (!item) return;
    if (btn.getAttribute("data-q") === "start") {
      var bib = item.bibtex ? P.parseBibtex(item.bibtex) : null;
      var slug = startDraft(item.title, item.link || "", bib, null, item);
      queueRemove(item, "start notes on").catch(function (e) {
        console.error("Reading list not updated:", e);
      });
      location.hash = "#/edit/" + slug;
    } else if (btn.dataset.armed) {
      btn.disabled = true;
      queueRemove(item)
        .then(renderQueue)
        .catch(function (e) {
          btn.disabled = false;
          $("home-banner").hidden = false;
          $("home-banner").textContent = "Not removed: " + errText(e);
        });
    } else {
      btn.dataset.armed = "1";
      btn.textContent = "Click again to remove";
      setTimeout(function () {
        delete btn.dataset.armed;
        btn.textContent = "Remove";
      }, 4000);
    }
  });

  function bibSummary(bib) {
    return [bib.title, bib.authors, [bib.venue, bib.year].filter(Boolean).join(" ")].filter(Boolean).join(" · ");
  }

  var NEW_BIB_HINT = $("new-bib-hint").textContent;
  $("new-bibtex").addEventListener("input", function () {
    var text = $("new-bibtex").value.trim();
    var bib = text ? P.parseBibtex(text) : null;
    if (bib && bib.title) $("new-title").value = bib.title;
    if (bib && bib.link) $("new-link").value = bib.link;
    $("new-bib-hint").textContent = !text ? NEW_BIB_HINT : bib ? "Read: " + bibSummary(bib) : "This does not look like a BibTeX entry yet.";
  });

  /* Make a local draft (pushed as a new PR when the editor opens) and return its slug. */
  function startDraft(title, link, bib, typedTitle, extra) {
    var slug = bib && bib.slug && (!typedTitle || typedTitle === bib.title) ? bib.slug : P.slugify(title);
    var exists =
      P.drafts.get(slug) ||
      state.published.some(function (p) {
        return p.slug === slug;
      }) ||
      state.prs.some(function (pr) {
        return pr.head.ref === P.branchOf(slug);
      });
    if (!exists) {
      var note = P.emptyNote(title, link);
      if (bib) {
        P.applyBibtex(note.meta, bib);
        note.meta.title = title;
        if (link) note.meta.link = link;
      }
      // Details read from the paper's tab (or saved with a queue item) fill what BibTeX did not.
      ["authors", "year", "venue"].forEach(function (k) {
        if (extra && extra[k] && !note.meta[k]) note.meta[k] = extra[k];
      });
      P.drafts.put({
        slug: slug,
        note: note,
        base: null,
        baseSha: null,
        pr: null,
        dirty: true,
        rev: 1,
        fresh: true,
      });
    }
    return slug;
  }

  function readForm() {
    var bibText = $("new-bibtex").value.trim();
    var bib = bibText ? P.parseBibtex(bibText) : null;
    var typed = $("new-title").value.trim();
    return {
      bib: bib,
      typed: typed,
      title: typed || (bib && bib.title) || "",
      link: $("new-link").value.trim() || (bib && bib.link) || "",
      extra: state.extra,
    };
  }
  function clearForm() {
    state.extra = null;
    $("new-title").value = "";
    $("new-link").value = "";
    $("new-bibtex").value = "";
    $("new-bib-hint").textContent = NEW_BIB_HINT;
  }

  $("new-form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var f = readForm();
    if (!P.slugify(f.title)) return $("new-title").focus();
    var slug = startDraft(f.title, f.link, f.bib, f.typed, f.extra);
    // Starting notes on a paper that was waiting in the reading list takes it off the list.
    var key = P.normLink(f.link);
    var queued =
      key &&
      ((state.queue && state.queue.items) || []).filter(function (x) {
        return P.normLink(x.link) === key;
      })[0];
    if (queued) queueRemove(queued, "start notes on").catch(noop);
    clearForm();
    location.hash = "#/edit/" + slug;
  });

  $("later-btn").addEventListener("click", function () {
    var f = readForm();
    if (!f.title) return $("new-title").focus();
    var item = { title: f.title };
    if (f.link) item.link = f.link;
    ["authors", "year", "venue"].forEach(function (k) {
      var v = (f.bib && f.bib[k]) || (f.extra && f.extra[k]);
      if (v) item[k] = v;
    });
    item.added = P.today();
    if (f.bib) item.bibtex = f.bib.bibtex;
    $("later-btn").disabled = true;
    queueAdd(item)
      .then(function () {
        clearForm();
        renderQueue();
        $("home-banner").hidden = false;
        $("home-banner").textContent = "Added " + item.title + " to your reading list.";
      })
      .catch(function (e) {
        $("home-banner").hidden = false;
        $("home-banner").textContent = "Not added: " + errText(e);
      })
      .then(function () {
        $("later-btn").disabled = false;
      });
  });

  /* ---------- the editor ---------- */

  function openNote(slug) {
    show("desk-loading");
    var branch = P.branchOf(slug);
    var path = P.notePath(slug);
    var local = P.drafts.get(slug);
    var banner = [];

    gh.branchSha(branch)
      .then(function (bsha) {
        if (bsha)
          return gh.getFile(path, branch).then(function (f) {
            return { file: f, source: "branch" };
          });
        return gh.getFile(path, P.CFG.base).then(function (f) {
          return { file: f, source: f ? "main" : null };
        });
      })
      .then(function (remote) {
        var d = local;
        var f = remote.file;
        if (!d && !f) {
          openHome("There is no note called <code>" + esc(slug) + "</code>.");
          return null;
        }
        if (!d) {
          d = { slug: slug, note: P.parseNote(f.text), base: f.text, baseSha: f.sha, pr: null, dirty: false, rev: 0 };
        } else if (f && f.sha !== d.baseSha) {
          if (!d.dirty) {
            d.note = P.parseNote(f.text);
          } else {
            var m = P.mergeNotes(P.parseNote(d.base || f.text), d.note, P.parseNote(f.text));
            d.note = m.note;
            banner.push(mergeMessage(m));
          }
          d.base = f.text;
          d.baseSha = f.sha;
        } else if (!f && d.baseSha) {
          // The note was discarded on GitHub; keep this device's copy as a new draft.
          d.base = null;
          d.baseSha = null;
          d.dirty = true;
        }
        if (remote.source !== "branch") d.pr = null;
        if (remote.source === "main") d.editingPublished = true;
        return (remote.source === "branch" && !d.pr ? gh.findPR(branch) : Promise.resolve(null)).then(function (pr) {
          if (pr) d.pr = pr.number;
          return d;
        });
      })
      .catch(function (e) {
        if (!local) {
          openHome(esc(errText(e)));
          return null;
        }
        banner.push("Could not reach GitHub (" + esc(errText(e)) + "). You are working from this device's copy.");
        return local;
      })
      .then(function (d) {
        if (!d) return;
        state.d = d;
        P.drafts.put(d);
        renderEditor();
        setBanner(banner.join(" "));
        show("desk-editor");
        $("c-text").focus();
        if (d.fresh) {
          delete d.fresh;
          push().catch(noop);
        } else if (d.dirty) schedulePush();
      });
  }

  function mergeMessage(m) {
    var msg = "This note changed on GitHub (perhaps Claude's write-up) while you had unsaved edits here. Both are kept.";
    if (m.conflicts.length) msg += " Where both changed the same field (" + esc(m.conflicts.join(", ")) + "), yours is kept.";
    if (m.theirBody != null) {
      state.theirBody = m.theirBody;
      msg += ' <button type="button" class="btn" data-use-theirs>Use the write-up from GitHub</button>';
    }
    return msg;
  }

  function setBanner(html) {
    $("banner").hidden = !html;
    $("banner").innerHTML = html || "";
  }

  $("banner").addEventListener("click", function (ev) {
    if (ev.target.matches("[data-use-theirs]") && state.theirBody != null) {
      state.d.note.body = state.theirBody;
      state.theirBody = null;
      $("f-body").value = state.d.note.body;
      changed();
      setBanner("");
    }
    if (ev.target.matches("[data-undo]") && state.lastDeleted) {
      state.d.note.stickies.push(state.lastDeleted);
      state.d.note.stickies.sort(function (a, b) {
        return a.at < b.at ? -1 : 1;
      });
      state.lastDeleted = null;
      setBanner("");
      renderStickies();
      changed();
    }
  });

  function leaveEditor() {
    if (state.d && state.d.dirty) push().catch(noop);
    clearTimeout(state.pushTimer);
    state.d = null;
  }

  var FIELDS = ["title", "authors", "year", "venue", "link", "status", "description"];

  function renderEditor() {
    var d = state.d;
    var m = d.note.meta;
    FIELDS.forEach(function (k) {
      var el = $("f-" + k);
      var v = m[k] == null ? "" : String(m[k]);
      if (el.value !== v && document.activeElement !== el) el.value = v;
    });
    if (document.activeElement !== $("f-body")) $("f-body").value = d.note.body;
    if (document.activeElement !== $("f-bibtex")) {
      $("f-bibtex").value = m.bibtex || "";
      $("f-bib-hint").hidden = true;
    }
    $("f-path").textContent = P.notePath(d.slug);
    $("claude-cmd").textContent = "/paper-note " + d.slug;
    ideasInput.render();
    relatedInput.render();
    renderKinds();
    renderStickies();
    renderStatus();
    document.title = (m.title || d.slug) + " · Paper desk";
  }

  function renderStatus(text) {
    var d = state.d;
    if (!d) return;
    var s = text;
    if (!s) {
      if (state.pushing) s = "Saving to GitHub…";
      else if (d.dirty) s = "Saved on this device";
      else if (d.pr) s = "Saved to GitHub";
      else s = "Saved";
    }
    $("status").textContent = s;
    var link = $("pr-link");
    link.hidden = !d.pr;
    if (d.pr) {
      link.href = "https://github.com/" + P.CFG.owner + "/" + P.CFG.repo + "/pull/" + d.pr;
      link.textContent = "PR #" + d.pr;
    }
    $("discard-btn").textContent = d.editingPublished ? "Discard edits" : "Discard";
  }

  /* every edit: keep it here at once, send it to GitHub after a quiet minute */
  function changed() {
    var d = state.d;
    d.dirty = true;
    d.rev = (d.rev || 0) + 1;
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(function () {
      if (state.d !== d) return;
      if (!P.drafts.put(d)) renderStatus("Could not save on this device; saving to GitHub instead");
    }, 200);
    renderStatus();
    schedulePush();
  }
  function schedulePush() {
    clearTimeout(state.pushTimer);
    state.pushTimer = setTimeout(function () {
      push().catch(noop);
    }, PUSH_IDLE_MS);
  }

  FIELDS.forEach(function (k) {
    $("f-" + k).addEventListener("input", function (ev) {
      var v = ev.target.value;
      if (k === "year") v = /^\d{4}$/.test(v.trim()) ? Number(v.trim()) : v.trim() || null;
      state.d.note.meta[k] = v;
      if (k === "title") document.title = v + " · Paper desk";
      changed();
    });
  });
  $("f-body").addEventListener("input", function (ev) {
    state.d.note.body = ev.target.value;
    changed();
  });
  /* Pasting BibTeX fills the details; the entry itself is kept for the page's Cite box. */
  $("f-bibtex").addEventListener("input", function (ev) {
    var text = ev.target.value.trim();
    var meta = state.d.note.meta;
    var bib = text ? P.parseBibtex(text) : null;
    var hint = $("f-bib-hint");
    hint.hidden = !text;
    if (bib) {
      P.applyBibtex(meta, bib);
      meta.bibtex = text;
      renderEditor();
      hint.textContent = "Filled in: " + bibSummary(bib);
    } else {
      meta.bibtex = text;
      hint.textContent = "This does not look like a BibTeX entry yet.";
    }
    changed();
  });

  /* ---------- chips: ideas and related papers ---------- */

  function chipInput(el, key, listId, placeholder) {
    el.innerHTML = '<ul class="chips"></ul><input list="' + listId + '" placeholder="' + placeholder + '" aria-label="' + placeholder + '" />';
    var ul = el.querySelector("ul");
    var input = el.querySelector("input");
    function list() {
      return state.d.note.meta[key] || [];
    }
    function setList(v) {
      state.d.note.meta[key] = P.uniqCI(v);
      render();
      changed();
    }
    function render() {
      ul.innerHTML = list()
        .map(function (x, i) {
          var label = key === "related" && state.known.papers[x] ? state.known.papers[x] : x;
          return '<li class="chip">' + esc(label) + '<button type="button" data-i="' + i + '" aria-label="Remove ' + esc(x) + '">×</button></li>';
        })
        .join("");
    }
    function add() {
      var v = input.value.replace(/,$/, "").trim();
      if (!v) return;
      if (key === "related") v = state.known.papers[v] ? v : P.slugify(v);
      input.value = "";
      setList(list().concat([v]));
    }
    input.addEventListener("keydown", function (ev) {
      if (ev.key === "Enter" || ev.key === ",") {
        ev.preventDefault();
        add();
      } else if (ev.key === "Backspace" && !input.value && list().length) {
        setList(list().slice(0, -1));
      }
    });
    input.addEventListener("change", add);
    input.addEventListener("blur", add);
    ul.addEventListener("click", function (ev) {
      var i = ev.target.getAttribute("data-i");
      if (i == null) return;
      var v = list().slice();
      v.splice(Number(i), 1);
      setList(v);
    });
    return { render: render };
  }
  var ideasInput = chipInput($("f-ideas"), "ideas", "dl-ideas", "Add an idea");
  var relatedInput = chipInput($("f-related"), "related", "dl-papers", "Add a paper");

  /* ---------- sticky notes ---------- */

  function renderKinds() {
    $("c-kinds").innerHTML = P.KINDS.map(function (k) {
      return (
        '<button type="button" role="radio" class="kind kind-' +
        k +
        '" data-kind="' +
        k +
        '" aria-checked="' +
        (k === state.kind) +
        '">' +
        k +
        "</button>"
      );
    }).join("");
  }
  $("c-kinds").addEventListener("click", function (ev) {
    var k = ev.target.getAttribute("data-kind");
    if (!k) return;
    state.kind = k;
    P.store.set("papernotes.kind", k);
    renderKinds();
    $("c-text").focus();
  });

  function stickyHTML(s, i) {
    var text = window.marked ? window.marked.parseInline(esc(s.text)) : esc(s.text);
    return (
      '<li class="sticky kind-' +
      s.kind +
      '" data-i="' +
      i +
      '"><div class="sticky-head"><button type="button" class="sticky-kind" data-act="kind" title="Change the kind">' +
      s.kind +
      "</button>" +
      (s.where ? '<span class="sticky-where">' + esc(s.where) + "</span>" : "") +
      '<span class="sticky-at">' +
      esc((s.at || "").slice(5, 16).replace("T", " ")) +
      '</span><button type="button" class="sticky-del" data-act="del" aria-label="Delete">×</button></div><div class="sticky-text" data-act="edit" title="Click to edit">' +
      linkify(text).replace(/\n/g, "<br>") +
      "</div></li>"
    );
  }

  function renderStickies() {
    var list = state.d.note.stickies;
    var html = "";
    for (var i = list.length - 1; i >= 0; i--) html += stickyHTML(list[i], i);
    $("sticky-list").innerHTML = html || '<li class="desk-empty">No sticky notes yet.</li>';
  }

  function addSticky() {
    var text = $("c-text").value.trim();
    if (!text) return;
    state.d.note.stickies.push({ text: text, kind: state.kind, where: $("c-where").value.trim() || undefined, at: P.nowStamp() });
    $("c-text").value = "";
    P.absorbLinks(state.d.note, Object.keys(state.known.papers));
    ideasInput.render();
    relatedInput.render();
    renderStickies();
    changed();
  }
  $("composer").addEventListener("submit", function (ev) {
    ev.preventDefault();
    addSticky();
    $("c-text").focus();
  });
  $("c-text").addEventListener("keydown", function (ev) {
    if (ev.key === "Enter" && !ev.shiftKey && !ev.isComposing) {
      ev.preventDefault();
      addSticky();
    }
  });

  $("sticky-list").addEventListener("click", function (ev) {
    if (ev.target.closest("a")) return;
    var li = ev.target.closest(".sticky");
    var act = ev.target.closest("[data-act]");
    if (!li || !act) return;
    var i = Number(li.getAttribute("data-i"));
    var s = state.d.note.stickies[i];
    var what = act.getAttribute("data-act");
    if (what === "del") {
      state.lastDeleted = state.d.note.stickies.splice(i, 1)[0];
      setBanner('Deleted a sticky note. <button type="button" class="btn" data-undo>Undo</button>');
      renderStickies();
      changed();
    } else if (what === "kind") {
      s.kind = P.KINDS[(P.KINDS.indexOf(s.kind) + 1) % P.KINDS.length];
      renderStickies();
      changed();
    } else if (what === "edit" && !li.querySelector("textarea")) {
      var box = li.querySelector(".sticky-text");
      var ta = document.createElement("textarea");
      ta.value = s.text;
      ta.rows = Math.max(2, s.text.split("\n").length + 1);
      ta.setAttribute("aria-label", "Edit sticky note");
      box.replaceWith(ta);
      ta.focus();
      var done = false;
      var finish = function (keep) {
        if (done) return;
        done = true;
        var v = ta.value.trim();
        if (keep && v && v !== s.text) {
          s.text = v;
          P.absorbLinks(state.d.note, Object.keys(state.known.papers));
          ideasInput.render();
          relatedInput.render();
          changed();
        }
        renderStickies();
      };
      ta.addEventListener("keydown", function (e) {
        if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
          e.preventDefault();
          finish(true);
        } else if (e.key === "Escape") finish(false);
      });
      ta.addEventListener("blur", function () {
        finish(true);
      });
    }
  });

  /* ---------- write-up preview ---------- */

  document.querySelectorAll("[data-view]").forEach(function (b) {
    b.addEventListener("click", function () {
      var preview = b.getAttribute("data-view") === "preview";
      document.querySelectorAll("[data-view]").forEach(function (x) {
        x.setAttribute("aria-pressed", String(x === b));
      });
      $("f-body").hidden = preview;
      $("body-preview").hidden = !preview;
      if (preview) {
        var md = state.d.note.body || "*Nothing written yet.*";
        $("body-preview").innerHTML = linkify(window.marked ? window.marked.parse(md) : "<pre>" + esc(md) + "</pre>");
        if (window.renderMathInElement)
          window.renderMathInElement($("body-preview"), {
            delimiters: [
              { left: "$$", right: "$$", display: true },
              { left: "$", right: "$", display: false },
            ],
            throwOnError: false,
          });
      }
    });
  });

  /* ---------- GitHub: save, publish, discard ---------- */

  function push() {
    var d = state.d;
    if (!d) return Promise.resolve();
    clearTimeout(state.pushTimer);
    if (state.pushing) {
      state.pushAgain = true;
      return state.pushing;
    }
    var branch = P.branchOf(d.slug);
    var path = P.notePath(d.slug);
    var rev = d.rev;
    var title = d.note.meta.title || d.slug;
    var text;

    function put() {
      P.absorbLinks(d.note, Object.keys(state.known.papers));
      d.note.meta.updated = P.today();
      text = P.serializeNote(d.note);
      var msg = (d.baseSha ? "Update the notes on " : "Start notes on ") + title + ".";
      return gh.putFile(path, text, msg, branch, d.baseSha);
    }

    state.pushing = gh
      .branchSha(branch)
      .then(function (sha) {
        if (sha) return null;
        return gh.branchSha(P.CFG.base).then(function (mainSha) {
          return gh.createBranch(branch, mainSha);
        });
      })
      .then(put)
      .catch(function (e) {
        if (e.status !== 409 && e.status !== 422) throw e;
        // Someone else (Claude, or another device) pushed since we last looked: merge, then retry once.
        return gh.getFile(path, branch).then(function (f) {
          if (!f) throw e;
          var m = P.mergeNotes(P.parseNote(d.base || f.text), d.note, P.parseNote(f.text));
          d.note = m.note;
          d.base = f.text;
          d.baseSha = f.sha;
          renderEditor();
          setBanner(mergeMessage(m));
          return put();
        });
      })
      .then(function (res) {
        d.base = text;
        d.baseSha = res.sha;
        if (d.pr) return null;
        return gh.findPR(branch).then(function (pr) {
          return (
            pr ||
            gh.createPR(
              branch,
              "Paper notes: " + title,
              "Written at " +
                SITE_BASE +
                "/papers/desk/#/edit/" +
                d.slug +
                ".\n\nMerging publishes " +
                SITE_BASE +
                "/papers/" +
                d.slug +
                "/. Run `/paper-note " +
                d.slug +
                "` in Claude Code to have the write-up drafted from the sticky notes."
            )
          );
        });
      })
      .then(function (pr) {
        if (pr) d.pr = pr.number;
        if (d.rev === rev) d.dirty = false;
        if (state.d === d) P.drafts.put(d);
        else if (!d.dirty) P.drafts.put(d);
        state.pushing = false;
        if (state.d === d) renderStatus();
        if (state.pushAgain) {
          state.pushAgain = false;
          if (d.dirty) return push();
        }
      })
      .catch(function (e) {
        state.pushing = false;
        state.pushAgain = false;
        P.drafts.put(d);
        if (state.d === d) {
          renderStatus("Not saved to GitHub: " + errText(e) + " Your notes are safe on this device.");
          schedulePush();
        }
        throw e;
      });
    renderStatus();
    return state.pushing;
  }

  $("save-btn").addEventListener("click", function () {
    push().catch(noop);
  });
  document.addEventListener("keydown", function (ev) {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === "s" && state.d) {
      ev.preventDefault();
      push().catch(noop);
    }
  });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && state.d && state.d.dirty) push().catch(noop);
  });
  window.addEventListener("focus", function () {
    // Back from the paper's tab: the cursor is ready for the next sticky note.
    if (state.d && !$("desk-editor").hidden && (document.activeElement === document.body || !document.activeElement)) $("c-text").focus();
  });

  twoStep($("publish-btn"), "Click again to publish", function () {
    var d = state.d;
    var title = d.note.meta.title || d.slug;
    renderStatus("Publishing…");
    (d.dirty || !d.pr ? push() : Promise.resolve())
      .then(function () {
        var tryMerge = function (left) {
          return gh.mergePR(d.pr, "Publish the notes on " + title + ".").catch(function (e) {
            if (e.status === 405 && left > 0)
              return new Promise(function (r) {
                setTimeout(r, 2500);
              }).then(function () {
                return tryMerge(left - 1);
              });
            throw e;
          });
        };
        return tryMerge(2);
      })
      .then(function () {
        return gh.deleteBranch(P.branchOf(d.slug));
      })
      .then(function () {
        clearTimeout(state.saveTimer);
        clearTimeout(state.pushTimer);
        P.drafts.del(d.slug);
        state.d = null;
        state.known.papers[d.slug] = title;
        location.hash = "#/";
        openHome(
          'Published. <a href="' +
            SITE_BASE +
            "/papers/" +
            esc(d.slug) +
            '/">' +
            esc(title) +
            "</a> goes live once the site rebuilds, in a minute or two."
        );
      })
      .catch(function (e) {
        renderStatus("Not published: " + errText(e));
      });
  });

  twoStep($("discard-btn"), "Click again to discard", function () {
    var d = state.d;
    clearTimeout(state.pushTimer);
    (d.pr ? gh.closePR(d.pr) : Promise.resolve())
      .then(function () {
        return gh.deleteBranch(P.branchOf(d.slug));
      })
      .then(function () {
        clearTimeout(state.saveTimer);
        clearTimeout(state.pushTimer);
        P.drafts.del(d.slug);
        state.d = null;
        location.hash = "#/";
        openHome("Discarded the draft of " + esc(d.note.meta.title || d.slug) + ".");
      })
      .catch(function (e) {
        renderStatus("Not discarded: " + errText(e));
      });
  });

  start();
})();
