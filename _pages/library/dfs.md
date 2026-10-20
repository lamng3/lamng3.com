---
layout: template
title: "Depth-First Search"
description: "Depth-First Search in Python, from my competitive programming notebook."
permalink: /library/dfs/
slug: dfs
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# Explicit stacks: Python's recursion limit is 1000, and a path graph is 10^5 deep.

dr = [1, -1, 0, 0]
dc = [0, 0, 1, -1]


# comp[u] = component id in 0..k-1; returns comp, k
def components(g: list) -> tuple:
    n = len(g)
    comp = [-1] * n
    k = 0
    for s in range(n):
        if comp[s] != -1: continue
        comp[s] = k
        st = [s]
        while st:
            u = st.pop()
            for v in g[u]:
                if comp[v] != -1: continue
                comp[v] = k
                st.append(v)
        k += 1
    return comp, k


# every cell reachable from (sr, sc) through cells with ok(r, c); marks them in seen
def flood_fill(n: int, m: int, sr: int, sc: int, ok, seen: set) -> list:
    def inrange(r: int, c: int):
        return 0 <= r and r < n and 0 <= c and c < m

    cells = [(sr, sc)]
    seen.add((sr, sc))
    st = [(sr, sc)]
    while st:
        r, c = st.pop()
        for i in range(4):
            nr, nc = r + dr[i], c + dc[i]
            if not inrange(nr, nc) or (nr, nc) in seen or not ok(nr, nc): continue
            seen.add((nr, nc))
            cells.append((nr, nc))
            st.append((nr, nc))
    return cells


# rooted tree: parent, depth, subtree size, and an order where parents come first
def tree_dfs(g: list, root: int = 0) -> tuple:
    n = len(g)
    par, depth, sz = [-1] * n, [0] * n, [1] * n
    order = [root]
    for u in order: # order grows while it is read: a BFS order, parents first
        for v in g[u]:
            if v == par[u]: continue
            par[v] = u
            depth[v] = depth[u] + 1
            order.append(v)
    for u in reversed(order): # children before parents
        if par[u] != -1: sz[par[u]] += sz[u]
    return par, depth, sz, order
```
{% endraw %}

</div>
