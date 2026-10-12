/* Spotlight-style search over the blog.
   The index is built in the browser: on first open, every topic page is
   fetched and cut into one record per h2/h3 section (plus one per row of
   the LeetCode table), so a hit links straight to its #id. The built index
   is cached in localStorage under the site's build time, so later pages
   and visits search instantly and a redeploy invalidates it. */
(function () {
  var root = document.getElementById("spotlight");
  var dataEl = document.getElementById("search-data");
  if (!root || !dataEl) return;

  var data = JSON.parse(dataEl.textContent);
  var input = root.querySelector(".spotlight-input");
  var list = root.querySelector(".spotlight-list");
  var preview = root.querySelector(".spotlight-preview");
  var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  var CACHE_KEY = "spotlight-index";
  var PER_GROUP = 6;

  var records = null; // the index, once built
  var loading = null; // the promise building it
  var items = []; // the rows on screen, in keyboard order
  var active = 0;
  var lastFocus = null;

  if (!isMac) {
    Array.prototype.forEach.call(document.querySelectorAll(".mod-key"), function (k) {
      k.textContent = "Ctrl";
    });
  }

  /* ---------- text ---------- */

  // Lowercase and strip accents one UTF-16 unit at a time, so offsets in the
  // folded string line up with the original (needed for highlighting).
  function fold(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      var f = c.normalize("NFD")[0].toLowerCase();
      out += f.length === 1 ? f : c;
    }
    return out;
  }

  function isWord(c) {
    return !!c && /[a-z0-9]/.test(c);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  var TEX = {
    le: "≤",
    leq: "≤",
    ge: "≥",
    geq: "≥",
    ne: "≠",
    neq: "≠",
    cdot: "·",
    times: "×",
    oplus: "⊕",
    sum: "Σ",
    prod: "Π",
    to: "→",
    rightarrow: "→",
    infty: "∞",
    in: "∈",
    lfloor: "⌊",
    rfloor: "⌋",
    lceil: "⌈",
    rceil: "⌉",
    mid: "|",
    dots: "…",
    ldots: "…",
    cdots: "…",
    approx: "≈",
    equiv: "≡",
    pmod: "mod",
    bmod: "mod",
    mu: "μ",
    alpha: "α",
    beta: "β",
    epsilon: "ε",
    lambda: "λ",
    sigma: "σ",
    pi: "π",
    log: "log",
    min: "min",
    max: "max",
    gcd: "gcd",
    subseteq: "⊆",
    cup: "∪",
    cap: "∩",
    emptyset: "∅",
    lvert: "|",
    rvert: "|",
  };

  // LaTeX is rendered by KaTeX after load, so the fetched HTML still holds the
  // source. Turn it into something readable in a snippet.
  function plainTex(tex) {
    return tex
      .replace(/\\(?:text|textbf|mathrm|mathbf|mathit|operatorname|mathcal)\s*\{([^{}]*)\}/g, "$1")
      .replace(/\\binom\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "C($1, $2)")
      .replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, "($1)/($2)")
      .replace(/\\([a-zA-Z]+)/g, function (m, name) {
        return TEX[name] !== undefined ? TEX[name] : "";
      })
      .replace(/\\[,;:! ]/g, " ")
      .replace(/[{}]/g, "")
      .replace(/\\/g, "");
  }

  function clean(s) {
    return s
      .replace(/\$\$([\s\S]+?)\$\$/g, function (m, tex) {
        return plainTex(tex);
      })
      .replace(/\\\(([\s\S]+?)\\\)/g, function (m, tex) {
        return plainTex(tex);
      })
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ---------- index ---------- */

  function rec(kind, title, crumb, url, topic) {
    return { k: kind, t: title, p: crumb, u: url, topic: topic, b: "", c: "" };
  }

  function addText(r, el) {
    if (!r) return;
    if (el.matches("pre, .highlight, div.highlighter-rouge")) {
      r.c += " " + el.textContent;
      return;
    }
    var copy = el.cloneNode(true);
    Array.prototype.forEach.call(copy.querySelectorAll("pre, .highlight"), function (code) {
      r.c += " " + code.textContent;
      code.remove();
    });
    r.b += " " + copy.textContent;
  }

  function parsePage(html, topic) {
    var doc = new DOMParser().parseFromString(html, "text/html");
    var article = doc.querySelector("article.post");
    if (!article) return [];
    var url = topic.url;
    var out = [];

    // the LeetCode list: one record per problem
    var table = article.querySelector("table");
    if (table && /leetcode/.test(url)) {
      var page = rec("topic", topic.title, "Blog", url, topic.title);
      page.b = topic.desc || "";
      out.push(page);
      Array.prototype.forEach.call(table.querySelectorAll("tbody tr"), function (tr) {
        var cells = tr.querySelectorAll("td");
        if (cells.length < 2) return;
        var inner = cells[1].querySelector('a[href^="/"]');
        var outer = cells[0].querySelector("a");
        var r = rec("problem", clean(cells[0].textContent), topic.title, inner ? inner.getAttribute("href") : outer ? outer.href : url, topic.title);
        r.b = clean(cells[1].textContent);
        r.ext = outer ? outer.href : null;
        out.push(r);
      });
      return out.map(finish);
    }

    var top = rec("topic", topic.title, "Blog", url, topic.title);
    top.b = (topic.desc || "") + " ";
    out.push(top);
    var h2 = null;
    var cur = top;
    var seenH2 = false;

    Array.prototype.forEach.call(article.children, function (el) {
      if (el.matches("header, nav, script, .post-toc")) return;
      if (el.tagName === "H2") {
        seenH2 = true;
        h2 = rec("section", el.textContent.trim(), topic.title, url + "#" + el.id, topic.title);
        cur = h2;
        out.push(cur);
      } else if (el.tagName === "H3") {
        cur = rec("sub", el.textContent.trim(), h2 ? topic.title + " › " + h2.t : topic.title, url + "#" + el.id, topic.title);
        cur.parent = h2 ? h2.t : null;
        out.push(cur);
      } else if (el.tagName === "DETAILS" && !seenH2) {
        // the shared C++ header above the first technique: same on every page
      } else {
        addText(cur, el);
      }
    });
    return out.map(finish);
  }

  function finish(r) {
    r.t = clean(r.t);
    r.b = clean(r.b);
    r.c = r.c.replace(/\s+/g, " ").trim();
    return r;
  }

  // folded copies are derived, so they are not cached
  function prepare(recs) {
    recs.forEach(function (r) {
      r.ft = fold(r.t);
      r.fp = fold(r.p);
      r.fb = fold(r.b);
      r.fc = fold(r.c);
      r.words = r.ft.split(/[^a-z0-9]+/).filter(Boolean);
    });
    return recs;
  }

  function loadIndex() {
    if (records) return Promise.resolve(records);
    if (loading) return loading;
    try {
      var cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
      if (cached && cached.build === data.build && cached.records) {
        records = prepare(cached.records);
        return Promise.resolve(records);
      }
    } catch (e) {}

    loading = Promise.all(
      data.topics.map(function (topic) {
        return fetch(topic.url)
          .then(function (res) {
            return res.ok ? res.text() : "";
          })
          .then(function (html) {
            return html ? parsePage(html, topic) : [];
          })
          .catch(function () {
            return [];
          });
      })
    ).then(function (pages) {
      var all = [].concat.apply([], pages);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ build: data.build, records: all }));
      } catch (e) {}
      records = prepare(all);
      loading = null;
      return records;
    });
    return loading;
  }

  /* ---------- matching ---------- */

  // first index of term in hay that starts a word, or -1
  function wordStart(hay, term, from) {
    var i = hay.indexOf(term, from || 0);
    while (i !== -1) {
      if (!isWord(hay[i - 1])) return i;
      i = hay.indexOf(term, i + 1);
    }
    return -1;
  }

  function countWordStarts(hay, term, cap) {
    var n = 0;
    var i = wordStart(hay, term, 0);
    while (i !== -1 && n < cap) {
      n++;
      i = wordStart(hay, term, i + term.length);
    }
    return n;
  }

  // Damerau-Levenshtein distance <= 1
  function nearly(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    if (i === a.length || i === b.length) return Math.abs(a.length - b.length) <= 1;
    if (a.slice(i + 1) === b.slice(i + 1)) return true; // substitution
    if (a.slice(i + 1) === b.slice(i)) return true; // deletion
    if (a.slice(i) === b.slice(i + 1)) return true; // insertion
    return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2); // swap
  }

  // a typo'd term against the start of a title word
  function fuzzyTitle(r, t) {
    if (t.length < 4) return false;
    return r.words.some(function (w) {
      for (var len = t.length - 1; len <= t.length + 1; len++) {
        if (len <= w.length && nearly(t, w.slice(0, len))) return true;
      }
      return false;
    });
  }

  function termScore(r, t) {
    var s = 0;
    var ti = wordStart(r.ft, t);
    if (ti !== -1) {
      s += 12;
      if (!isWord(r.ft[ti + t.length])) s += 4; // whole word
      if (ti === 0) s += 3;
    } else if (t.length >= 3 && r.ft.indexOf(t) !== -1) {
      s += 5;
    }
    if (wordStart(r.fp, t) !== -1) s += 3;
    var n = countWordStarts(r.fb, t, 32);
    if (n) s += 2 + Math.log2(n) * 1.5;
    else if (t.length >= 3 && r.fb.indexOf(t) !== -1) s += 1;
    if (wordStart(r.fc, t) !== -1) s += 1;
    if (!s && fuzzyTitle(r, t)) s += 6;
    return s;
  }

  var KIND_BONUS = { topic: 3, section: 2, problem: 1, sub: 0 };

  function search(q) {
    var phrase = fold(q).trim();
    var terms = phrase.split(/[^a-z0-9]+/).filter(Boolean);
    if (!terms.length) return [];
    var hits = [];
    records.forEach(function (r) {
      var s = 0;
      for (var i = 0; i < terms.length; i++) {
        var ts = termScore(r, terms[i]);
        if (!ts) return; // every term has to land somewhere
        s += ts;
      }
      if (r.ft === phrase) s += 25; // the exact title wins
      else if (r.ft.indexOf(phrase) === 0) s += 6;
      if (terms.length > 1) {
        if (r.ft.indexOf(phrase) !== -1) s += 12;
        else if (r.fb.indexOf(phrase) !== -1) s += 5;
      }
      s += KIND_BONUS[r.k];
      hits.push({ r: r, s: s });
    });
    hits.sort(function (a, b) {
      return b.s - a.s;
    });
    return hits.map(function (h) {
      return h.r;
    });
  }

  /* ---------- highlighting ---------- */

  function ranges(folded, terms) {
    var out = [];
    terms.forEach(function (t) {
      var i = folded.indexOf(t);
      while (i !== -1) {
        if (!isWord(folded[i - 1]) || t.length >= 3) out.push([i, i + t.length]);
        i = folded.indexOf(t, i + t.length);
      }
    });
    out.sort(function (a, b) {
      return a[0] - b[0];
    });
    var merged = [];
    out.forEach(function (r) {
      var last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push(r.slice());
    });
    return merged;
  }

  function mark(text, terms) {
    var rs = ranges(fold(text), terms);
    var html = "";
    var at = 0;
    rs.forEach(function (r) {
      html += escapeHtml(text.slice(at, r[0])) + "<mark>" + escapeHtml(text.slice(r[0], r[1])) + "</mark>";
      at = r[1];
    });
    return html + escapeHtml(text.slice(at));
  }

  // a window of `len` characters around the first hit in the body (or code)
  function snippet(r, terms, len) {
    var text = r.b;
    var folded = r.fb;
    var pos = -1;
    terms.forEach(function (t) {
      var i = wordStart(folded, t);
      if (i === -1 && t.length >= 3) i = folded.indexOf(t);
      if (i !== -1 && (pos === -1 || i < pos)) pos = i;
    });
    if (pos === -1 && r.c) {
      terms.forEach(function (t) {
        var i = r.fc.indexOf(t);
        if (i !== -1 && (pos === -1 || i < pos)) {
          pos = i;
          text = r.c;
        }
      });
    }
    if (!text) return "";
    if (pos === -1) pos = 0;
    var start = Math.max(0, pos - Math.round(len * 0.3));
    if (start > 0) {
      var sp = text.indexOf(" ", start);
      if (sp !== -1 && sp < pos) start = sp + 1;
    }
    var end = Math.min(text.length, start + len);
    if (end < text.length) {
      var sp2 = text.lastIndexOf(" ", end);
      if (sp2 > pos) end = sp2;
    }
    return (start > 0 ? "… " : "") + mark(text.slice(start, end), terms) + (end < text.length ? " …" : "");
  }

  /* ---------- rendering ---------- */

  var ICONS = {
    topic: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/></svg>',
    section: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14M5 15h14M10 4 8 20M16 4l-2 16"/></svg>',
    sub: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7h12M6 12h12M6 17h8"/></svg>',
    problem: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 8-4 4 4 4M15 8l4 4-4 4"/></svg>',
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>',
  };
  var KIND_LABEL = { topic: "Topic", section: "Technique", sub: "Section", problem: "LeetCode problem" };

  function currentQuery() {
    return input.value;
  }

  function termsOf(q) {
    return fold(q)
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  }

  function row(r, i, terms, big) {
    var snip = terms.length ? snippet(r, terms, 110) : escapeHtml(r.b.slice(0, 110));
    return (
      '<a class="sl-row' +
      (big ? " sl-top" : "") +
      '" id="sl-' +
      i +
      '" role="option" data-i="' +
      i +
      '" href="' +
      escapeHtml(r.u) +
      '" tabindex="-1">' +
      '<span class="sl-icon sl-icon--' +
      r.k +
      '">' +
      ICONS[r.k] +
      "</span>" +
      '<span class="sl-text">' +
      '<span class="sl-title">' +
      (terms.length ? mark(r.t, terms) : escapeHtml(r.t)) +
      "</span>" +
      '<span class="sl-crumb">' +
      escapeHtml(r.k === "topic" ? r.b : r.p) +
      "</span>" +
      (snip ? '<span class="sl-snip">' + snip + "</span>" : "") +
      "</span></a>"
    );
  }

  function group(label, body) {
    return '<div class="sl-group" role="presentation"><div class="sl-label">' + escapeHtml(label) + "</div>" + body + "</div>";
  }

  function render() {
    var q = currentQuery().trim();
    var terms = termsOf(q);
    var html = "";
    items = [];

    if (!terms.length) {
      // nothing typed: browse the topics
      var rows = data.topics.map(function (t) {
        var r = { k: "topic", t: t.title, p: "Blog", u: t.url, b: t.desc || "", topic: t.title };
        items.push(r);
        return row(r, items.length - 1, [], false);
      });
      html = group("Topics", rows.join(""));
    } else if (!records) {
      html = '<div class="sl-empty"><span class="sl-spinner"></span>Indexing notes…</div>';
    } else {
      var hits = search(q);
      if (!hits.length) {
        html =
          '<div class="sl-empty">' +
          ICONS.search +
          "<p>No results for “" +
          escapeHtml(q) +
          '”</p><p class="sl-hint">Try a technique (segment tree), a problem name, or a single keyword.</p></div>';
      } else {
        var topHit = hits[0];
        items.push(topHit);
        html += group("Top Hit", row(topHit, 0, terms, true));

        // the rest, grouped by topic, groups ordered by their best hit
        var groups = [];
        var byTopic = {};
        hits.slice(1).forEach(function (r) {
          if (!byTopic[r.topic]) {
            byTopic[r.topic] = [];
            groups.push(r.topic);
          }
          if (byTopic[r.topic].length < PER_GROUP) byTopic[r.topic].push(r);
        });
        groups.forEach(function (name) {
          var body = byTopic[name]
            .map(function (r) {
              items.push(r);
              return row(r, items.length - 1, terms, false);
            })
            .join("");
          html += group(name, body);
        });
      }
    }

    list.innerHTML = html;
    root.classList.toggle("has-results", items.length > 0);
    select(0, true);
  }

  function renderPreview(r) {
    if (!r) {
      preview.innerHTML = "";
      return;
    }
    var terms = termsOf(currentQuery());
    var excerpt = terms.length ? snippet(r, terms, 420) : escapeHtml(r.b.slice(0, 420)) + (r.b.length > 420 ? " …" : "");
    var label = KIND_LABEL[r.k] + (r.k === "topic" ? "" : " in " + r.topic);
    var extra = "";

    if (r.k === "topic" && records) {
      var parts = records.filter(function (x) {
        return x.topic === r.topic && (x.k === "section" || x.k === "problem");
      });
      if (parts.length) {
        extra =
          '<p class="sl-pv-label">' +
          (parts[0].k === "problem" ? parts.length + " problems" : "Techniques") +
          '</p><ul class="sl-chips">' +
          parts
            .slice(0, 12)
            .map(function (x) {
              return '<li><a href="' + escapeHtml(x.u) + '">' + escapeHtml(x.t) + "</a></li>";
            })
            .join("") +
          "</ul>";
      }
    } else if (r.k === "problem" && r.ext) {
      extra =
        '<p class="sl-pv-label">Topic</p><p class="sl-pv-crumb">' +
        escapeHtml(r.b) +
        '</p><p><a class="sl-pv-ext" href="' +
        escapeHtml(r.ext) +
        '" target="_blank" rel="noopener">Open on LeetCode ↗</a></p>';
      excerpt = "";
    }

    preview.innerHTML =
      '<div class="sl-pv-head"><span class="sl-icon sl-icon--' +
      r.k +
      '">' +
      ICONS[r.k] +
      '</span><span class="sl-pv-kind">' +
      escapeHtml(label) +
      "</span></div>" +
      '<h2 class="sl-pv-title">' +
      (terms.length ? mark(r.t, terms) : escapeHtml(r.t)) +
      "</h2>" +
      '<p class="sl-pv-crumb">' +
      escapeHtml(r.k === "topic" ? "lamng3.com" + r.u : r.p) +
      "</p>" +
      (excerpt ? '<p class="sl-pv-text">' + excerpt + "</p>" : "") +
      extra +
      '<p class="sl-pv-open"><kbd>↵</kbd> ' +
      (r.k === "topic" ? "Open topic" : r.k === "problem" ? "Open technique" : "Jump to section") +
      "</p>";
  }

  function select(i, fromRender) {
    if (!items.length) {
      input.removeAttribute("aria-activedescendant");
      renderPreview(null);
      return;
    }
    active = (i + items.length) % items.length;
    var rows = list.querySelectorAll(".sl-row");
    Array.prototype.forEach.call(rows, function (el) {
      var on = +el.dataset.i === active;
      el.classList.toggle("is-active", on);
      el.setAttribute("aria-selected", on ? "true" : "false");
      if (on && !fromRender) el.scrollIntoView({ block: "nearest" });
    });
    if (fromRender) list.scrollTop = 0;
    input.setAttribute("aria-activedescendant", "sl-" + active);
    renderPreview(items[active]);
  }

  /* ---------- open / close / go ---------- */

  function go(r, newTab) {
    if (!r) return;
    if (newTab) {
      window.open(r.u, "_blank", "noopener");
      return;
    }
    var target = new URL(r.u, location.href);
    close(true);
    if (target.pathname === location.pathname) {
      var el = target.hash && document.getElementById(decodeURIComponent(target.hash.slice(1)));
      if (target.hash) history.pushState(null, "", target.hash);
      if (el) el.scrollIntoView();
      else window.scrollTo(0, 0);
    } else {
      location.href = target.href;
    }
  }

  function open() {
    if (!root.hidden) return;
    lastFocus = document.activeElement;
    root.hidden = false;
    document.documentElement.classList.add("spotlight-open");
    // reflow, then animate in
    void root.offsetWidth;
    root.classList.add("is-open");
    input.focus();
    input.select();
    render();
    loadIndex().then(function () {
      if (!root.hidden) render();
    });
  }

  function close(navigating) {
    if (root.hidden) return;
    root.classList.remove("is-open");
    root.hidden = true;
    document.documentElement.classList.remove("spotlight-open");
    if (!navigating && lastFocus && lastFocus.focus) lastFocus.focus();
  }

  input.addEventListener("input", render);

  input.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || (e.ctrlKey && e.key === "n") || (e.key === "Tab" && !e.shiftKey)) {
      e.preventDefault();
      select(active + 1);
    } else if (e.key === "ArrowUp" || (e.ctrlKey && e.key === "p") || (e.key === "Tab" && e.shiftKey)) {
      e.preventDefault();
      select(active - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(items[active], e.metaKey || e.ctrlKey);
    } else if (e.key === "Escape") {
      e.preventDefault();
      // first esc clears the query, the second closes (as in Spotlight)
      if (input.value) {
        input.value = "";
        render();
      } else {
        close();
      }
    }
  });

  list.addEventListener("mousemove", function (e) {
    var el = e.target.closest(".sl-row");
    if (el && +el.dataset.i !== active) select(+el.dataset.i, false);
  });

  list.addEventListener("click", function (e) {
    var el = e.target.closest(".sl-row");
    if (!el) return;
    e.preventDefault();
    go(items[+el.dataset.i], e.metaKey || e.ctrlKey);
  });

  preview.addEventListener("click", function (e) {
    var a = e.target.closest("a");
    if (!a || a.target === "_blank") return;
    e.preventDefault();
    go({ u: a.getAttribute("href") }, e.metaKey || e.ctrlKey);
  });

  root.addEventListener("click", function (e) {
    if (e.target.closest("[data-search-close]")) close();
  });

  document.addEventListener("click", function (e) {
    if (e.target.closest("[data-search-open]")) {
      e.preventDefault();
      open();
    }
  });

  // warm the index as soon as someone looks like they're about to search
  document.addEventListener(
    "pointerover",
    function (e) {
      if (e.target.closest && e.target.closest("[data-search-open]")) loadIndex();
    },
    { passive: true }
  );

  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (root.hidden) open();
      else close();
      return;
    }
    if (!root.hidden) return;
    var t = e.target;
    var typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
      e.preventDefault();
      open();
    }
  });

  Array.prototype.forEach.call(document.querySelectorAll(".search-shortcut"), function (el) {
    el.textContent = isMac ? "⌘K" : "Ctrl K";
  });
})();
