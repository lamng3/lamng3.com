---
layout: template
title: "Coordinate Compression"
description: "Coordinate Compression in C++ and Python, from my competitive programming notebook."
permalink: /library/coordinatecompression/
slug: coordinatecompression
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

template<class T> struct CoordinateCompressor {
    vector<T> A; 
    
    CoordinateCompressor(vector<T>& arr) {
        A = arr;
        sort(A.begin(), A.end());
        A.erase(unique(A.begin(), A.end()), A.end());
        
        for (auto& x : arr) {
            x = lower_bound(A.begin(), A.end(), x) - A.begin();
        }
    }
    
    T value_at(int rank) const { 
        return A[rank]; 
    }
    
    int rank_of(T x) const { 
        return lower_bound(A.begin(), A.end(), x) - A.begin(); 
    }
    
    int size() const { 
        return A.size(); 
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from bisect import bisect_left


class CoordinateCompressor:
    # like CoordinateCompression.h: arr is rewritten in place to its ranks
    def __init__(self, arr: list):
        self.A = sorted(set(arr))                       # sort + unique
        self.rank = {x: i for i, x in enumerate(self.A)} # O(1) instead of lower_bound
        arr[:] = [self.rank[x] for x in arr]

    def value_at(self, rank: int):
        return self.A[rank]

    # rank of x; for an x that was never stored, the rank it would take
    def rank_of(self, x) -> int:
        return self.rank[x] if x in self.rank else bisect_left(self.A, x)

    def size(self) -> int:
        return len(self.A)
```
{% endraw %}

</div>
