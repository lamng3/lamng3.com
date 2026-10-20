---
layout: template
title: "Fenwick Tree"
description: "Fenwick Tree in C++ and Python, from my competitive programming notebook."
permalink: /library/fenwicktree/
slug: fenwicktree
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

template <typename T>
struct FenwickTree {
    int n;
    vector<T> ft;
    FenwickTree(int _n) : n(_n), ft(_n + 1, 0) {}
    FenwickTree(const vector<T>& a) {
        init(a);
    }
    void init(const vector<T>& a) {
        n = a.size();
        ft.assign(n+1, 0);
        for (int i = 1; i <= n; i++) add(i, a[i-1]);
    }
    void add(int i, T u) {
        for (; i <= n; i += i & -i) ft[i] += u;
    }
    T sum(int i) {
        T s = 0;
        for (; i > 0; i -= i & -i) s += ft[i];
        return s;
    }
    T sum(int L, int R) {
        if (L > R) return 0;
        return sum(R) - sum(L-1);
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
class FenwickTree:
    # 1-indexed, as in FenwickTree.h: add(i, u) and sum(i) take i in [1, n]
    def __init__(self, n_or_a):
        if isinstance(n_or_a, int):
            self.n = n_or_a
            self.ft = [0] * (self.n + 1)
        else:
            self.init(n_or_a)

    # build from a list in O(n): push each node's total into its parent
    def init(self, a: list) -> None:
        self.n = len(a)
        self.ft = [0] + list(a)
        for i in range(1, self.n + 1):
            j = i + (i & -i)
            if j <= self.n: self.ft[j] += self.ft[i]

    def add(self, i: int, u) -> None:
        while i <= self.n:
            self.ft[i] += u
            i += i & -i

    # sum(i) = a[1] + ... + a[i]; sum(L, R) = a[L] + ... + a[R]
    def sum(self, L: int, R: int = None):
        if R is not None:
            return self.sum(R) - self.sum(L - 1) if L <= R else 0
        s, i = 0, L
        while i > 0:
            s += self.ft[i]
            i -= i & -i
        return s
```
{% endraw %}

</div>
