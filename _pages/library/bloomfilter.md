---
layout: template
title: "Bloom Filter"
description: "Bloom Filter in C++ and Python, from my competitive programming notebook."
permalink: /library/bloomfilter/
slug: bloomfilter
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>

using namespace std;

using HashFunction = function<size_t(const string&)>;

class BloomFilter {
private:
    int bit_size;
    vector<bool> bits;
    vector<HashFunction> hash_funcs;

    // polynomial rolling hash, base 31
    static size_t hash1(const string& key) {
        size_t h = 0;
        for (char c : key) h = h * 31 + c;
        return h;
    }

    // DJB2
    static size_t hash2(const string& key) {
        size_t h = 5381;
        for (char c : key) h = h * 33 + c;
        return h;
    }

public:
    BloomFilter(int m) {
        bit_size = m;
        bits.resize(bit_size, false);
        hash_funcs = {hash1, hash2};
    }

    void add(const string& key) {
        for (auto& hash_func : hash_funcs) {
            bits[hash_func(key)%bit_size] = true;
        }
    }

    bool contains(const string& key) {
        for (auto& hash_func : hash_funcs) {
            if (!bits[hash_func(key)%bit_size]) return false;
        }
        return true;
    }

    void clear() {
        fill(bits.begin(), bits.end(), false);
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from utils.hash import djb2, fnv1a

class BloomFilter:
    def __init__(self, bit_size: int, hash_functions=None) -> None:
        self.bit_size_ = bit_size
        self.bit_vector_ = [False] * self.bit_size_
        self.hash_functions_ = hash_functions if hash_functions is not None else [djb2, fnv1a]

    def clear(self) -> None:
        self.bit_vector_ = [False] * self.bit_size_

    def contains(self, key: str) -> bool:
        for hash in self.hash_functions_:
            if not self.bit_vector_[hash(key) % self.bit_size_]:
                return False
        return True

    def add(self, key: str) -> None:
        for hash in self.hash_functions_:
            self.bit_vector_[hash(key) % self.bit_size_] = True
```
{% endraw %}

</div>
