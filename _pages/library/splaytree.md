---
layout: template
title: "Splay Tree"
description: "Splay Tree in C++, from my competitive programming notebook."
permalink: /library/splaytree/
slug: splaytree
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

struct SplayTree {
    vector<array<int, 2>> ch;
    vi par, cnt, rev;
    vector<ll> val, sum;
    int root;

    // a[i] sits at position i + 1, between two sentinels, so a[L - 1] and a[R + 1] always exist
    SplayTree(const vector<ll>& a = {}) {
        newNode(0);
        cnt[0] = 0;
        vector<ll> b = {0};
        for (ll x : a) b.pb(x);
        b.pb(0);
        root = build(b, 0, sz(b) - 1, 0);
    }

    int newNode(ll v) {
        ch.pb({0, 0}); par.pb(0); cnt.pb(1); rev.pb(0); val.pb(v); sum.pb(v);
        return sz(val) - 1;
    }

    int build(const vector<ll>& b, int L, int R, int p) {
        if (L > R) return 0;
        int m = (L + R) / 2, x = newNode(b[m]);
        par[x] = p;
        int l = build(b, L, m - 1, x), r = build(b, m + 1, R, x);
        ch[x] = {l, r};
        pull(x);
        return x;
    }

    void pull(int x) {
        auto [l, r] = ch[x];
        cnt[x] = cnt[l] + cnt[r] + 1;
        sum[x] = sum[l] + sum[r] + val[x];
    }

    void push(int x) {
        if (!rev[x]) return;
        swap(ch[x][0], ch[x][1]);
        for (int c : ch[x]) if (c) rev[c] ^= 1;
        rev[x] = 0;
    }

    int dir(int x) { return ch[par[x]][1] == x; }

    void rotate(int x) {
        int p = par[x], g = par[p], d = dir(x), c = ch[x][d ^ 1];
        if (g) ch[g][dir(p)] = x;
        par[x] = g;
        ch[p][d] = c;
        if (c) par[c] = p;
        ch[x][d ^ 1] = p;
        par[p] = x;
        pull(p);
        pull(x);
    }

    void splay(int x, int goal = 0) {
        while (par[x] != goal) {
            int p = par[x];
            if (par[p] != goal) rotate(dir(x) == dir(p) ? p : x);
            rotate(x);
        }
        if (!goal) root = x;
    }

    int kth(int k) {
        for (int x = root;;) {
            push(x);
            int l = cnt[ch[x][0]];
            if (k == l) return x;
            int d = k > l;
            if (d) k -= l + 1;
            x = ch[x][d];
        }
    }

    // splay a[L - 1] to the root and a[R + 1] below it: a[L..R] is then the left subtree of a[R + 1]
    int range(int L, int R) {
        splay(kth(L));
        splay(kth(R + 2), root);
        return ch[ch[root][1]][0];
    }

    ll query(int L, int R) { return sum[range(L, R)]; }

    void reverse(int L, int R) { rev[range(L, R)] ^= 1; }

    ll get(int i) { return val[range(i, i)]; }

    void assign(int i, ll v) {
        int x = range(i, i);
        val[x] = sum[x] = v;
        pull(par[x]);
        pull(root);
    }

    int cut(int L, int R) {
        int x = range(L, R), y = par[x];
        ch[y][0] = 0;
        par[x] = 0;
        pull(y);
        pull(root);
        return x;
    }

    void paste(int i, int x) {
        splay(kth(i));
        splay(kth(i + 1), root);
        int y = ch[root][1];
        ch[y][0] = x;
        par[x] = y;
        pull(y);
        pull(root);
    }

    void insert(int i, ll v) { paste(i, newNode(v)); }

    void erase(int i) { cut(i, i); }

    int size() { return cnt[root] - 2; }
};
```
{% endraw %}

</div>
