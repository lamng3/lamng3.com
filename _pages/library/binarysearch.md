---
layout: template
title: "Binary Search"
description: "Binary Search in Python, from my competitive programming notebook."
permalink: /library/binarysearch/
slug: binarysearch
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# valid must be monotone on [lo, hi]. On a sorted list, bisect_left / bisect_right do the same.


# smallest x in [lo, hi] with valid(x), for False ... False True ... True; hi + 1 if none
def first_true(lo: int, hi: int, valid) -> int:
    ans = hi + 1
    left, right = lo, hi
    while left <= right:
        mid = left + (right - left) // 2
        if valid(mid):
            ans = mid
            right = mid - 1
        else: left = mid + 1
    return ans


# largest x in [lo, hi] with valid(x), for True ... True False ... False; lo - 1 if none
def last_true(lo: int, hi: int, valid) -> int:
    ans = lo - 1
    left, right = lo, hi
    while left <= right:
        mid = left + (right - left) // 2
        if valid(mid):
            ans = mid
            left = mid + 1
        else: right = mid - 1
    return ans


# real-valued first_true: 100 halvings shrink any double range to nothing
def first_true_real(lo: float, hi: float, valid, iters: int = 100) -> float:
    for _ in range(iters):
        mid = (lo + hi) / 2
        if valid(mid): hi = mid
        else: lo = mid
    return hi
```
{% endraw %}

</div>
