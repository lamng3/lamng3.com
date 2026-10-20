---
layout: template
title: "Eviction Cache Interface"
description: "Eviction Cache Interface in C++, from my competitive programming notebook."
permalink: /library/eviction-cache/
slug: eviction-cache
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

struct Page {
    int key = -1;
    int value = -1;
    bool valid = false;
};

struct EvictionCache {
    virtual ~EvictionCache() {}

    virtual string name() const = 0;

    // Returns the page for key, or an invalid page if absent. Counts as an access.
    virtual Page get(int key) = 0;

    // Inserts/updates key->value, evicting as needed to respect capacity.
    // Returns the evicted page, or an invalid page if nothing was evicted.
    virtual Page put(int key, int value) = 0;
};
```
{% endraw %}

</div>
