---
layout: template
title: "ARTIterator"
description: "ARTIterator in Python, from my competitive programming notebook."
permalink: /library/artiterator/
slug: artiterator
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from bisect import bisect_left
from ART import ART, TERM, TrieNode

class ARTIterator:
    """sorted iterator, starts at the first word >= word (> word if after)"""
    def __init__(self, art: ART, word: str, after: bool = False):
        self.stack = [] # path from root to leaf: [node, keys, next child index]
        self.leaf = self._seek(art.root, word + TERM + (TERM if after else ""))

    def _leftmost(self, node: TrieNode) -> TrieNode:
        """go down to the smallest leaf"""
        while not node.end:
            self.stack.append([node, node.keys, 1])
            node = node.children[node.keys[0]]
        return node

    def _next(self) -> TrieNode:
        """go up to an ancestor with an unvisited child, then down"""
        while self.stack:
            node, keys, i = self.stack.pop()
            if i < len(keys):
                self.stack.append([node, keys, i + 1]) # child i is visited
                return self._leftmost(node.children[keys[i]])
        return None

    def _seek(self, node: TrieNode, lo: str) -> TrieNode:
        """first leaf with key >= lo"""
        depth = 0
        while node is not None:
            if node.end:
                return node if node.content >= lo else self._next()
            part = lo[depth:depth + len(node.content)]
            if node.content != part: # whole subtree is on one side of lo
                return self._leftmost(node) if node.content > part else self._next()
            depth += len(node.content)
            c = lo[depth]
            j = bisect_left(node.keys, c) # first edge >= c
            if j < len(node.keys) and node.keys[j] == c:
                self.stack.append([node, node.keys, j + 1])
                node = node.children[c]
                depth += 1
            else:
                self.stack.append([node, node.keys, j]) # _next goes to child j, or up
                return self._next()
        return None

    def hasNext(self) -> bool:
        return self.leaf is not None

    def next(self) -> str:
        word = self.leaf.content[:-1] # drop TERM
        self.leaf = self._next()
        return word

class RangeIter:
    """sorted iterator over the words s with lo <= s <= hi"""
    def __init__(self, art: ART, lo: str, hi: str):
        self.low = ARTIterator(art, lo) # first word >= lo
        self.high = ARTIterator(art, hi, True) # first word > hi, the end

    def hasNext(self) -> bool:
        if not self.low.hasNext(): return False
        return not self.high.hasNext() or self.low.leaf.content < self.high.leaf.content

    def next(self) -> str:
        return self.low.next()
```
{% endraw %}

</div>
