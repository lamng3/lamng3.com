---
layout: template
title: "Euler Tour"
description: "Euler Tour in C++ and Python, from my competitive programming notebook."
permalink: /library/eulertour/
slug: eulertour
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

struct EulerTour {
public:
    vector<vector<int>> g;
    vector<int> S, E;
    vector<int> sz;
    int timer;

    EulerTour(int n, const vector<vector<int>>& _g, const vector<int>& _values) {
        g = _g;
        S.resize(n);
        E.resize(n);
        sz.resize(n);
        timer = 0;
    }

    void dfs(int u, int p) {
        S[u] = timer++;
        for (int v : g[u]) {
            if (v != p) {
                dfs(v, u);
            }
        }
        E[u] = timer;
        sz[S[u]] = E[u] - S[u];
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# Entry and exit times: the subtree of u is exactly the times [S[u], E[u]).
# So a subtree query is a range query over the tour.


class EulerTour:
    def __init__(self, n: int, g: list, root: int = 0):
        self.g = g
        self.S, self.E = [0] * n, [0] * n
        self.sz = [0] * n # sz[S[u]] = size of u's subtree, indexed by time as in EulerTour.h
        self.order = []   # order[t] = vertex entered at time t
        self.timer = 0
        self.dfs(root)

    # an explicit stack: (u, parent, next neighbor index)
    def dfs(self, root: int) -> None:
        st = [(root, -1, 0)]
        self.S[root] = self.timer
        self.order.append(root)
        self.timer += 1
        while st:
            u, p, i = st.pop()
            if i < len(self.g[u]):
                st.append((u, p, i + 1))
                v = self.g[u][i]
                if v == p: continue
                self.S[v] = self.timer
                self.order.append(v)
                self.timer += 1
                st.append((v, u, 0))
            else:
                self.E[u] = self.timer
                self.sz[self.S[u]] = self.E[u] - self.S[u]
```
{% endraw %}

</div>
