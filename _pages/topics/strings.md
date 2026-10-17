---
layout: post
title: "Strings"
description: "Algorithms on strings. Equality questions over substrings belong to Hashing. Prefix questions belong to the trie, a tree of shared prefixes where every query is one DFS. A persistent trie keeps every past version of that tree by copying one path."
permalink: /blog/strings/
last_updated: 2026-10-17
author: Lam Nguyen
toc:
  sidebar: right
---

Algorithms on strings. Equality questions over substrings belong to [Hashing](/blog/hashing/). Prefix questions belong to the [trie](#trie), and the same tree over path names is a file system. A [persistent trie](#persistent-trie) keeps every past version of that tree by copying one path.

## Trie {#trie}

You are handed a dictionary of words and then a stream of questions about it. "Is `apple` in it?" is easy: put the words in a hash set and each lookup is $$O(L)$$ for a word of length $$L$$. The trouble starts with the next two questions.

- **"Does any word start with `app`?"** A hash set only knows whole words. Short of storing every prefix of every word separately, the only way to answer is to scan all of them.
- **"Is there a word matching `b.d`?"**, where `.` stands for any one letter ([LeetCode 211](https://leetcode.com/problems/design-add-and-search-words-data-structure/)). The set can try all $$26$$ fillings of the dot, and with $$k$$ dots that is $$26^k$$ lookups.

Both questions are about what words have **in common at the front**, and a hash set throws exactly that away. `apple` and `apply` hash to unrelated buckets, so the fact that they agree on four letters is lost. The question that unblocks it: what if words that share a prefix also share the storage for it?

### Share the prefixes

Lay the words out as a tree. The root is the empty string. Every edge is one letter, so every node stands for the prefix spelled on the path down to it. Inserting `apple` walks `a`, `p`, `p`, `l`, `e` from the root, creating a node wherever one is missing. Inserting `apply` afterwards reuses the first four nodes and adds a single new one for `y`.

Now "does any word start with `app`?" is a walk of three edges: if the path exists, some word passes through it. The cost is $$O(L)$$, independent of how many words are stored.

One detail decides whether the tree is correct. A node existing does not mean its prefix is a word. After inserting only `apple`, the node for `app` exists, but `app` was never inserted. So each node carries one bit, **`exist`**, set at the node where an inserted word ends. That bit is the only difference between `search("app")` and `startsWith("app")`.

### The node: a dictionary that makes its own children

The textbook C++ trie is a big array `trie[MAXN][26]`, a counter for the next free node, and `-1` for a missing edge. Every insert checks for the `-1`, allocates, and advances. It is fast, and it is also exactly the kind of code that has to be remembered rather than derived, with the alphabet size baked in.

In Python a node can be just a dictionary of children, and a `defaultdict` removes even the allocation:

```python
from collections import defaultdict

class TrieNode:
    def __init__(self):
        self.children = defaultdict(TrieNode) # a missing child is created on first touch
        self.exist = False                    # a word ends here

def insert(root, word):
    node = root
    for c in word:
        node = node.children[c]
    node.exist = True
```

`node.children[c]` either returns the existing child or builds a fresh `TrieNode` and stores it. Insert is a walk with no branches at all. The alphabet is whatever characters show up, so the same node stores lowercase words, digits, or whole path names (which [a file system](#trie-file-system) needs).

The convenience has a cost, and it is the one trap in this structure: **reading a missing key creates it.** A search that walks `node.children[c]` for a word that is not there quietly grows the tree, and the next `startsWith` on that prefix answers yes. Searches therefore read with `node.children.get(c)`, which returns `None` and leaves the dictionary alone. Insert uses `[]`, read uses `.get`.

### Every query is one DFS

The array version usually comes with three loops to remember: one for `search`, one for `startsWith`, and a recursive one for wildcards. They differ in only two places, so write the recursive one once and let those two places be parameters.

Let `dfs(i, node)` mean: the first $$i$$ letters of the query have been matched, and the walk is standing on `node`. There are only three cases.

- **The query is used up** ($$i = L$$). For `search`, the answer is `node.exist`. For `startsWith`, reaching the node at all is the answer, so it is `True`.
- **The letter is a dot.** Any child can match it, so try every child and succeed if one of them does.
- **The letter is a real letter.** Follow that one child if it exists. If it does not, the answer is `False`.

That is LeetCode 211, almost line for line:

```python
class WordDictionary:

    def __init__(self):
        self.root = TrieNode()

    def addWord(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.children[c]
        node.exist = True

    def search(self, word: str) -> bool:
        def dfs(i, node):
            if i == len(word):
                return node.exist
            if word[i] == ".":
                return any(dfs(i + 1, child) for child in node.children.values())
            child = node.children.get(word[i]) # .get, so a failed search adds nothing
            return child is not None and dfs(i + 1, child)

        return dfs(0, self.root)
```

Without dots the recursion never branches. It follows a single path, and a search costs $$O(L)$$. Each dot multiplies the paths by the branching at that depth, but only by children that actually exist. On real dictionaries that is far fewer than $$26$$, and the walk can never visit more nodes than the trie holds. Compare the hash set, which pays for all $$26^k$$ fillings whether or not any word is near them.

[`Trie.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/strings/trie/Trie.py) keeps the one `_dfs` with a `prefix` flag that picks the answer when the query is used up. `search` and `startsWith` are each one line on top of it, and both accept dots.

### Collecting words: the same DFS, carrying the path

Autocomplete asks for every word below a prefix, not just whether one exists. Walk to the prefix's node, then DFS the subtree. Carry the letters on the current path in a list: push a letter going down, pop it coming back, and record the path whenever `exist` is set.

```python
def words(root, prefix):
    node = root
    for c in prefix:
        node = node.children.get(c)
        if node is None: return []
    out, path = [], list(prefix)

    def dfs(node):
        if node.exist: out.append("".join(path))
        for c in sorted(node.children):
            path.append(c)
            dfs(node.children[c])
            path.pop()

    dfs(node)
    return out
```

A node is visited before its children, and children are visited in sorted order, so the words come out in **lexicographic order** for free. That is [LeetCode 386](https://leetcode.com/problems/lexicographical-numbers/): insert `"1"` through `str(n)` and read them back. The `sorted` matters, because a `defaultdict` iterates in insertion order, not alphabetical order.

### A file system is a trie over path names {#trie-file-system}

Look at a path like `/a/b/c/d` with the trie in mind. It is a word whose letters are the names `a`, `b`, `c`, `d`. Directories that share a parent share a prefix, exactly as `apple` and `apply` do. A file system is a trie in which the alphabet is the set of names. The node does not change, apart from swapping `exist` for what a path can be:

```python
class Node:
    def __init__(self):
        self.children = defaultdict(Node) # name -> node
        self.content = None               # None: a directory, str: a file
```

Walking a path is the insert loop, splitting on `/` instead of iterating over characters. Here the `defaultdict` trap from above becomes the feature: a walk that creates every missing node on the way down is `mkdir -p`.

```python
def _walk(self, path):
    node = self.root
    for name in path.split("/"):
        if name: node = node.children[name] # skips the "" before the leading "/"
    return node
```

Everything in [LeetCode 588](https://leetcode.com/problems/design-in-memory-file-system/) is then one walk plus one line. `mkdir` is the walk itself. `addContentToFile` walks to the file, creating its parents if needed, and appends to `content`. `readContentFromFile` returns it. `ls` on a directory returns `sorted(node.children)`, and `ls` on a file returns just its own name. [`FileSystem.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/strings/trie/FileSystem.py) is the whole class.

A creating walk is only right when the operation is allowed to create. [LeetCode 1166](https://leetcode.com/problems/design-file-system/) refuses to create a path whose parent is missing, so it has to walk the parent with `.get` and fail on `None`, the same rule as `search` above.

It is easy to copy the walk from 588 and add an `if node is None: return None` check, but that check can never fire, because `node.children[name]` always returns a node. The walk creates every path it was only meant to look up, and the answers go wrong in two ways:

```python
fs.createPath("/c/d", 1)  # True, should be False: the walk just created /c
fs.get("/x")              # -1, and /x now exists as an empty node
fs.createPath("/x", 5)    # False, should be True: "x" is already a child
```

Reading with `node.children.get(name)` fixes both. In [`1166.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/trie/1166.py), the only `[]` left is the line that creates the new node.

Questions about whole folders are DFS over this tree too. [LeetCode 1948](https://leetcode.com/problems/delete-duplicate-folders-in-system/) builds the same trie from a list of paths, then fingerprints each subtree bottom-up to find identical folders. That second half is [Merkle-style hashing](/blog/hashing/#xor-hashing).

## Persistent Trie {#persistent-trie}

The trie above has one current dictionary. Insert overwrites the path you walk, and the dictionary from a moment ago is gone. That is fine for "is this word in the set I have now." It is the wrong shape for "among the numbers I had inserted by time $$R$$, but not before time $$L$$, which one xors largest with $$x$$?"

The first instinct is to rebuild a trie on $$a[L..R]$$ for every query. Each rebuild copies up to $$n$$ numbers, and $$q$$ queries make that $$O(nq \cdot B)$$ for a $$B$$-bit word. With $$n, q \le 10^5$$ and $$B = 31$$, that is not a contest algorithm. The question that unblocks it is the same one as a [persistent segment tree](/blog/databases/#persistence): the new version differs from the old one along a single path, so copy that path and share every other node.

### A binary trie answers max-XOR in one greedy walk

Forget persistence for one paragraph. Store integers in a trie whose alphabet is $$\{0, 1\}$$, most significant bit at the root. Inserting $$x$$ walks its $$B$$ bits and creates a missing child when it has to. Each node remembers how many inserted numbers pass through it.

A maximum-XOR query is greedy and it does not backtrack. At bit $$i$$, the bit of $$x$$ is $$b$$. The opposite bit $$b \oplus 1$$ would contribute $$2^i$$ to the xor, so take that child if any number lives there. Otherwise take $$b$$. [LeetCode 421](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) is this walk with no ranges: the trie holds the whole array, and every query is "max xor with the set."

On two bits, the numbers $$1 = 01_2$$ and $$2 = 10_2$$. Query $$x = 0$$. The high bit of $$x$$ is $$0$$, and a $$1$$-child exists (that is where $$2$$ sits), so the answer takes it and sets bit $$1$$. The low bit of $$2$$ is $$0$$, and $$x$$ also wants the opposite of $$0$$ there, but that child is empty, so the walk stays on $$0$$ and does not set bit $$0$$. The answer is $$2$$, which is $$0 \oplus 2$$.

### Copy the path, keep the root

An update that inserts one number touches $$B$$ nodes. Allocate a fresh node for each of them. The fresh node copies its old children, then replaces the one child the bit actually descends into. The other child pointer still aims at the previous version's subtree. Bump the counter only on the fresh nodes.

Each version is a root. `roots[0]` is the empty trie. `roots[i + 1]` is the trie after inserting `a[i]`. Version $$i$$ and version $$i - 1$$ share almost every node; the new one owns $$B$$ nodes of its own. After $$n$$ inserts the memory is $$O(nB)$$, the same order as inserting into one trie, because the shared nodes are not duplicated.

This is full persistence. You can insert again starting from an old root and both branches stay readable. The subarray problem only ever extends the latest root, but the code does not get simpler if you assume that, so write the copy.

### A subarray is the difference of two counters

Numbers in the inclusive slice `a[L..R]` are exactly the numbers present in `roots[R + 1]` and absent from `roots[L]`. A child "exists in the slice" when

$$
\mathrm{cnt}(\text{right child}) - \mathrm{cnt}(\text{left child}) > 0.
$$

The greedy walk is unchanged. At each bit, prefer the opposite child when that difference is positive. Then step both versions down the child you took, so the next bit subtracts counters from the same branch.

That off-by-one is the bug this structure actually has. `roots[i]` means "the first $$i$$ numbers," so the slice `a[L..R]` is `(roots[L], roots[R + 1])`, not `(roots[L], roots[R])`.

The same counters support delete, which is what a mutable set wants: walk the bits and decrement. [USACO Guide's Set XOR-Min solution](https://usaco.guide/problems/ys-set-xor-min/solution) is that trie, minimizing instead of maximizing, with no versions. Persistence is what you add when the queries name a range rather than the current set. [CSES — Maximum Xor Subarray](https://cses.fi/problemset/task/1655) looks similar and is not this: it asks for a subarray of maximum xor, which is a trie (or a linear basis) over _prefix xors_, one version growing by one prefix at a time. Arbitrary $$[L, R]$$ windows against a query value $$x$$ are the persistent problem.

A string trie persists by the same copy, with a dictionary in place of two children. Versioned autocomplete is that tree. Contest problems almost always want the binary one, because the query has a reason to walk bits.

### Implementation

`insert` returns the new root and never writes into `prev`. `max_xor(left, right, x)` reads the slice that `right` added on top of `left`. `BITS` is $$31$$ so every non-negative 32-bit value fits with the sign bit left alone; widen it if the inputs can be larger.

```python
class Node:
    def __init__(self):
        self.child = [None, None]
        self.cnt = 0

BITS = 31

def clone(node):
    fresh = Node()
    if node is not None:
        fresh.child = node.child[:]   # share both subtrees; the caller replaces one
        fresh.cnt = node.cnt
    return fresh

def insert(prev, x):
    root = clone(prev)
    root.cnt += 1
    node = root
    for i in range(BITS - 1, -1, -1):
        bit = (x >> i) & 1
        node.child[bit] = clone(node.child[bit])
        node.child[bit].cnt += 1
        node = node.child[bit]
    return root

def build(a):
    roots = [None]                     # roots[i] = trie of a[0 : i]
    for x in a:
        roots.append(insert(roots[-1], x))
    return roots

def cnt(node):
    return 0 if node is None else node.cnt

def max_xor(left, right, x):
    if cnt(right) == cnt(left):
        return None                    # a[L..R] is empty
    ans = 0
    for i in range(BITS - 1, -1, -1):
        bit = (x >> i) & 1
        want = bit ^ 1
        have = cnt(right.child[want] if right else None) - cnt(left.child[want] if left else None)
        take = want if have > 0 else bit
        if take != bit:
            ans |= 1 << i
        left = left.child[take] if left else None
        right = right.child[take] if right else None
    return ans
```

`build([1, 2, 3])` then `max_xor(roots[0], roots[3], 0)` is $$3$$: the whole array, and $$0 \oplus 3 = 3$$ wins. `max_xor(roots[1], roots[2], 1)` looks only at $$a[1] = 2$$, and $$1 \oplus 2 = 3$$. Both calls share the nodes that `insert` did not have to copy.

### Complexity

- Each insert allocates $$O(B)$$ nodes and runs in $$O(B)$$.
- $$n$$ inserts: $$O(nB)$$ time and memory.
- A query walks $$B$$ bits and does $$O(1)$$ work per bit, so $$O(B)$$. It allocates nothing.
- $$B = 31$$ for 32-bit values. It is a constant, and it is also the only place the integer range enters the complexity.

> **The pattern worth naming.** Persistence here is path copying, the same move as a [persistent segment tree](/blog/databases/#persistence): share what did not change, copy what did, and let a root stand for a version. The trie-specific part is the counter. A range of versions is a subtraction of those counters, and the greedy bit walk reads the subtraction instead of a single `exist` bit.

## From the Notebook {#notebook}

Implementations from my [competitive programming notebook](https://github.com/lamng3/competitive-programming-notebook), tagged with their [USACO Guide](https://usaco.guide/) level where they have one.

- **Trie** (gold). [`Trie.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/strings/trie/Trie.py): Trie on a `defaultdict` node, with one DFS for search, prefix, wildcard, and collecting words. [`FileSystem.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/strings/trie/FileSystem.py): The same node over path names, for LeetCode 588. [`1166.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/trie/1166.py): LeetCode 1166, a walk that never creates. [`trie/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/trie): Trie solutions. The [persistent trie](#persistent-trie) above is the same node with the copy made explicit, so a missing child is no longer something `defaultdict` may invent.

## Practice {#practice}

**Trie**

- [LeetCode 208 — Implement Trie (Prefix Tree)](https://leetcode.com/problems/implement-trie-prefix-tree/)
- [LeetCode 211 — Design Add and Search Words Data Structure](https://leetcode.com/problems/design-add-and-search-words-data-structure/) (wildcard DFS)
- [LeetCode 386 — Lexicographical Numbers](https://leetcode.com/problems/lexicographical-numbers/) (collecting words in order)
- [LeetCode 1268 — Search Suggestions System](https://leetcode.com/problems/search-suggestions-system/) (collecting words)

**File systems**

- [LeetCode 588 — Design In-Memory File System](https://leetcode.com/problems/design-in-memory-file-system/)
- [LeetCode 1166 — Design File System](https://leetcode.com/problems/design-file-system/) (walk without creating)
- [LeetCode 1948 — Delete Duplicate Folders in System](https://leetcode.com/problems/delete-duplicate-folders-in-system/) (trie plus subtree hashing)

**Persistent trie**

- [LeetCode 421 — Maximum XOR of Two Numbers in an Array](https://leetcode.com/problems/maximum-xor-of-two-numbers-in-an-array/) (the greedy bit walk, one trie, no versions)
- [CSES — Maximum Xor Subarray](https://cses.fi/problemset/task/1655) (a trie of prefix xors; the range-window version of this query is the persistent one)
- [USACO Guide — Set XOR-Min](https://usaco.guide/problems/ys-set-xor-min/solution) (insert and delete by counters)

## Further reading {#further-reading}

**Trie**

- [USACO Guide — String Searching](https://usaco.guide/adv/string-search/): the trie chapter, then Aho–Corasick.

**Persistent trie**

- [USACO Guide — Persistent Data Structures](https://usaco.guide/adv/persistent): path copying, which this trie uses on a bit alphabet instead of a segment tree.
- [USACO Guide — String Searching](https://usaco.guide/adv/string-search/): binary tries for XOR, including Set XOR-Min. Persistence is the extra root per version on top of that walk.
