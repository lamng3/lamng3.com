---
layout: template
title: "Square Root Decomposition"
description: "Square Root Decomposition in C++ and Python, from my competitive programming notebook."
permalink: /library/srd/
slug: srd
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
/*
Square Root Decomposition
*/
#pragma once
#include <bits/stdc++.h>
using namespace std;

template <typename T>
struct SRD {
    int BLOCK_SIZE;
    vector<T> A;
    vector<T> blocks;

    SRD(int sqrtn, vector<T>& a) : BLOCK_SIZE(sqrtn), blocks(sqrtn, 0) {
        A = a;
        for (int i = 0; i < A.size(); i++) {
            blocks[i/BLOCK_SIZE] += A[i];
        }
    }

    /* O(1) update to set A[x] = v */
    void update(int x, T v) {
        blocks[x/BLOCK_SIZE] -= A[x];
        A[x] = v;
        blocks[x/BLOCK_SIZE] += A[x];
    }

    /* O(sqrt(n)) query for sum of [0,R) */
    T query(int R) {
        if (R < 0) return 0;
        T res = 0;
        for (int i = 0; i < R/BLOCK_SIZE; i++) res += blocks[i];
        for (int i = (R/BLOCK_SIZE) * BLOCK_SIZE; i < R; i++) res += A[i];
        return res;
    }

    /* O(sqrt(n)) query for sum of [L,R) */
    T query(int L, int R) {
        return query(R) - query(L);
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# Square Root Decomposition: point set, range sum in O(sqrt n)


class SRD:
    def __init__(self, sqrtn: int, a: list):
        self.BLOCK_SIZE = sqrtn # blocks of sqrtn elements; needs sqrtn * sqrtn >= len(a)
        self.A = list(a)
        self.blocks = [0] * sqrtn
        for i, x in enumerate(self.A):
            self.blocks[i // self.BLOCK_SIZE] += x

    # O(1): set A[x] = v
    def update(self, x: int, v) -> None:
        self.blocks[x // self.BLOCK_SIZE] += v - self.A[x]
        self.A[x] = v

    # O(sqrt n): sum of A[0, R) with one argument, A[L, R) with two
    def query(self, L: int, R: int = None):
        if R is not None: return self.query(R) - self.query(L)
        R = L
        if R <= 0: return 0
        B = self.BLOCK_SIZE
        return sum(self.blocks[:R // B]) + sum(self.A[R // B * B:R])
```
{% endraw %}

</div>
