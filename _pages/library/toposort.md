---
layout: template
title: "Topological Sort"
description: "Topological Sort in Python, from my competitive programming notebook."
permalink: /library/toposort/
slug: toposort
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from collections import deque


# Kahn's algorithm on g[u] = list of v for edges u -> v; [] if there is a cycle
def topo_sort(g: list) -> list:
    n = len(g)
    indeg = [0] * n
    for u in range(n):
        for v in g[u]: indeg[v] += 1
    q = deque(u for u in range(n) if indeg[u] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in g[u]:
            indeg[v] -= 1
            if indeg[v] == 0: q.append(v)
    return order if len(order) == n else []
```
{% endraw %}

</div>
