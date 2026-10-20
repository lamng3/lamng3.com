---
layout: template
title: "Dijkstra's Algorithm"
description: "Dijkstra's Algorithm in Python, from my competitive programming notebook."
permalink: /library/dijkstra/
slug: dijkstra
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from heapq import heappop, heappush
from math import inf


# g[u] = list of (v, w) with w >= 0; returns dist and par (par[v] = previous vertex)
def dijkstra(g: list, s: int) -> tuple:
    dist, par = [inf] * len(g), [-1] * len(g)
    dist[s] = 0
    pq = [(0, s)]
    while pq:
        d, u = heappop(pq)
        if d > dist[u]: continue # stale entry: u was already settled shorter
        for v, w in g[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                par[v] = u
                heappush(pq, (dist[v], v))
    return dist, par


# s -> t along par, [] if t is unreachable
def path(par: list, s: int, t: int) -> list:
    if t != s and par[t] == -1: return []
    p = [t]
    while p[-1] != s: p.append(par[p[-1]])
    return p[::-1]
```
{% endraw %}

</div>
