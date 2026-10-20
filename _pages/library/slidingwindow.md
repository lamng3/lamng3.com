---
layout: template
title: "Sliding Window"
description: "Sliding Window in Python, from my competitive programming notebook."
permalink: /library/slidingwindow/
slug: slidingwindow
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from math import inf

# The window is a[left..right]. The caller keeps its state:
#   add(i)     a[i] enters the window
#   remove(i)  a[i] leaves the window
#   bad()      the window breaks the rule      (longest_window)
#   good()     the window satisfies the rule   (shortest_window)
#
# e.g. longest substring with at most k distinct letters:
#   cnt = Counter()
#   def add(i): cnt[s[i]] += 1
#   def remove(i):
#       cnt[s[i]] -= 1
#       if cnt[s[i]] == 0: del cnt[s[i]]   # else len(cnt) never drops
#   longest_window(len(s), add, remove, lambda: len(cnt) > k)


# longest window that is not bad; the rule must survive shrinking
def longest_window(n: int, add, remove, bad) -> int:
    ans = left = 0
    for right in range(n):
        add(right)
        while bad():
            remove(left)
            left += 1
        ans = max(ans, right - left + 1)
    return ans


# shortest window that is good, 0 if there is none; the rule must survive growing
def shortest_window(n: int, add, remove, good) -> int:
    ans, left = inf, 0
    for right in range(n):
        add(right)
        while good():
            ans = min(ans, right - left + 1)
            remove(left)
            left += 1
    return ans if ans < inf else 0
```
{% endraw %}

</div>
