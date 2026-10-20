---
layout: template
title: "Digit DP"
description: "Digit DP in Python, from my competitive programming notebook."
permalink: /library/digitdp/
slug: digitdp
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from functools import cache

# Count x in [1, N] by walking x's digits left to right through a state machine:
#   start           the state before the first (nonzero) digit
#   step(state, d)  the state after digit d, or None to reject x
#   accept(state)   whether a finished x counts
# The state must be hashable (int, tuple, frozenset). Count [L, R] as f(R) - f(L - 1).
#
# e.g. digit sum divisible by k:
#   count_up_to(N, 0, lambda s, d: (s + d) % k, lambda s: s == 0)


def count_up_to(N: int, start, step, accept) -> int:
    if N <= 0: return 0
    digits = list(map(int, str(N)))

    @cache
    def dp(i: int, state, tight: bool, started: bool) -> int:
        if i == len(digits): return int(started and accept(state))
        res = 0
        hi = digits[i] if tight else 9
        for d in range(hi + 1):
            if not started and d == 0: # still a leading zero: the state does not move
                res += dp(i + 1, state, tight and d == hi, False)
                continue
            nxt = step(state, d)
            if nxt is None: continue
            res += dp(i + 1, nxt, tight and d == hi, True)
        return res

    return dp(0, start, True, False)
```
{% endraw %}

</div>
