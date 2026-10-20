---
layout: template
title: "2Q Cache"
description: "2Q Cache in C++, from my competitive programming notebook."
permalink: /library/lru-two-q/
slug: lru-two-q
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include "eviction_cache.h"
#include "lru.h"
#include "fifo.h"

// LRU 2Q (full version):
//   A1_in  (FIFO): newly seen pages; re-access does NOT reorder.
//   A1_out (ghost FIFO): references only, no page data; records pages aged out
//                        of A1_in so a later access can promote them.
//   Am     (LRU): hot pages (accessed again after leaving A1_in).
struct GhostQueue {
    int capacity;
    unordered_set<int> live;
    deque<int> order;

    GhostQueue(int cap) : capacity(cap) {}

    bool contains(int k) const { return live.count(k); }

    void erase(int k) { live.erase(k); }

    void putRef(int k) {
        if (live.count(k)) return;
        live.insert(k);
        order.push_back(k);
        while ((int)live.size() > capacity) {
            int f = order.front();
            order.pop_front();
            live.erase(f);
        }
    }
};

class LRU2QCache : public EvictionCache {
private:
    LRUCache Am;
    FIFOCache A1_in;
    GhostQueue A1_out;

public:
    LRU2QCache(int cap_am, int cap_a1_in, int cap_a1_out)
        : Am(cap_am), A1_in(cap_a1_in), A1_out(cap_a1_out) {}

    string name() const override { return "LRU-2Q"; }

    Page get(int key) override {
        Page pAm = Am.get(key);
        if (pAm.valid) return pAm;

        Page pIn = A1_in.get(key);
        if (pIn.valid) return pIn;

        return {};
    }

    Page put(int key, int value) override {
        // already resident: update in place, never in a second queue
        if (Am.get(key).valid) return Am.put(key, value);
        if (A1_in.get(key).valid) return A1_in.put(key, value);

        if (A1_out.contains(key)) {
            A1_out.erase(key);
            return Am.put(key, value);
        }

        Page ev = A1_in.put(key, value);
        if (ev.valid) A1_out.putRef(ev.key);
        return ev;
    }
};
```
{% endraw %}

</div>
