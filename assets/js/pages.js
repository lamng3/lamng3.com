// Small behaviors for /projects/ (sort), /library/ (filter) and template pages (tabs, copy).
(function () {
  // Projects: the listed order, or sorted by date or by stars.
  var list = document.getElementById("project-list");
  if (list) {
    var buttons = document.querySelectorAll(".sortbar [data-sort]");
    var featured = Array.prototype.slice.call(list.children);
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.dataset.sort;
        buttons.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        var items = featured.slice();
        if (key !== "featured")
          items.sort(function (a, b) {
            if (key === "stars") {
              var d = Number(b.dataset.stars) - Number(a.dataset.stars);
              if (d) return d;
            }
            return b.dataset.date.localeCompare(a.dataset.date);
          });
        items.forEach(function (el) {
          list.appendChild(el);
        });
      });
    });
  }

  // Library: filter cards by text and category.
  var grid = document.getElementById("library-grid");
  if (grid) {
    var input = document.getElementById("library-filter");
    var empty = document.getElementById("library-empty");
    var cat = "";
    var cats = document.querySelectorAll(".library-cats [data-cat]");
    var apply = function () {
      var words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      Array.prototype.forEach.call(grid.children, function (card) {
        var ok =
          (!cat || card.dataset.cat === cat) &&
          words.every(function (w) {
            return card.dataset.text.indexOf(w) >= 0;
          });
        card.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
    };
    input.addEventListener("input", apply);
    cats.forEach(function (btn) {
      btn.addEventListener("click", function () {
        cat = btn.dataset.cat;
        cats.forEach(function (b) {
          b.setAttribute("aria-pressed", String(b === btn));
        });
        apply();
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "/" && document.activeElement !== input) {
        e.preventDefault();
        input.focus();
      }
    });
  }

  // Template pages: one tab per language, remembered across pages.
  var tabs = document.querySelectorAll('.tpl-tabs [role="tab"]');
  if (tabs.length) {
    var panes = document.querySelectorAll(".tpl-pane");
    var sources = document.querySelectorAll(".tpl-source");
    var show = function (lang) {
      var found = Array.prototype.some.call(tabs, function (t) {
        return t.dataset.lang === lang;
      });
      if (!found) lang = tabs[0].dataset.lang;
      tabs.forEach(function (t) {
        t.setAttribute("aria-selected", String(t.dataset.lang === lang));
      });
      panes.forEach(function (p) {
        p.hidden = p.dataset.lang !== lang;
      });
      sources.forEach(function (s) {
        s.hidden = s.dataset.lang !== lang;
      });
    };
    var saved = null;
    try {
      saved = localStorage.getItem("library-lang");
    } catch (e) {}
    show(saved || tabs[0].dataset.lang);
    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        show(t.dataset.lang);
        try {
          localStorage.setItem("library-lang", t.dataset.lang);
        } catch (e) {}
      });
    });
    var copy = document.querySelector(".tpl-copy");
    copy.addEventListener("click", function () {
      var pane = Array.prototype.find.call(panes, function (p) {
        return !p.hidden;
      });
      var code = pane && pane.querySelector("pre code, pre");
      if (!code || !navigator.clipboard) return;
      navigator.clipboard.writeText(code.innerText).then(function () {
        copy.textContent = "Copied";
        setTimeout(function () {
          copy.textContent = "Copy";
        }, 1500);
      });
    });
  }
})();
