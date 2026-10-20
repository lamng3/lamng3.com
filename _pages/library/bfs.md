---
layout: template
title: "Breadth-First Search"
description: "Breadth-First Search in Python, from my competitive programming notebook."
permalink: /library/bfs/
slug: bfs
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from collections import deque

dr = [1, -1, 0, 0]
dc = [0, 0, 1, -1]


# fewest edges from any source to every vertex, -1 if unreachable; g[u] = list of neighbors
def bfs(g: list, sources: list) -> list:
    dist = [-1] * len(g) # doubles as seen
    q = deque()
    for s in sources:
        dist[s] = 0
        q.append(s)
    while q:
        u = q.popleft()
        for v in g[u]:
            if dist[v] != -1: continue
            dist[v] = dist[u] + 1
            q.append(v)
    return dist


# the same on an n x m grid; ok(r, c) says a cell can be entered
def bfs_grid(n: int, m: int, sources: list, ok) -> list:
    def inrange(r: int, c: int):
        return 0 <= r and r < n and 0 <= c and c < m

    dist = [[-1] * m for _ in range(n)]
    q = deque()
    for r, c in sources:
        dist[r][c] = 0
        q.append((r, c))
    while q:
        r, c = q.popleft()
        for i in range(4):
            nr, nc = r + dr[i], c + dc[i]
            if not inrange(nr, nc) or dist[nr][nc] != -1 or not ok(nr, nc): continue
            dist[nr][nc] = dist[r][c] + 1
            q.append((nr, nc))
    return dist


# 0-1 BFS: g[u] = list of (v, w) with w in {0, 1}; a 0-edge goes to the front
def bfs01(g: list, s: int) -> list:
    dist = [float("inf")] * len(g)
    dist[s] = 0
    q = deque([s])
    while q:
        u = q.popleft()
        for v, w in g[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                if w == 0: q.appendleft(v)
                else: q.append(v)
    return dist
```
{% endraw %}

</div>
