---
layout: template
title: "Segment Tree"
description: "Segment Tree in C++ and Python, from my competitive programming notebook."
permalink: /library/segmenttree/
slug: segmenttree
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

template <typename T>
struct SegmentTree {
    int N;
    vector<T> A;
    vector<T> st;

    SegmentTree(int n, const vector<T>& a) {
        N = n;
        A = a;
        st.resize(4 * N);
    }

    virtual T combine(const T& left, const T& right) = 0;
    virtual T identity() = 0;

    void build(int v, int tl, int tr) {
        if (tl == tr) {
            st[v] = A[tl];
            return;
        }
        int tm = tl + (tr - tl) / 2;
        build(v*2+1, tl, tm);
        build(v*2+2, tm+1, tr);
        st[v] = combine(st[v*2+1], st[v*2+2]);
    }

    T query(int v, int tl, int tr, int ql, int qr) {
        if (ql > qr) return identity();
        if (ql <= tl && tr <= qr) return st[v];
        int tm = tl + (tr - tl) / 2;
        T left = query(v*2+1, tl, tm, ql, min(tm, qr));
        T right = query(v*2+2, tm+1, tr, max(ql, tm+1), qr);
        return combine(left, right);
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
class SegmentTree:
    # recursive, 0-indexed, with combine and identity passed in
    # (SegmentTree.h makes them virtual; here they are arguments)
    def __init__(self, a: list, combine=lambda x, y: x + y, identity=0):
        self.N = len(a)
        self.A = list(a)
        self.combine = combine
        self.identity = identity
        self.st = [identity] * (4 * max(self.N, 1))
        if self.N: self.build(0, 0, self.N - 1)

    def build(self, v: int, tl: int, tr: int) -> None:
        if tl == tr:
            self.st[v] = self.A[tl]
            return
        tm = tl + (tr - tl) // 2
        self.build(v * 2 + 1, tl, tm)
        self.build(v * 2 + 2, tm + 1, tr)
        self.st[v] = self.combine(self.st[v * 2 + 1], self.st[v * 2 + 2])

    # combine of a[ql..qr], inclusive
    def query(self, ql: int, qr: int, v: int = 0, tl: int = 0, tr: int = None):
        if tr is None: tr = self.N - 1
        if ql > qr: return self.identity
        if ql <= tl and tr <= qr: return self.st[v]
        tm = tl + (tr - tl) // 2
        left = self.query(ql, min(tm, qr), v * 2 + 1, tl, tm)
        right = self.query(max(ql, tm + 1), qr, v * 2 + 2, tm + 1, tr)
        return self.combine(left, right)

    # set a[pos] = x
    def update(self, pos: int, x, v: int = 0, tl: int = 0, tr: int = None) -> None:
        if tr is None: tr = self.N - 1
        if tl == tr:
            self.st[v] = x
            return
        tm = tl + (tr - tl) // 2
        if pos <= tm: self.update(pos, x, v * 2 + 1, tl, tm)
        else: self.update(pos, x, v * 2 + 2, tm + 1, tr)
        self.st[v] = self.combine(self.st[v * 2 + 1], self.st[v * 2 + 2])
```
{% endraw %}

</div>
