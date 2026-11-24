---
layout: template
title: "FCB"
description: "FCB in C++, from my competitive programming notebook."
permalink: /library/fcb/
slug: fcb
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

/*
    LCA with Farach-Colton and Bender: O(n) build, O(1) per query
    follows https://cp-algorithms.com/graph/lca_farachcoltonbender.html
    why it works: README.md next to this file

    FCB fcb(adj, root);    adj is 0-indexed and undirected
    fcb.lca(u, v);  fcb.dist(u, v);  fcb.depth(u);

    flatten is recursive: a path of 5e5 vertices needs `ulimit -s 65520` locally
*/
class FCB {
public:
    FCB(const vector<vector<int>>& _adj, int root = 0) : n(_adj.size()), adj(_adj) {
        precompute_lca(root);
    }

    int lca(int v, int u) {
        int l = first_visit[v];
        int r = first_visit[u];
        if (l > r)
            swap(l, r);
        int bl = l / block_size;
        int br = r / block_size;
        // both ends in one block
        if (bl == br)
            return euler_tour[lca_in_block(bl, l % block_size, r % block_size)];
        // suffix of l's block, prefix of r's block
        int suffix = lca_in_block(bl, l % block_size, block_size - 1);
        int prefix = lca_in_block(br, 0, r % block_size);
        int ans = min_by_h(suffix, prefix);
        // whole blocks in between
        if (bl + 1 < br) ans = min_by_h(ans, query_sparse_table(bl + 1, br - 1));
        return euler_tour[ans];
    }

    int depth(int v) {
        return height[v];
    }

    int dist(int u, int v) {
        return height[u] + height[v] - 2 * height[lca(u, v)];
    }

private:
    int n;
    vector<vector<int>> adj;

    int block_size, block_cnt;
    vector<int> first_visit;
    vector<int> euler_tour;
    vector<int> height;
    vector<int> log_2;
    vector<vector<int>> st;
    vector<vector<vector<int>>> blocks;
    vector<int> block_mask;

    void flatten(int v, int p, int h) {
        first_visit[v] = euler_tour.size();
        euler_tour.push_back(v);
        height[v] = h;

        for (int u : adj[v]) {
            if (u == p)
                continue;
            flatten(u, v, h + 1);
            euler_tour.push_back(v);
        }
    }

    int min_by_h(int i, int j) {
        return height[euler_tour[i]] < height[euler_tour[j]] ? i : j;
    }

    // precompute all log values
    void precompute_log(int m) {
        log_2.assign(m + 1, -1);
        for (int i = 1; i <= m; i++)
            log_2[i] = log_2[i / 2] + 1;
    }

    // precompute minimum of each block and build sparse table
    // st[b][j] = index of the min over blocks [b, b + 2^j)
    void precompute_sparse_table(int m) {
        st.assign(block_cnt, vector<int>(log_2[block_cnt] + 1));

        // st[b][0] = min of block b: the first entry starts it, later entries replace it if shallower
        for (int i = 0; i < m; i++) {
            int b = i / block_size, j = i % block_size;
            if (j == 0) st[b][0] = i;
            else st[b][0] = min_by_h(st[b][0], i);
        }

        // st[b][j] = min of its two halves, blocks [b, b + 2^(j-1)) and [b + 2^(j-1), b + 2^j)
        for (int j = 1; j <= log_2[block_cnt]; j++) {
            for (int b = 0; b < block_cnt; b++) {
                if (b + (1 << j) > block_cnt) continue; // run passes the last block, never queried
                st[b][j] = min_by_h(st[b][j-1], st[b + (1 << (j-1))][j-1]);
            }
        }
    }

    // min over blocks [L, R], two runs of 2^k blocks that may overlap
    int query_sparse_table(int L, int R) {
        int k = log_2[R - L + 1];
        return min_by_h(st[L][k], st[R - (1 << k) + 1][k]);
    }

    // precompute mask for each block
    void precompute_block_mask(int m) {
        block_mask.assign(block_cnt, 0);
        for (int i = 0; i < m; i++) {
            int b = i / block_size, j = i % block_size;
            // bit j-1 = 1 if the tour goes one level deeper from offset j-1 to j
            if (j > 0 && height[euler_tour[i]] > height[euler_tour[i - 1]]) block_mask[b] |= 1 << (j - 1);
        }
    }

    // precompute RMQ for each unique block
    void precompute_blocks(int m) {
        int FULL = 1 << (block_size - 1); // number of masks
        blocks.assign(FULL, {});
        for (int b = 0; b < block_cnt; b++) {
            int mask = block_mask[b];
            if (!blocks[mask].empty())
                continue;
            blocks[mask].assign(block_size, vector<int>(block_size));
            for (int l = 0; l < block_size; l++) {
                blocks[mask][l][l] = l;
                for (int r = l + 1; r < block_size; r++) {
                    blocks[mask][l][r] = blocks[mask][l][r - 1];
                    if (b * block_size + r < m)
                        blocks[mask][l][r] = min_by_h(b * block_size + blocks[mask][l][r],
                                b * block_size + r) - b * block_size;
                }
            }
        }
    }

    void precompute_lca(int root) {
        // get euler tour & indices of first occurrences
        first_visit.assign(n, -1);
        height.assign(n, 0);
        euler_tour.clear();
        euler_tour.reserve(2 * n);
        flatten(root, -1, 0);

        int m = euler_tour.size();
        precompute_log(m);
        block_size = max(1, log_2[m] / 2);
        block_cnt = (m + block_size - 1) / block_size;

        precompute_sparse_table(m);
        precompute_block_mask(m);
        precompute_blocks(m);
    }

    int lca_in_block(int b, int l, int r) {
        return blocks[block_mask[b]][l][r] + b * block_size;
    }
};
```
{% endraw %}

</div>
