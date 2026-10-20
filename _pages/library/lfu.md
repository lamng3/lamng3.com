---
layout: template
title: "LFU Cache"
description: "LFU Cache in C++, from my competitive programming notebook."
permalink: /library/lfu/
slug: lfu
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include "eviction_cache.h"

class LFUCache : public EvictionCache {
private:
    int capacity;

    Page evict() {
        return {};
    }

public:
    LFUCache(int cap) : capacity(cap) {}

    string name() const override { return "LFU"; }

    Page get(int key) override {
        return {};
    }

    Page put(int key, int value) override {
        return {};
    }
};
```
{% endraw %}

</div>
