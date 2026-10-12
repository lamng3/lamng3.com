---
layout: post
title: "Contest Setup"
description: "The files and tools I start every problem with: starter templates for contests, LeetCode, and OI, small scripts that create, fetch, and test a solution, and how the template went from Java to C++ to Python."
permalink: /blog/contest-setup/
last_updated: 2026-10-12
author: Lam Nguyen
toc:
  sidebar: right
---

The files and tools I start every problem with: starter templates for contests, LeetCode, and OI, and small scripts that create, fetch, and test a solution.

## From Java to C++ to Python {#python-templates}

My template has been rewritten twice, each time in a shorter language. What changed each time was how much bookkeeping I had to type. The shape of the solutions stayed the same. This section is about which parts to shorten, which parts to leave alone, and what to check when reviewing a Python solution.

### Java: everything spelled out

The first template was [`Main.java`](https://github.com/lamng3/advanced_algorithms/blob/main/Main.java). Before `solve` could read a single number it needed a `FastScanner`, a `main` that looped over test cases, and a block of static helpers I had written once and carried everywhere: modular `add`, `subtract`, `multiply`, a `gcd`, a sieve, and a `ruffle_sort` that shuffles an `int[]` before sorting it so that an anti-quicksort test could not make `Arrays.sort` quadratic. Modular exponentiation looked like this:

```java
static long exp(long base, long exp) {
    long result = 1;
    while (exp > 0) {
        if ((exp & 1) == 1) result = multiply(result, base);
        base = multiply(base, base);
        exp >>= 1;
    }
    return result;
}
```

None of that is hard, and all of it is typing. The template ran to nearly 700 lines, and most of them were there to make up for what the standard library left out.

### C++: macros for the loops

The [C++ template](https://github.com/lamng3/competitive-programming-notebook/blob/main/templates/contest.cpp) gets the I/O from `cin.tie(0)` and the containers from `<bits/stdc++.h>`. What remains repetitive is the loops, so the macros target exactly those: `REP(i, n)`, `FOR(i, a, b)`, `all(x)`, `sz(x)`. Sorting needs no shuffle, because `std::sort` is introsort. The exponentiation is the same loop, written once in [`ModFact.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/math/modular_arithmetic/ModFact.h):

```cpp
ll binpow(ll a, ll b) {
    a %= MOD;
    ll res = 1;
    while (b) {
        if (b % 2) res = (res * a) % MOD;
        a = (a * a) % MOD;
        b >>= 1;
    }
    return res;
}
```

### Python: the library is the template

In Python, that function is a built-in: `pow(a, b, MOD)`. The inverse is `pow(a, -1, MOD)`. Most of the notebook's helpers shrink the same way, because Python's standard library already has them:

| C++ | Python |
| --- | --- |
| prefix-sum loop | `list(accumulate(a, initial=0))` |
| `sort`, `unique`, `lower_bound` to compress | `rank = {x: i for i, x in enumerate(sorted(set(a)))}` |
| `binpow(a, b)`, `modInverse(a)` | `pow(a, b, MOD)`, `pow(a, -1, MOD)` |
| memo table filled with `-1` | `@cache` on the recursive function |
| `map<int, int> cnt` | `Counter(a)` |
| `lower_bound`, `upper_bound` | `bisect_left`, `bisect_right` |
| `priority_queue` (max on top) | `heappush(pq, -x)`, since `heapq` is a min-heap |
| loop over adjacent pairs | `zip(a, a[1:])` |
| `vector<vector<int>>(n, vi(m))` | `[[0] * m for _ in range(n)]` |

[`leetcode.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/leetcode.py) is the starter. It has these imports, `INF` and `MOD`, the `dr` and `dc` arrays, and a raised recursion limit. `cpnew A leetcode --py` copies it, the same way `cpnew A leetcode` copies the C++ one.

Structures come over as close to the C++ as possible, keeping the same file paths and method names, so a Python file reads next to its header. [`FenwickTree.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/data_structures/1d_range_query/FenwickTree.py) is still 1-indexed with `add(i, u)` and `sum(L, R)`. [`SegmentTree.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/data_structures/1d_range_query/SegmentTree.py) still recurses on `(v, tl, tr)`, but takes `combine` and `identity` as arguments instead of virtual methods. [`CoordinateCompression.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/utils/CoordinateCompression.py) keeps `value_at` and `rank_of`, and replaces the `lower_bound` with a dictionary lookup.

### What stays traditional

The shortcuts above all replace bookkeeping. The control flow is a different matter, and here is a solution to [LeetCode 778](https://leetcode.com/problems/swim-in-rising-water/) that I would write the same way in any of the three languages:

```python
def valid(t: int):
    if grid[0][0] > t: return False
    q = deque()
    q.append((0, 0))
    seen = set()
    seen.add((0, 0))
    while q:
        r, c = q.popleft()
        if r == n-1 and c == n-1: return True
        for i in range(4):
            nr, nc = r + dr[i], c + dc[i]
            if not inrange(nr, nc) or (nr, nc) in seen or grid[nr][nc] > t: continue
            q.append((nr, nc))
            seen.add((nr, nc))
    return False

left, right = 0, n*n
ans = n*n+1
while left <= right:
    mid = left + (right - left) // 2
    if valid(mid):
        ans = mid
        right = mid-1
    else: left = mid+1
```

A one-liner could replace the four `dr`, `dc` neighbors, and `bisect` could replace the binary search. I keep both explicit for two reasons.

- **These are the lines where the bugs are.** Off-by-one boundaries, a cell marked seen too late, or a binary search that never ends all live here. Explicit code puts each decision on its own line, where a reviewer can check it.
- **The shape carries between languages.** `left <= right` with a separate `ans`, and `continue` on the first failed check, read the same in Java, C++, and Python. When I switch languages, I only have to remember new bookkeeping, not new algorithms.

The notebook keeps these shapes in [one folder per topic](https://github.com/lamng3/competitive-programming-notebook/tree/main/python): prefix sums, sliding windows, monotonic stacks, binary search, backtracking, BFS, DFS, Dijkstra, topological sort, and digit DP, next to the Python versions of every C++ structure. Each template is generic, and the problem plugs in through arguments. In [`BFS.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/bfs/BFS.py), `bfs_grid` takes an `ok(r, c)` that says which cells can be entered, so walls, water levels, and the `grid[nr][nc] > t` check above all become one argument, and the loop is never edited. In [`SlidingWindow.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/arrays/sliding_window/SlidingWindow.py), the caller keeps the window's state in `add` and `remove`. Every template has a test, and these are the files to write from memory and to check a solution against.

### Reviewing a Python solution

Python fails differently from C++. In C++, a mistake usually crashes the program or gives an answer that is obviously wrong. The Python mistakes below all run without an error and give a believable wrong answer, so I check for them every time.

- **`[[0] * m] * n` is one row, n times.** Writing to `P[0][0]` changes every row. Build grids with `[[0] * m for _ in range(n)]`.
- **Negative indices don't raise.** `grid[-1][c]` is the last row, not an error. The `inrange` check must come before any indexing, as in the `if not inrange(nr, nc) or ...` line above, where the `or` stops before `grid[nr][nc]` is read.
- **Reading a `defaultdict` creates the key.** A lookup that was only meant to check silently adds an entry. See [the trie](/blog/strings/#trie) for the case where this breaks a file system.
- **The recursion limit is 1000.** A DFS down a path of $$10^5$$ nodes raises `RecursionError`. `leetcode.py` raises the limit, and an explicit stack is the safe fallback.
- **`heapq` is a min-heap, and it cannot delete.** Push `-x` to get a max-heap, and skip stale entries when they are popped ([lazy deletion](/blog/priority-queues/#priority-queues)).
- **A `Counter` keeps keys at zero.** After `cnt[x] -= 1` brings a count to $$0$$, `len(cnt)` still counts `x`. `del cnt[x]` when it reaches zero, or the sliding window never shrinks.
- **Backtracking appends a reference.** `ans.append(path)` stores the list that the recursion keeps changing. Append `path[:]`.

## From the Notebook {#notebook}

Implementations from my [competitive programming notebook](https://github.com/lamng3/competitive-programming-notebook), tagged with their [USACO Guide](https://usaco.guide/) level where they have one.

- **Starters**. [`contest.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/templates/contest.cpp): Default contest file. [`leetcode.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/templates/leetcode.cpp): LeetCode method stub. [`minimal.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/templates/minimal.cpp): Shortest starter. [`oi.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/templates/oi.cpp): OI starter. [`template.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/template.py): Python starter. [`leetcode.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/leetcode.py): Python LeetCode starter.
- **Python templates**. [`python/`](https://github.com/lamng3/competitive-programming-notebook/tree/main/python): Generic templates by topic, and the Python version of every C++ structure, each with a test.
- **Tools**. [`cpnew`](https://github.com/lamng3/competitive-programming-notebook/blob/main/tools/cpnew.py): Copy a template into a new file, `--py` for Python. [`cpgen`](https://github.com/lamng3/competitive-programming-notebook/blob/main/tools/cpgen.py): Fetch a LeetCode problem and write the stub. [`cptest`](https://github.com/lamng3/competitive-programming-notebook/blob/main/tools/cptest.py): Run a solution against cached examples.
