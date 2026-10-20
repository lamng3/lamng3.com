---
layout: template
title: "Compressed Sparse Row"
description: "Compressed Sparse Row in C++ and Python, from my competitive programming notebook."
permalink: /library/csr/
slug: csr
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

using vi = vector<int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)

#define sz(x) (int)((x).size())

#define pb push_back

template<typename T>
struct CSR {
    int n;
    bool built = false;
    vi offset;
    vi row;
    vector<T> data;

    CSR(int n = 0) : n(n) {}

    // stage entry x into row i; any order, any number of times
    void add(int i, const T& x) {
        assert(0 <= i && i < n && !built);
        row.pb(i);
        data.pb(x);
    }

    // group everything by row in one O(n + nnz) counting sort
    // nnz = number of non zero elements
    void build() {
        assert(!built);
        built = true;
        int m = sz(data);

        offset.assign(n+1, 0);
        for (int i : row) offset[i+1]++; // count entries per row
        FOR(i, 1, n) offset[i] += offset[i-1]; // prefix sums = row starts

        // scatter into each slice
        vi cur = offset;
        vector<T> tmp(m);
        REP(k, m) tmp[cur[row[k]]++] = data[k];
        
        swap(data, tmp);
        row.clear();
    }

    struct range {
        T *first, *last;
        T* begin() const { return first; }
        T* end() const { return last; }
        int size() const { return int(last - first); }
        bool empty() const { return first == last; }
    };

    range operator[](int i) {
        assert(built);
        return range{data.data() + offset[i], data.data() + offset[i+1]};
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# Compressed sparse row: entries grouped by row in one flat list.
# row i is data[offset[i]:offset[i+1]]


class CSR:
    def __init__(self, n: int):
        self.n = n
        self.built = False
        self.row, self.data = [], []

    # stage entry x into row i; any order, any number of times
    def add(self, i: int, x) -> None:
        assert 0 <= i < self.n and not self.built
        self.row.append(i)
        self.data.append(x)

    # group everything by row in one O(n + nnz) counting sort
    def build(self) -> None:
        assert not self.built
        self.built = True
        self.offset = [0] * (self.n + 1)
        for i in self.row: self.offset[i + 1] += 1 # count entries per row
        for i in range(1, self.n + 1): self.offset[i] += self.offset[i - 1] # prefix sums = row starts
        cur = self.offset[:]
        tmp = [None] * len(self.data)
        for i, x in zip(self.row, self.data): # scatter into each slice
            tmp[cur[i]] = x
            cur[i] += 1
        self.data, self.row = tmp, []

    def __getitem__(self, i: int) -> list:
        assert self.built
        return self.data[self.offset[i]:self.offset[i + 1]]
```
{% endraw %}

</div>
