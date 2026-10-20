---
layout: template
title: "Mo's Algorithm"
description: "Mo's Algorithm in C++ and Python, from my competitive programming notebook."
permalink: /library/mo/
slug: mo
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
/*
Mo's Algorithm
*/
#pragma once
#include <bits/stdc++.h>
using namespace std;

template <typename T>
struct Mo {
    struct Query {
        int L, R, id;
    };

    int BLOCK_SIZE;
    vector<T> A;
    vector<Query> Q;

    Mo(const vector<T>& a, int n_queries) {
        A = a;
        int n = A.size();
        BLOCK_SIZE = ceil(sqrt(n));
        Q.reserve(n_queries);
    }

    void add_query(int L, int R, int id) {
        Q.push_back({L, R, id});
    }

    // expand then shrink
    // add(++mo_R)/add(--mo_L) and remove(mo_R--)/remove(mo_L--)
    inline void process_queries() {
        // by block of L, then R (zig-zag on odd blocks): the window moves O((n + q) sqrt n)
        sort(Q.begin(), Q.end(), [&](const Query& a, const Query& b) {
            int ba = a.L / BLOCK_SIZE, bb = b.L / BLOCK_SIZE;
            if (ba != bb) return ba < bb;
            return (ba & 1) ? a.R > b.R : a.R < b.R;
        });

        // window size = mo_R - mo_L + 1 = 0 (empty)
        int mo_L = 0, mo_R = -1;
        for (int i = 0; i < Q.size(); i++) {
            int L = Q[i].L, R = Q[i].R;

            // expand
            while (mo_L > L) add(--mo_L);
            while (mo_R < R) add(++mo_R);

            // shrink
            while (mo_L < L) remove(mo_L--);
            while (mo_R > R) remove(mo_R--);

            // process answer here
            // ans[Q[i].id] = ...
        }
    }
    
    inline void add(int idx) {}
    inline void remove(int idx) {}
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from math import isqrt

# Mo's algorithm: answer offline range queries by moving one window [mo_L, mo_R].
# The caller keeps the window state:
#   add(i)     A[i] enters the window
#   remove(i)  A[i] leaves the window
#   answer()   the answer for the current window


class Mo:
    def __init__(self, a: list):
        self.A = a
        self.BLOCK_SIZE = max(1, isqrt(len(a)))
        self.Q = [] # (L, R, id), inclusive

    def add_query(self, L: int, R: int, id: int) -> None:
        self.Q.append((L, R, id))

    # answers indexed by query id
    def process_queries(self, add, remove, answer) -> list:
        B = self.BLOCK_SIZE
        # sort by block of L, then R (zig-zag on odd blocks), so the window moves O((n + q) sqrt n)
        order = sorted(self.Q, key=lambda q: (q[0] // B, q[1] if (q[0] // B) % 2 == 0 else -q[1]))
        ans = [None] * len(self.Q)
        mo_L, mo_R = 0, -1 # empty window
        for L, R, id in order:
            # expand first, so the window never turns inside out
            while mo_L > L:
                mo_L -= 1
                add(mo_L)
            while mo_R < R:
                mo_R += 1
                add(mo_R)
            # then shrink
            while mo_L < L:
                remove(mo_L)
                mo_L += 1
            while mo_R > R:
                remove(mo_R)
                mo_R -= 1
            ans[id] = answer()
        return ans
```
{% endraw %}

</div>
