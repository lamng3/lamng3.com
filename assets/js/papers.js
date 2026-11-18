// Paper notes: filter the index by text and idea (?idea=… preselects one), and turn [[Name]] in a note into a link.
(function () {
  "use strict";

  var grid = document.getElementById("library-grid");
  if (grid) {
    var input = document.getElementById("library-filter");
    var empty = document.getElementById("library-empty");
    var cats = document.querySelectorAll(".library-cats [data-cat]");
    var cat = "";
    var apply = function () {
      var words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
      var shown = 0;
      Array.prototype.forEach.call(grid.children, function (card) {
        var ok =
          (!cat || card.dataset.cat.indexOf("|" + cat + "|") >= 0) &&
          words.every(function (w) {
            return card.dataset.text.indexOf(w) >= 0;
          });
        card.hidden = !ok;
        if (ok) shown++;
      });
      empty.hidden = shown > 0;
    };
    var pick = function (value) {
      cat = value;
      cats.forEach(function (b) {
        b.setAttribute("aria-pressed", String(b.dataset.cat === value));
      });
      apply();
    };
    input.addEventListener("input", apply);
    cats.forEach(function (btn) {
      btn.addEventListener("click", function () {
        pick(btn.dataset.cat);
        var url = new URL(location.href);
        if (cat) url.searchParams.set("idea", btn.textContent);
        else url.searchParams.delete("idea");
        history.replaceState(null, "", url);
      });
    });
    var wanted = (new URLSearchParams(location.search).get("idea") || "").toLowerCase();
    if (wanted) pick(wanted);
  }

  var note = document.querySelector(".paper-note");
  if (note) {
    var walker = document.createTreeWalker(note, NodeFilter.SHOW_TEXT);
    var hits = [];
    while (walker.nextNode()) {
      if (/\[\[[^\[\]\n]{1,80}\]\]/.test(walker.currentNode.nodeValue) && !walker.currentNode.parentNode.closest("code, pre, a"))
        hits.push(walker.currentNode);
    }
    hits.forEach(function (t) {
      var frag = document.createDocumentFragment();
      var rest = t.nodeValue;
      var re = /\[\[([^\[\]\n]{1,80})\]\]/g;
      var last = 0;
      var m;
      while ((m = re.exec(rest))) {
        frag.appendChild(document.createTextNode(rest.slice(last, m.index)));
        var name = m[1].trim();
        var slug = name
          .normalize("NFKD")
          .replace(/[̀-ͯ]/g, "")
          .toLowerCase()
          .replace(/đ/g, "d")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        var a = document.createElement("a");
        a.className = "wikilink";
        a.textContent = name;
        a.href = (note.dataset.papers || "").split(" ").indexOf(slug) >= 0 ? "/papers/" + slug + "/" : "/papers/?idea=" + encodeURIComponent(name);
        frag.appendChild(a);
        last = re.lastIndex;
      }
      frag.appendChild(document.createTextNode(rest.slice(last)));
      t.parentNode.replaceChild(frag, t);
    });
  }
})();
