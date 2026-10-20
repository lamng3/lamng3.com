---
layout: template
title: "Monotonic Stack"
description: "Monotonic Stack in Python, from my competitive programming notebook."
permalink: /library/monotonicstack/
slug: monotonicstack
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# beats(x, y) says x wins against y: operator.gt for "greater", operator.lt for "smaller"
#   next_index(a, gt)  next greater      next_index(a, lt)  next smaller
#   prev_index(a, gt)  previous greater  prev_index(a, lt)  previous smaller
# use ge / le instead to count ties as wins


# nxt[i] = first j > i with beats(a[j], a[i]), or n
def next_index(a: list, beats) -> list:
    n = len(a)
    nxt = [n] * n
    st = [] # indices still waiting for their answer
    for i in range(n):
        while st and beats(a[i], a[st[-1]]):
            nxt[st.pop()] = i
        st.append(i)
    return nxt


# prv[i] = last j < i with beats(a[j], a[i]), or -1
def prev_index(a: list, beats) -> list:
    n = len(a)
    prv = [-1] * n
    st = [] # indices that can still be someone's answer
    for i in range(n):
        while st and not beats(a[st[-1]], a[i]):
            st.pop()
        if st: prv[i] = st[-1]
        st.append(i)
    return prv
```
{% endraw %}

</div>
