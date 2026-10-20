---
layout: template
title: "Count-Min Sketch"
description: "Count-Min Sketch in C++ and Python, from my competitive programming notebook."
permalink: /library/countminsketch/
slug: countminsketch
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

template<typename T>
using HashFunction = function<int(const T&)>;

// SplitMix64. Folding a seed in makes each row an independent hash.
inline uint64_t mix64(uint64_t x) {
    x += 0x9e3779b97f4a7c15ULL;
    x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
    x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
    return x ^ (x >> 31);
}

// Bucket in [0, width). The same key and seed always map to the same column.
template<typename T>
int hashWithSeed(const T& key, uint64_t seed, int width) {
    uint64_t h = mix64((uint64_t)hash<T>{}(key) ^ (seed + 0x9e3779b97f4a7c15ULL));
    if (width <= 0) return 0;
    return (int)(h % (uint64_t)width);
}

template<typename T>
class CountMinSketch {
private:
    int width, depth;
    vector<uint64_t> seeds;
    vector<vector<int>> hashMatrix;
    vector<HashFunction<T>> hashFunctions;

    static vector<uint64_t> randomSeeds(int d) {
        random_device rd;
        mt19937_64 rng(((uint64_t)rd() << 32) ^ rd());
        vector<uint64_t> s(max(d, 0));
        for (int i = 0; i < d; i++) s[i] = rng();
        return s;
    }

public:
    CountMinSketch(int w, int d) : width(w), depth(d), seeds(randomSeeds(d)) {
        initHashFunctions();
        hashMatrix.assign(depth, vector<int>(width, 0));
    }

    // Pass one seed per row. merge() is valid only when both sketches share these seeds.
    CountMinSketch(int w, int d, vector<uint64_t> hashSeeds)
        : width(w), depth(d), seeds(std::move(hashSeeds)) {
        seeds.resize(depth);
        initHashFunctions();
        hashMatrix.assign(depth, vector<int>(width, 0));
    }

    void initHashFunctions() {
        hashFunctions.clear();
        hashFunctions.reserve(depth);
        for (int r = 0; r < depth; r++) {
            uint64_t seed = seeds[r];
            int w = width;
            hashFunctions.push_back([seed, w](const T& x) {
                return hashWithSeed(x, seed, w);
            });
        }
    }

    void insert(const T& x) {
        for (int r = 0; r < depth; r++) {
            int c = hashFunctions[r](x);
            hashMatrix[r][c] += 1;
        }
    }

    // Estimate is always >= the true frequency (until a counter overflows).
    int count(const T& x) const {
        if (depth == 0) return 0;
        int res = INT_MAX;
        for (int r = 0; r < depth; r++) {
            int c = hashFunctions[r](x);
            res = min(res, hashMatrix[r][c]);
        }
        return res;
    }

    void clear() {
        for (auto& row : hashMatrix) fill(row.begin(), row.end(), 0);
    }

    vector<vector<int>> getMatrix() const { return hashMatrix; }

    // Caller deletes the result. Returns nullptr unless width, depth, and seeds match.
    CountMinSketch* merge(const CountMinSketch* other) const {
        if (!other || other->width != width || other->depth != depth || other->seeds != seeds)
            return nullptr;
        auto* res = new CountMinSketch(width, depth, seeds);
        for (int r = 0; r < depth; r++) {
            for (int c = 0; c < width; c++) {
                res->hashMatrix[r][c] = hashMatrix[r][c] + other->hashMatrix[r][c];
            }
        }
        return res;
    }

    // k candidates with the largest estimates, most frequent first.
    vector<T> topK(int k, const vector<T>& candidates) const {
        priority_queue<pair<int, T>, vector<pair<int, T>>, greater<pair<int, T>>> pq;
        for (auto& x : candidates) {
            pq.push({count(x), x});
            if ((int)pq.size() > k) pq.pop();
        }
        vector<T> res;
        while (!pq.empty()) {
            res.push_back(pq.top().second);
            pq.pop();
        }
        reverse(res.begin(), res.end());
        return res;
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
import math, heapq
from utils.hash import random_seeds, hash_with_seed

class CountMinSketch:
    INF = math.inf

    def __init__(self, width, depth, seeds=None):
        self.width = width
        self.depth = depth
        self.seeds = seeds if (seeds is not None and len(seeds) == self.depth) else random_seeds(self.depth)
        self.hash_functions = [hash_with_seed] * self.depth
        self.matrix = [[0] * self.width for _ in range(self.depth)]

    def insert(self, x) -> None:
        for r in range(self.depth):
            c = self.hash_functions[r](x, self.seeds[r]) % self.width
            self.matrix[r][c] += 1

    def count(self, x) -> int:
        res = self.INF
        for r in range(self.depth):
            c = self.hash_functions[r](x, self.seeds[r]) % self.width
            res = min(res, self.matrix[r][c])
        return res

    def clear(self):
        self.matrix = [[0] * self.width for _ in range(self.depth)]

    def merge(self, other) -> None:
        if other.width != self.width or other.depth != self.depth or other.seeds != self.seeds:
            return None            
        res = CountMinSketch(self.width, self.depth, self.seeds)
        for r in range(self.depth):
            for c in range(self.width):
                res.matrix[r][c] = self.matrix[r][c] + other.matrix[r][c]
        return res

    def top_k(self, k, candidates):
        min_heap = []
        for candidate in candidates:
            cnt = self.count(candidate)
            heapq.heappush(min_heap, (cnt, candidate))
            if len(min_heap) > k:
                heapq.heappop(min_heap)
        return [candidate for cnt, candidate in sorted(min_heap, reverse=True)]
```
{% endraw %}

</div>
