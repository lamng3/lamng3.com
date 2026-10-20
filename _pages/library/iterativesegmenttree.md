---
layout: template
title: "Iterative Segment Tree"
description: "Iterative Segment Tree in C++ and Python, from my competitive programming notebook."
permalink: /library/iterativesegmenttree/
slug: iterativesegmenttree
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

const int N = 1e5+5;
int tree[2 * N];

template <typename T>
struct IterativeSegmentTree {
    int n;
    
    // build the tree in O(n)
    void build() {
        for (int i = n-1; i > 0; i--) {
            tree[i] = tree[i << 1] + tree[i << 1 | 1];
        }
    }

    // point update in O(log n): set A[p] = value
    void update(int p, int v) {
        // set value at the leaf, then walk up the tree
        for (tree[p += n] = v; p > 1; p >>= 1) {
            // tree[p ^ 1] safely gets the sibling of p
            tree[p >> 1] = tree[p] + tree[p ^ 1];
        }
    }

    int query(int l, int r) {
        int res = 0;
        // walk up the tree from both ends
        for (l += n, r += n; l < r; l >>= 1, r >>= 1) {
            // if l is a right child, include it and move right
            if (l & 1) res += tree[l++];
            // if r is a right child, include its left sibling
            if (r & 1) res += tree[--r];
        }
        return res;
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
class IterativeSegmentTree:
    # sums over a, 0-indexed; leaves live at tree[n..2n)
    def __init__(self, a: list):
        self.n = len(a)
        self.tree = [0] * self.n + list(a)
        self.build()

    # build the tree in O(n)
    def build(self) -> None:
        for i in range(self.n - 1, 0, -1):
            self.tree[i] = self.tree[i << 1] + self.tree[i << 1 | 1]

    # point update in O(log n): set a[p] = v
    def update(self, p: int, v) -> None:
        p += self.n
        self.tree[p] = v
        while p > 1:
            # p ^ 1 is the sibling of p
            self.tree[p >> 1] = self.tree[p] + self.tree[p ^ 1]
            p >>= 1

    # sum of a[l..r), half-open
    def query(self, l: int, r: int):
        res = 0
        l += self.n
        r += self.n
        while l < r:
            if l & 1: # l is a right child: take it and move right
                res += self.tree[l]
                l += 1
            if r & 1: # r is a right child: take its left sibling
                r -= 1
                res += self.tree[r]
            l >>= 1
            r >>= 1
        return res
```
{% endraw %}

</div>
