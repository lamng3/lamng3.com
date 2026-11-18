/* Paper notes: the note format, the GitHub client, and the merge used by the desk and the map.
   A note is _papers/<slug>.md. Its front matter holds the paper's details and the sticky notes;
   the body is the write-up. A draft lives on the branch paper-notes/<slug> with an open PR;
   merging the PR publishes it. Works in the browser (window.PaperNotes) and in Node (tests). */
(function (root) {
  "use strict";

  var yaml = root.jsyaml || (typeof require === "function" ? require("js-yaml") : null);

  var CFG = {
    owner: "lamng3",
    repo: "lamng3.com",
    base: "main",
    prefix: "paper-notes/",
    dir: "_papers",
    site: "https://lamng3.com",
  };
  var API = "https://api.github.com";
  // Local testing only: point the desk at a mock GitHub (see CLAUDE.md). Ignored on lamng3.com.
  try {
    if (/^(localhost|127\.0\.0\.1)$/.test(root.location.hostname) && root.localStorage.getItem("papernotes.api"))
      API = root.localStorage.getItem("papernotes.api");
  } catch (e) {}
  var KINDS = ["idea", "question", "quote", "critique", "todo"];
  var META_ORDER = ["title", "description", "authors", "year", "venue", "link", "status", "started", "updated", "ideas", "related"];

  /* ---------- storage: every call may throw (private windows, blocked storage) ---------- */

  var store = {
    get: function (k) {
      try {
        var v = root.localStorage.getItem(k);
        return v == null ? null : JSON.parse(v);
      } catch (e) {
        return null;
      }
    },
    set: function (k, v) {
      try {
        root.localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch (e) {
        return false;
      }
    },
    del: function (k) {
      try {
        root.localStorage.removeItem(k);
      } catch (e) {}
    },
    keys: function (prefix) {
      var out = [];
      try {
        for (var i = 0; i < root.localStorage.length; i++) {
          var k = root.localStorage.key(i);
          if (k && k.indexOf(prefix) === 0) out.push(k);
        }
      } catch (e) {}
      return out;
    },
  };

  var TOKEN_KEY = "papernotes.token";
  var DRAFT_PREFIX = "papernotes.draft.";

  function getToken() {
    return store.get(TOKEN_KEY);
  }
  function setToken(t) {
    if (t) store.set(TOKEN_KEY, t);
    else store.del(TOKEN_KEY);
  }

  /* ---------- small helpers ---------- */

  function today() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function nowStamp() {
    var d = new Date();
    return today() + "T" + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  }
  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function slugify(s) {
    return String(s || "")
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60)
      .replace(/-+$/g, "");
  }

  function b64encode(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = "";
    for (var i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }
  function b64decode(b64) {
    var bin = atob(String(b64).replace(/\s/g, ""));
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function uniqCI(list) {
    var seen = {};
    var out = [];
    (list || []).forEach(function (x) {
      x = String(x == null ? "" : x).trim();
      var k = x.toLowerCase();
      if (x && !seen[k]) {
        seen[k] = true;
        out.push(x);
      }
    });
    return out;
  }

  /* [[name]] inside sticky notes and the write-up */
  function wikilinks(text) {
    var out = [];
    String(text || "").replace(/\[\[([^\[\]\n]{1,80})\]\]/g, function (_, name) {
      out.push(name.trim());
    });
    return out;
  }

  /* ---------- the note format ---------- */

  function emptyNote(title, link) {
    return {
      meta: {
        title: title || "",
        authors: "",
        year: null,
        venue: "",
        link: link || "",
        status: "reading",
        started: today(),
        updated: today(),
        ideas: [],
        related: [],
      },
      stickies: [],
      body: "",
    };
  }

  function normValue(v) {
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return v;
  }

  function normSticky(s) {
    if (typeof s === "string") s = { text: s };
    s = s || {};
    var out = { text: String(s.text == null ? "" : s.text) };
    out.kind = KINDS.indexOf(s.kind) >= 0 ? s.kind : "idea";
    if (s.where != null && String(s.where).trim()) out.where = String(s.where).trim();
    out.at = s.at instanceof Date ? s.at.toISOString().slice(0, 19) : String(s.at || "");
    return out;
  }

  function parseNote(text) {
    text = String(text || "").replace(/\r\n/g, "\n");
    var m = /^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)([\s\S]*)$/.exec(text);
    var fm = {};
    var body = text;
    if (m) {
      fm = yaml.load(m[1]) || {};
      body = m[2];
    }
    var meta = {};
    Object.keys(fm).forEach(function (k) {
      if (k !== "stickies") meta[k] = normValue(fm[k]);
    });
    meta.ideas = uniqCI(meta.ideas);
    meta.related = uniqCI(meta.related);
    return {
      meta: meta,
      stickies: (fm.stickies || []).map(normSticky),
      body: body.replace(/^\n+/, "").replace(/\s+$/, ""),
    };
  }

  function serializeNote(note) {
    var meta = note.meta || {};
    var fm = {};
    META_ORDER.forEach(function (k) {
      var v = meta[k];
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v) && !v.length && k !== "ideas" && k !== "related") return;
      fm[k] = v;
    });
    Object.keys(meta).forEach(function (k) {
      if (!(k in fm) && META_ORDER.indexOf(k) < 0 && meta[k] !== undefined && meta[k] !== null && meta[k] !== "") fm[k] = meta[k];
    });
    fm.stickies = (note.stickies || []).map(function (s) {
      var o = { text: s.text, kind: s.kind };
      if (s.where) o.where = s.where;
      o.at = s.at;
      return o;
    });
    var head = yaml.dump(fm, { lineWidth: -1, noRefs: true, quotingType: '"' });
    var body = String(note.body || "").replace(/\s+$/, "");
    return "---\n" + head + "---\n" + (body ? "\n" + body + "\n" : "");
  }

  /* Pull [[links]] from the stickies and the write-up into related (known papers) or ideas. */
  function absorbLinks(note, knownSlugs) {
    var known = {};
    (knownSlugs || []).forEach(function (s) {
      known[s] = true;
    });
    var names = [];
    note.stickies.forEach(function (s) {
      names = names.concat(wikilinks(s.text));
    });
    names = names.concat(wikilinks(note.body));
    var self = slugify(note.meta.title);
    names.forEach(function (n) {
      var slug = slugify(n);
      if (known[slug] || known[n]) {
        if (slug !== self) note.meta.related = uniqCI(note.meta.related.concat([known[n] ? n : slug]));
      } else {
        note.meta.ideas = uniqCI(note.meta.ideas.concat([n]));
      }
    });
    return note;
  }

  /* ---------- three-way merge: base = last version both sides saw ---------- */

  function stickyKey(s) {
    return s.at + "|" + s.text;
  }

  function mergeNotes(base, mine, theirs) {
    var conflicts = [];
    var meta = {};
    var keys = {};
    [base.meta, mine.meta, theirs.meta].forEach(function (m) {
      Object.keys(m).forEach(function (k) {
        keys[k] = true;
      });
    });
    Object.keys(keys).forEach(function (k) {
      var b = JSON.stringify(base.meta[k]);
      var m = JSON.stringify(mine.meta[k]);
      var t = JSON.stringify(theirs.meta[k]);
      var v;
      if (m === b) v = theirs.meta[k];
      else if (t === b || t === m) v = mine.meta[k];
      else if (Array.isArray(mine.meta[k]) && Array.isArray(theirs.meta[k])) v = uniqCI(theirs.meta[k].concat(mine.meta[k]));
      else {
        v = mine.meta[k];
        if (k !== "updated") conflicts.push(k);
      }
      if (v !== undefined) meta[k] = v;
    });

    var baseK = {};
    var mineK = {};
    var theirsK = {};
    base.stickies.forEach(function (s) {
      baseK[stickyKey(s)] = true;
    });
    mine.stickies.forEach(function (s) {
      mineK[stickyKey(s)] = true;
    });
    theirs.stickies.forEach(function (s) {
      theirsK[stickyKey(s)] = true;
    });
    var stickies = theirs.stickies
      .filter(function (s) {
        var k = stickyKey(s);
        return !(baseK[k] && !mineK[k]);
      })
      .concat(
        mine.stickies.filter(function (s) {
          var k = stickyKey(s);
          return !baseK[k] && !theirsK[k];
        })
      );
    stickies.sort(function (a, b) {
      return a.at < b.at ? -1 : a.at > b.at ? 1 : 0;
    });

    var body;
    var theirBody = null;
    if (mine.body === base.body) body = theirs.body;
    else if (theirs.body === base.body || theirs.body === mine.body) body = mine.body;
    else {
      body = mine.body;
      theirBody = theirs.body;
      conflicts.push("body");
    }
    return { note: { meta: meta, stickies: stickies, body: body }, conflicts: conflicts, theirBody: theirBody };
  }

  /* ---------- GitHub ---------- */

  function GitHubError(status, message, data) {
    this.name = "GitHubError";
    this.status = status;
    this.message = message;
    this.data = data;
  }
  GitHubError.prototype = Object.create(Error.prototype);

  function gh(method, path, body, opts) {
    var token = getToken();
    var headers = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
    if (token) headers.Authorization = "Bearer " + token;
    if (body) headers["Content-Type"] = "application/json";
    return fetch(API + path, {
      method: method,
      headers: headers,
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      keepalive: !!(opts && opts.keepalive),
    }).then(function (res) {
      if (res.status === 204) return null;
      return res
        .json()
        .catch(function () {
          return null;
        })
        .then(function (data) {
          if (!res.ok) throw new GitHubError(res.status, (data && data.message) || res.statusText, data);
          return data;
        });
    });
  }

  function repoPath(rest) {
    return "/repos/" + CFG.owner + "/" + CFG.repo + rest;
  }
  function notePath(slug) {
    return CFG.dir + "/" + slug + ".md";
  }
  function branchOf(slug) {
    return CFG.prefix + slug;
  }
  function encPath(p) {
    return p.split("/").map(encodeURIComponent).join("/");
  }
  function orNull(e) {
    if (e && e.status === 404) return null;
    throw e;
  }

  var github = {
    /* Who is signed in, and can they push here? */
    whoami: function () {
      return Promise.all([gh("GET", "/user"), gh("GET", repoPath(""))]).then(function (r) {
        return { login: r[0].login, canPush: !!(r[1].permissions && r[1].permissions.push) };
      });
    },
    branchSha: function (branch) {
      return gh("GET", repoPath("/git/ref/heads/" + encPath(branch)))
        .then(function (r) {
          return r.object.sha;
        })
        .catch(orNull);
    },
    createBranch: function (branch, sha) {
      return gh("POST", repoPath("/git/refs"), { ref: "refs/heads/" + branch, sha: sha });
    },
    deleteBranch: function (branch) {
      return gh("DELETE", repoPath("/git/refs/heads/" + encPath(branch))).catch(function (e) {
        if (e.status === 404 || e.status === 422) return null;
        throw e;
      });
    },
    getFile: function (path, ref) {
      return gh("GET", repoPath("/contents/" + encPath(path) + "?ref=" + encodeURIComponent(ref)))
        .then(function (r) {
          return { text: b64decode(r.content), sha: r.sha };
        })
        .catch(orNull);
    },
    putFile: function (path, text, message, branch, sha, opts) {
      var body = { message: message, content: b64encode(text), branch: branch };
      if (sha) body.sha = sha;
      return gh("PUT", repoPath("/contents/" + encPath(path)), body, opts).then(function (r) {
        return { sha: r.content.sha, commit: r.commit.sha };
      });
    },
    listDir: function (path, ref) {
      return gh("GET", repoPath("/contents/" + encPath(path) + "?ref=" + encodeURIComponent(ref)))
        .then(function (r) {
          return Array.isArray(r) ? r : [];
        })
        .catch(function (e) {
          if (e.status === 404) return [];
          throw e;
        });
    },
    /* Open PRs from this repo's paper-notes/ branches. PRs from forks are never listed. */
    notePRs: function () {
      return gh("GET", repoPath("/pulls?state=open&base=" + CFG.base + "&per_page=100")).then(function (list) {
        return list.filter(function (p) {
          return p.head && p.head.ref.indexOf(CFG.prefix) === 0 && p.head.repo && p.head.repo.full_name === CFG.owner + "/" + CFG.repo;
        });
      });
    },
    findPR: function (branch) {
      return gh("GET", repoPath("/pulls?state=open&head=" + encodeURIComponent(CFG.owner + ":" + branch))).then(function (l) {
        return l[0] || null;
      });
    },
    createPR: function (branch, title, body) {
      return gh("POST", repoPath("/pulls"), { title: title, head: branch, base: CFG.base, body: body });
    },
    getPR: function (n) {
      return gh("GET", repoPath("/pulls/" + n));
    },
    mergePR: function (n, title) {
      return gh("PUT", repoPath("/pulls/" + n + "/merge"), { merge_method: "squash", commit_title: title });
    },
    closePR: function (n) {
      return gh("PATCH", repoPath("/pulls/" + n), { state: "closed" });
    },
    comment: function (n, text) {
      return gh("POST", repoPath("/issues/" + n + "/comments"), { body: text });
    },
  };

  /* ---------- drafts kept in this browser ---------- */

  var drafts = {
    get: function (slug) {
      return store.get(DRAFT_PREFIX + slug);
    },
    put: function (d) {
      d.savedAt = Date.now();
      return store.set(DRAFT_PREFIX + d.slug, d);
    },
    del: function (slug) {
      store.del(DRAFT_PREFIX + slug);
    },
    all: function () {
      return store
        .keys(DRAFT_PREFIX)
        .map(function (k) {
          return store.get(k);
        })
        .filter(Boolean);
    },
  };

  var api = {
    CFG: CFG,
    KINDS: KINDS,
    store: store,
    getToken: getToken,
    setToken: setToken,
    today: today,
    nowStamp: nowStamp,
    slugify: slugify,
    b64encode: b64encode,
    b64decode: b64decode,
    uniqCI: uniqCI,
    wikilinks: wikilinks,
    emptyNote: emptyNote,
    parseNote: parseNote,
    serializeNote: serializeNote,
    absorbLinks: absorbLinks,
    mergeNotes: mergeNotes,
    github: github,
    drafts: drafts,
    notePath: notePath,
    branchOf: branchOf,
    GitHubError: GitHubError,
  };

  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PaperNotes = api;
})(typeof window !== "undefined" ? window : globalThis);
