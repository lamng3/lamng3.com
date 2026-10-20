---
layout: template
title: "Prefix Sum"
description: "Prefix Sum in Python, from my competitive programming notebook."
permalink: /library/prefixsum/
slug: prefixsum
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from itertools import accumulate


class PrefixSum:
    # P[i] = a[0] + ... + a[i-1]
    def __init__(self, a: list):
        self.P = list(accumulate(a, initial=0))

    # a[l] + ... + a[r], inclusive
    def query(self, l: int, r: int):
        return self.P[r + 1] - self.P[l]


class PrefixSum2D:
    # P[r][c] = sum of g[0..r-1][0..c-1]
    def __init__(self, g: list):
        n, m = len(g), len(g[0]) if g else 0
        self.P = [[0] * (m + 1) for _ in range(n + 1)] # never [[0] * (m+1)] * (n+1)
        for r in range(n):
            for c in range(m):
                self.P[r + 1][c + 1] = g[r][c] + self.P[r][c + 1] + self.P[r + 1][c] - self.P[r][c]

    # sum of g[r1..r2][c1..c2], inclusive
    def query(self, r1: int, c1: int, r2: int, c2: int):
        P = self.P
        return P[r2 + 1][c2 + 1] - P[r1][c2 + 1] - P[r2 + 1][c1] + P[r1][c1]
```
{% endraw %}

</div>
