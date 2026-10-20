---
layout: template
title: "Hash Function Factory"
description: "Hash Function Factory in C++ and Python, from my competitive programming notebook."
permalink: /library/hash/
slug: hash
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

using HashFunction = function<size_t(const string&)>;

// Factory for string hash functions.
class HashFactory {
public:
    // DJB2 with a custom seed
    static HashFunction createDJB2(size_t seed) {
        return [seed](const string& key) -> size_t {
            size_t hash = seed;
            for (char c : key) {
                hash = ((hash << 5) + hash) + c;
            }
            return hash;
        };
    }

    // FNV-1a with a custom seed
    static HashFunction createFNV1a(size_t seed) {
        return [seed](const string& key) -> size_t {
            size_t hash = 2166136261U ^ seed;
            for (char c : key) {
                hash ^= c;
                hash *= 16777619U;
            }
            return hash;
        };
    }

    // k hashes via Kirsch-Mitzenmacher: h1 + i*h2
    static vector<HashFunction> generateHashes(int k) {
        vector<HashFunction> hashes;
        auto h1 = createDJB2(5381);
        auto h2 = createFNV1a(0);
        for (int i = 0; i < k; ++i) {
            hashes.push_back([i, h1, h2](const string& key) -> size_t {
                return h1(key) + i * h2(key);
            });
        }
        return hashes;
    }
};

// Mixers + drop-in hashers for unordered_map/set (anti-collision).
namespace hashing {

    // 64-bit avalanche mixer
    inline uint64_t splitmix64(uint64_t x) {
        x += 0x9e3779b97f4a7c15ULL;
        x = (x ^ (x >> 30)) * 0xbf58476d1ce4e5b9ULL;
        x = (x ^ (x >> 27)) * 0x94d049bb133111ebULL;
        return x ^ (x >> 31);
    }

    // per-run random seed
    inline uint64_t fixed_random() {
        return chrono::steady_clock::now().time_since_epoch().count();
    }

    // FNV-1a over raw bytes
    inline uint64_t fnv1a(const void* data, size_t len) {
        const uint8_t* p = static_cast<const uint8_t*>(data);
        uint64_t h = 1469598103934665603ULL;
        for (size_t i = 0; i < len; ++i) {
            h ^= p[i];
            h *= 1099511628211ULL;
        }
        return h;
    }
    inline uint64_t fnv1a(const string& s) { return fnv1a(s.data(), s.size()); }

    // unordered_map<long long, V, hashing::IntHash>
    struct IntHash {
        size_t operator()(uint64_t x) const {
            static const uint64_t SEED = fixed_random();
            return splitmix64(x + SEED);
        }
    };

    // unordered_map<pair<int,int>, V, hashing::PairHash>
    struct PairHash {
        template <class A, class B>
        size_t operator()(const pair<A, B>& p) const {
            static const uint64_t SEED = fixed_random();
            uint64_t h = splitmix64((uint64_t)p.first + SEED);
            h ^= splitmix64((uint64_t)p.second + SEED) + 0x9e3779b97f4a7c15ULL + (h << 6) + (h >> 2);
            return h;
        }
    };

    struct StringHash {
        size_t operator()(const string& s) const {
            static const uint64_t SEED = fixed_random();
            return splitmix64(fnv1a(s) + SEED);
        }
    };

    // polynomial rolling hash, O(1) substring queries
    struct RollingHash {
        static const uint64_t MOD = (1ULL << 61) - 1;
        uint64_t base;
        vector<uint64_t> pre;   // prefix hashes
        vector<uint64_t> pw;    // base^i

        static uint64_t mulmod(uint64_t a, uint64_t b) {
            __uint128_t c = (__uint128_t)a * b;
            uint64_t lo = (uint64_t)(c & MOD), hi = (uint64_t)(c >> 61);
            uint64_t r = lo + hi;
            return r >= MOD ? r - MOD : r;
        }

        explicit RollingHash(const string& s, uint64_t b = 131) : base(b) {
            int n = s.size();
            pre.assign(n + 1, 0);
            pw.assign(n + 1, 1);
            for (int i = 0; i < n; ++i) {
                pre[i + 1] = (mulmod(pre[i], base) + s[i]) % MOD;
                pw[i + 1]  = mulmod(pw[i], base);
            }
        }

        // hash of s[l..r] inclusive, 0-indexed
        uint64_t query(int l, int r) const {
            return (pre[r + 1] + MOD - mulmod(pre[l], pw[r - l + 1])) % MOD;
        }
    };

} // namespace hashing
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
import random

MASK = (1 << 64) - 1  # Python ints never overflow, so cut every step to 64 bits


# polynomial rolling hash
def polynomial(key, base=31):
    h = 0
    for c in key:
        h = (h * base + ord(c)) & MASK
    return h


# DJB2 with a custom seed
def djb2(key, seed=5381):
    h = seed
    for c in key:
        h = (h * 33 + ord(c)) & MASK
    return h


# FNV-1a (64-bit) with a custom seed
def fnv1a(key, seed=0):
    h = 14695981039346656037 ^ seed
    for c in key:
        h ^= ord(c)
        h = (h * 1099511628211) & MASK
    return h


# 64-bit avalanche mixer
def splitmix64(x):
    x = (x + 0x9e3779b97f4a7c15) & MASK
    x = ((x ^ (x >> 30)) * 0xbf58476d1ce4e5b9) & MASK
    x = ((x ^ (x >> 27)) * 0x94d049bb133111eb) & MASK
    return x ^ (x >> 31)


# hash of a str or int under a seed, every seed gives an independent hash
# use hash_with_seed(key, seed) % width as the column of a row
def hash_with_seed(key, seed):
    return splitmix64(djb2(str(key)) ^ ((seed + 0x9e3779b97f4a7c15) & MASK))


# one random 64-bit seed per row
def random_seeds(k):
    return [random.getrandbits(64) for _ in range(k)]


# k hashes via Kirsch-Mitzenmacher: h1 + i*h2
def generate_hashes(k):
    return [lambda key, i=i: (djb2(key) + i * fnv1a(key)) & MASK for i in range(k)]
```
{% endraw %}

</div>
