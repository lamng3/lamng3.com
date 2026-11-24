---
layout: template
title: "Link Cut Tree"
description: "Link Cut Tree in C++, from my competitive programming notebook."
permalink: /library/linkcuttree/
slug: linkcuttree
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

// nodes 1..n. link needs u and v in different trees, cut needs the edge u-v, query needs u and v connected
struct LinkCutTree {
    vector<array<int, 2>> ch;
    vector<int> par, rev;
    vector<long long> val, sum;

    LinkCutTree(int n) : ch(n + 1), par(n + 1), rev(n + 1), val(n + 1), sum(n + 1) {}

    bool isRoot(int x) { return ch[par[x]][0] != x && ch[par[x]][1] != x; }

    int dir(int x) { return ch[par[x]][1] == x; }

    void pull(int x) { sum[x] = sum[ch[x][0]] + sum[ch[x][1]] + val[x]; }

    void push(int x) {
        if (!rev[x]) return;
        swap(ch[x][0], ch[x][1]);
        for (int c : ch[x]) if (c) rev[c] ^= 1;
        rev[x] = 0;
    }

    void rotate(int x) {
        int p = par[x], g = par[p], d = dir(x), c = ch[x][d ^ 1];
        if (!isRoot(p)) ch[g][dir(p)] = x;
        par[x] = g;
        ch[p][d] = c;
        if (c) par[c] = p;
        ch[x][d ^ 1] = p;
        par[p] = x;
        pull(p);
        pull(x);
    }

    void splay(int x) {
        vector<int> path = {x};
        for (int y = x; !isRoot(y); y = par[y]) path.push_back(par[y]);
        reverse(path.begin(), path.end());
        for (int y : path) push(y);
        while (!isRoot(x)) {
            int p = par[x];
            if (!isRoot(p)) rotate(dir(x) == dir(p) ? p : x);
            rotate(x);
        }
    }

    // the path from the root to x becomes one splay tree, with x at its top and nothing below x
    void access(int x) {
        for (int last = 0, y = x; y; last = y, y = par[y]) {
            splay(y);
            ch[y][1] = last;
            pull(y);
        }
        splay(x);
    }

    void makeRoot(int x) {
        access(x);
        rev[x] ^= 1;
    }

    int findRoot(int x) {
        access(x);
        push(x);
        while (ch[x][0]) {
            x = ch[x][0];
            push(x);
        }
        splay(x);
        return x;
    }

    void link(int u, int v) {
        makeRoot(u);
        par[u] = v;
    }

    void cut(int u, int v) {
        makeRoot(u);
        access(v);
        ch[v][0] = par[u] = 0;
        pull(v);
    }

    bool connected(int u, int v) { return findRoot(u) == findRoot(v); }

    long long query(int u, int v) {
        makeRoot(u);
        access(v);
        return sum[v];
    }

    void assign(int x, long long v) {
        splay(x);
        val[x] = v;
        pull(x);
    }
};
```
{% endraw %}

</div>
