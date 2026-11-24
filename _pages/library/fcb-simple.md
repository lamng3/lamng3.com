---
layout: template
title: "FCB simple"
description: "FCB simple in C++, from my competitive programming notebook."
permalink: /library/fcb-simple/
slug: fcb-simple
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

/*
    LCA with an Euler tour + sparse table: O(n log n) build, O(1) per query
    the short version of FCB.h with the same interface and the same tour,
    but one sparse table over the whole tour instead of blocks and masks
    why it works: README.md, Part 1 (the tour) and Part 3 (the table)

    FCBSimple t(adj, root);    adj is 0-indexed and undirected
    t.lca(u, v);  t.dist(u, v);  t.depth(u);

    flatten is recursive: a path of 5e5 vertices needs `ulimit -s 65520` locally
*/
class FCBSimple {
public:
    FCBSimple(const vector<vector<int>>& adj, int root = 0) {
        precompute_lca(adj, root);
    }

    int lca(int v, int u) {
        int l = first_visit[v];
        int r = first_visit[u];
        if (l > r)
            swap(l, r);
        // two runs of 2^k entries that cover [l, r], they may overlap
        int k = log_2[r - l + 1];
        return euler_tour[min_by_h(st[k][l], st[k][r - (1 << k) + 1])];
    }

    int depth(int v) {
        return height[v];
    }

    int dist(int u, int v) {
        return height[u] + height[v] - 2 * height[lca(u, v)];
    }

private:
    vector<int> first_visit;
    vector<int> euler_tour;
    vector<int> height;
    vector<int> log_2;
    vector<vector<int>> st; // st[k][i] = tour index of the shallowest entry in [i, i + 2^k)

    // the same tour as FCB.h
    void flatten(const vector<vector<int>>& adj, int v, int p, int h) {
        first_visit[v] = euler_tour.size();
        euler_tour.push_back(v);
        height[v] = h;

        for (int u : adj[v]) {
            if (u == p)
                continue;
            flatten(adj, u, v, h + 1);
            euler_tour.push_back(v);
        }
    }

    int min_by_h(int i, int j) {
        return height[euler_tour[i]] < height[euler_tour[j]] ? i : j;
    }

    void precompute_lca(const vector<vector<int>>& adj, int root) {
        int n = adj.size();
        first_visit.assign(n, -1);
        height.assign(n, 0);
        euler_tour.clear();
        euler_tour.reserve(2 * n);
        flatten(adj, root, -1, 0);

        int m = euler_tour.size();
        log_2.assign(m + 1, -1);
        for (int i = 1; i <= m; i++)
            log_2[i] = log_2[i / 2] + 1;

        // st[0][i] = i, a run of one entry
        // st[k][i] = min of its two halves, [i, i + 2^(k-1)) and [i + 2^(k-1), i + 2^k)
        st.assign(log_2[m] + 1, {});
        st[0].resize(m);
        iota(st[0].begin(), st[0].end(), 0);
        for (int k = 1; k <= log_2[m]; k++) {
            st[k].resize(m - (1 << k) + 1);
            for (int i = 0; i + (1 << k) <= m; i++)
                st[k][i] = min_by_h(st[k - 1][i], st[k - 1][i + (1 << (k - 1))]);
        }
    }
};
```
{% endraw %}

</div>
