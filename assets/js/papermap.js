/* /papers/map/: papers and ideas as a force-directed graph. Published notes come from /papers/graph.json;
   when this browser is signed in at the desk, open drafts are added from their PR branches. */
(function () {
  "use strict";

  var P = window.PaperNotes;
  var svg = d3.select("#map-svg");
  var box = document.getElementById("paper-map");

  function graphFrom(papers) {
    var nodes = [];
    var links = [];
    var byId = {};
    function node(n) {
      if (!byId[n.id]) {
        byId[n.id] = n;
        nodes.push(n);
      }
      return byId[n.id];
    }
    papers.forEach(function (p) {
      node({ id: "p:" + p.slug, type: "paper", slug: p.slug, label: p.title, url: p.url, notes: p.notes || 0, draft: !!p.draft });
    });
    papers.forEach(function (p) {
      (p.ideas || []).forEach(function (idea) {
        var n = node({ id: "i:" + idea.toLowerCase(), type: "idea", label: idea, url: "/papers/?idea=" + encodeURIComponent(idea) });
        links.push({ source: "p:" + p.slug, target: n.id, kind: "idea" });
      });
      (p.related || []).forEach(function (r) {
        if (byId["p:" + r] && r !== p.slug) links.push({ source: "p:" + p.slug, target: "p:" + r, kind: "related" });
      });
    });
    return { nodes: nodes, links: links };
  }

  function drafts() {
    if (!P.getToken()) return Promise.resolve([]);
    return P.github
      .notePRs()
      .then(function (prs) {
        return Promise.all(
          prs.slice(0, 30).map(function (pr) {
            var slug = pr.head.ref.slice(P.CFG.prefix.length);
            return P.github.getFile(P.notePath(slug), pr.head.ref).then(function (f) {
              if (!f) return null;
              var n = P.parseNote(f.text);
              return {
                slug: slug,
                title: n.meta.title || slug,
                url: "/papers/desk/#/edit/" + slug,
                notes: n.stickies.length,
                ideas: n.meta.ideas,
                related: n.meta.related,
                draft: true,
              };
            });
          })
        );
      })
      .then(function (l) {
        return l.filter(Boolean);
      })
      .catch(function () {
        return [];
      });
  }

  function short(s, n) {
    return s.length > n ? s.slice(0, n - 1) + "…" : s;
  }

  function draw(data) {
    if (!data.nodes.length) {
      document.getElementById("map-empty").hidden = false;
      svg.attr("height", 0);
      return;
    }
    var width = box.clientWidth;
    var height = Math.max(420, Math.min(760, window.innerHeight * 0.7));
    svg
      .attr("viewBox", [-width / 2, -height / 2, width, height])
      .attr("width", width)
      .attr("height", height);

    var sim = d3
      .forceSimulation(data.nodes)
      .force(
        "link",
        d3
          .forceLink(data.links)
          .id(function (d) {
            return d.id;
          })
          .distance(function (l) {
            return l.kind === "related" ? 90 : 60;
          })
          .strength(function (l) {
            return l.kind === "related" ? 0.6 : 0.35;
          })
      )
      .force("charge", d3.forceManyBody().strength(-220))
      .force("x", d3.forceX().strength(0.04))
      .force("y", d3.forceY().strength(0.06))
      .force(
        "collide",
        d3.forceCollide().radius(function (d) {
          return d.type === "paper" ? 18 : 14;
        })
      );

    var root = svg.append("g");
    svg.call(
      d3
        .zoom()
        .scaleExtent([0.3, 4])
        .on("zoom", function (ev) {
          root.attr("transform", ev.transform);
        })
    );

    var link = root
      .append("g")
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("class", function (l) {
        return "map-link map-link--" + l.kind;
      });

    var node = root
      .append("g")
      .selectAll("g")
      .data(data.nodes)
      .join("g")
      .attr("class", function (d) {
        return "map-node map-" + d.type + (d.draft ? " is-draft" : "");
      })
      .attr("tabindex", 0)
      .attr("role", "link")
      .attr("aria-label", function (d) {
        return (d.type === "paper" ? "Paper: " : "Idea: ") + d.label;
      })
      .call(
        d3
          .drag()
          .on("start", function (ev, d) {
            if (!ev.active) sim.alphaTarget(0.2).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", function (ev, d) {
            d.fx = ev.x;
            d.fy = ev.y;
          })
          .on("end", function (ev, d) {
            if (!ev.active) sim.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    node
      .filter(function (d) {
        return d.type === "paper";
      })
      .append("circle")
      .attr("r", function (d) {
        return 6 + Math.min(8, Math.sqrt(d.notes));
      });
    node
      .append("text")
      .attr("dy", function (d) {
        return d.type === "paper" ? -12 : 4;
      })
      .attr("text-anchor", "middle")
      .text(function (d) {
        return short(d.label, d.type === "paper" ? 34 : 24);
      });
    node.append("title").text(function (d) {
      return d.label;
    });

    var neighbors = {};
    data.links.forEach(function (l) {
      (neighbors[l.source.id] = neighbors[l.source.id] || {})[l.target.id] = true;
      (neighbors[l.target.id] = neighbors[l.target.id] || {})[l.source.id] = true;
    });
    function focus(d) {
      var keep = d ? Object.assign({}, neighbors[d.id] || {}) : null;
      if (keep) keep[d.id] = true;
      node.classed("is-dim", function (n) {
        return keep && !keep[n.id];
      });
      node.classed("is-focus", function (n) {
        return d && n.id === d.id;
      });
      link.classed("is-dim", function (l) {
        return keep && !(l.source.id === d.id || l.target.id === d.id);
      });
    }
    var focused = null;
    function open(d) {
      if (d.type === "paper" || focused === d) location.href = d.url;
      else {
        focused = d;
        focus(d);
      }
    }
    node.on("click", function (ev, d) {
      ev.stopPropagation();
      open(d);
    });
    node.on("keydown", function (ev, d) {
      if (ev.key === "Enter") open(d);
    });
    node.on("mouseenter", function (ev, d) {
      if (!focused) focus(d);
    });
    node.on("mouseleave", function () {
      if (!focused) focus(null);
    });
    svg.on("click", function () {
      focused = null;
      focus(null);
    });

    sim.on("tick", function () {
      link
        .attr("x1", function (l) {
          return l.source.x;
        })
        .attr("y1", function (l) {
          return l.source.y;
        })
        .attr("x2", function (l) {
          return l.target.x;
        })
        .attr("y2", function (l) {
          return l.target.y;
        });
      node.attr("transform", function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
    });

    var start = decodeURIComponent(location.hash.slice(1));
    var hit =
      start &&
      data.nodes.find(function (n) {
        return n.slug === start;
      });
    if (hit) {
      focused = hit;
      focus(hit);
    }
  }

  Promise.all([
    fetch("/papers/graph.json", { cache: "no-store" })
      .then(function (r) {
        return r.json();
      })
      .catch(function () {
        return { papers: [] };
      }),
    drafts(),
  ]).then(function (r) {
    var published = r[0].papers || [];
    var seen = {};
    published.forEach(function (p) {
      seen[p.slug] = true;
    });
    var papers = published.concat(
      r[1].filter(function (d) {
        return !seen[d.slug];
      })
    );
    draw(graphFrom(papers));
  });
})();
