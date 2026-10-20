---
layout: template
title: "Persistent Segment Tree"
description: "Persistent Segment Tree in C++ and Python, from my competitive programming notebook."
permalink: /library/persistentsegmenttree/
slug: persistentsegmenttree
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using vi = vector<int>;
using vii = vector<vector<int>>;
using pii = pair<int, int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define FORD(i, a, b) for (int i = (a); i >= (b); i--)
#define RFOR(i, n) for (int i = (n) - 1; i >= 0; i--)

#define fi first
#define se second
#define pb push_back

const int INF = 1e9+7;
const int MOD = 1e9+7;

const int MAX_N = 2e5+5;

struct PersistentSparseST {
    struct Node {
        ll sum = 0;
        int left = 0, right = 0;
    };

    int N;
    vector<Node> tree;

    PersistentSparseST(int n) : N(n) {
        tree.reserve(MAX_N);
        tree.pb(Node());
    }

    int join(int l, int r) {
        tree.pb(Node{tree[l].sum + tree[r].sum, l, r});
        return tree.size()-1;
    }

    int update(int v, int tl, int tr, int pos, int val) {
        if (tl == tr) {
            tree.pb(Node{(ll)val, 0, 0});
            return tree.size()-1;
        }
        int tm = tl + (tr - tl) / 2;
        int lc = (v == 0) ? 0 : tree[v].left;
        int rc = (v == 0) ? 0 : tree[v].right;
        if (pos <= tm) return join(update(lc, tl, tm, pos, val), rc);
        else return join(lc, update(rc, tm+1, tr, pos, val));
    }

    ll query(int v, int tl, int tr, int ql, int qr) {
        if (v == 0 || ql > qr) return 0;
        if (ql == tl && tr == qr) return tree[v].sum;
        int tm = tl + (tr - tl) / 2;
        ll left = query(tree[v].left, tl, tm, ql, min(tm, qr));
        ll right = query(tree[v].right, tm+1, tr, max(tm+1, ql), qr);
        return left + right;
    }

    int update(int root, int pos, int val) {
        return update(root, 0, N-1, pos, val);
    }

    ll query(int root, int ql, int qr) {
        return query(root, 0, N-1, ql, qr);
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# Point set, range sum, and every old version stays readable.
# Nodes live in parallel lists; node 0 is the empty tree, so version 0 is root 0.


class PersistentSparseST:
    def __init__(self, n: int):
        self.N = n
        self.sum, self.left, self.right = [0], [0], [0]

    def _new(self, s, l: int, r: int) -> int:
        self.sum.append(s)
        self.left.append(l)
        self.right.append(r)
        return len(self.sum) - 1

    def join(self, l: int, r: int) -> int:
        return self._new(self.sum[l] + self.sum[r], l, r)

    # a new root where a[pos] = val; the old root is untouched
    def update(self, root: int, pos: int, val, tl: int = 0, tr: int = None) -> int:
        if tr is None: tr = self.N - 1
        if tl == tr: return self._new(val, 0, 0)
        tm = tl + (tr - tl) // 2
        lc, rc = self.left[root], self.right[root]
        if pos <= tm: return self.join(self.update(lc, pos, val, tl, tm), rc)
        return self.join(lc, self.update(rc, pos, val, tm + 1, tr))

    # sum of a[ql..qr] in the version rooted at root
    def query(self, root: int, ql: int, qr: int, tl: int = 0, tr: int = None):
        if tr is None: tr = self.N - 1
        if root == 0 or ql > qr: return 0
        if ql == tl and tr == qr: return self.sum[root]
        tm = tl + (tr - tl) // 2
        left = self.query(self.left[root], ql, min(tm, qr), tl, tm)
        right = self.query(self.right[root], max(tm + 1, ql), qr, tm + 1, tr)
        return left + right
```
{% endraw %}

</div>
