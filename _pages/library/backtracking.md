---
layout: template
title: "Backtracking"
description: "Backtracking in Python, from my competitive programming notebook."
permalink: /library/backtracking/
slug: backtracking
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# One shape: choose, recurse, un-choose. path is shared, so record path[:], never path.


# every sequence of length n where step i picks x from choices(i) and ok(path, x) holds
def backtrack(n: int, choices, ok=lambda path, x: True) -> list:
    ans, path = [], []

    def go(i: int):
        if i == n:
            ans.append(path[:])
            return
        for x in choices(i):
            if not ok(path, x): continue
            path.append(x)  # choose
            go(i + 1)       # recurse
            path.pop()      # un-choose

    go(0)
    return ans


# every subset of a: at each index, skip it or take it
def subsets(a: list) -> list:
    ans, path = [], []

    def go(i: int):
        if i == len(a):
            ans.append(path[:])
            return
        go(i + 1)
        path.append(a[i])
        go(i + 1)
        path.pop()

    go(0)
    return ans


# every ordering of a, with a used[] array instead of searching path
def permutations(a: list) -> list:
    ans, path, used = [], [], [False] * len(a)

    def go():
        if len(path) == len(a):
            ans.append(path[:])
            return
        for i in range(len(a)):
            if used[i]: continue
            used[i] = True
            path.append(a[i])
            go()
            path.pop()
            used[i] = False

    go()
    return ans
```
{% endraw %}

</div>
