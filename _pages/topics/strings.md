---
layout: post
title: "Strings"
description: "Algorithms on strings. Equality questions over substrings belong to Hashing. Prefix questions belong to the trie, a tree of shared prefixes where every query is one DFS, and the same tree over path names is a file system."
permalink: /blog/strings/
last_updated: 2026-10-11
author: Lam Nguyen
toc:
  sidebar: right
---

Algorithms on strings. Equality questions over substrings belong to [Hashing](/blog/hashing/). Prefix questions belong to the [trie](#trie), and the same tree over path names is a file system.

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

A creating walk is only right when the operation is allowed to create. [LeetCode 1166](https://leetcode.com/problems/design-file-system/) refuses to create a path whose parent is missing, so it has to walk the parent with `.get` and fail on `None`, the same rule as `search` above. [`1166.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/trie/1166.py) does exactly that, and its only `[]` is the line that creates the new node. Questions about whole folders are DFS over this tree too. [LeetCode 1948](https://leetcode.com/problems/delete-duplicate-folders-in-system/) builds the same trie from a list of paths, then fingerprints each subtree bottom-up to find identical folders. That second half is [Merkle-style hashing](/blog/hashing/#xor-hashing).

## From the Notebook {#notebook}

Implementations from my [competitive programming notebook](https://github.com/lamng3/competitive-programming-notebook), tagged with their [USACO Guide](https://usaco.guide/) level where they have one.

- **Trie** (gold). [`Trie.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/strings/trie/Trie.py): Trie on a `defaultdict` node, with one DFS for search, prefix, wildcard, and collecting words. [`FileSystem.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/strings/trie/FileSystem.py): The same node over path names, for LeetCode 588. [`1166.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/trie/1166.py): LeetCode 1166, a walk that never creates. [`trie/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/trie): Trie solutions.

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
