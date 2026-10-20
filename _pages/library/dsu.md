---
layout: template
title: "Disjoint Set Union"
description: "Disjoint Set Union in C++ and Python, from my competitive programming notebook."
permalink: /library/dsu/
slug: dsu
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

struct DSU {
    int n;
    vector<int> parent, sz;
    DSU(int _n) : n(_n) {
        sz.assign(n, 1);
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int v) {
        if (v == parent[v]) return v;
        // path compression
        return parent[v] = find(parent[v]);
    }
    void unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return;
        if (sz[a] < sz[b]) swap(a, b);
        parent[b] = a;
        sz[a] += sz[b];
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
class DSU:
    def __init__(self, n: int) -> None:
        self.par = list(range(n))
        self.sz = [1] * n

    def find(self, v: int) -> int:
        if v != self.par[v]:
            self.par[v] = self.find(self.par[v])
        return self.par[v]

    def unite(self, a: int, b: int) -> bool:
        a, b = self.find(a), self.find(b)
        if a == b: return False
        if self.sz[a] < self.sz[b]: # swap
            a, b = b, a
        self.par[b] = a
        self.sz[a] += self.sz[b]
        return True
```
{% endraw %}

</div>
