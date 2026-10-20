---
layout: template
title: "DSU with Rollback"
description: "DSU with Rollback in C++ and Python, from my competitive programming notebook."
permalink: /library/dsurollback/
slug: dsurollback
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

struct DSURollback {
    int n;
    vector<int> parent, sz, history;
    DSURollback(int _n) : n(_n) {
        sz.assign(n, 1);
        parent.resize(n);
        for (int i = 0; i < n; i++) parent[i] = i;
    }
    int find(int v) {
        if (v == parent[v]) return v;
        // no path compression
        return find(parent[v]);
    }
    bool unite(int a, int b) {
        a = find(a);
        b = find(b);
        if (a == b) return false;

        if (sz[a] < sz[b]) swap(a, b);
        
        parent[b] = a;
        sz[a] += sz[b];

        // remember who became child, extend to History struct as needed
        history.push_back(b); 
        return true;
    }
    void rollback() {
        if (history.empty()) return;

        int b = history.back();
        history.pop_back();

        int a = parent[b];

        sz[a] -= sz[b];
        parent[b] = b;
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
class DSURollback:
    def __init__(self, n: int) -> None:
        self.par = list(range(n))
        self.sz = [1] * n
        self.history = [] # who became a child, one entry per successful unite

    def find(self, v: int) -> int:
        while v != self.par[v]: # no path compression: it would make undo impossible
            v = self.par[v]
        return v

    def unite(self, a: int, b: int) -> bool:
        a, b = self.find(a), self.find(b)
        if a == b: return False
        if self.sz[a] < self.sz[b]: # union by size keeps find O(log n)
            a, b = b, a
        self.par[b] = a
        self.sz[a] += self.sz[b]
        self.history.append(b)
        return True

    # undo the last successful unite
    def rollback(self) -> None:
        if not self.history: return
        b = self.history.pop()
        a = self.par[b]
        self.sz[a] -= self.sz[b]
        self.par[b] = b
```
{% endraw %}

</div>
