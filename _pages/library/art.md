---
layout: template
title: "ART"
description: "ART in Python, from my competitive programming notebook."
permalink: /library/art/
slug: art
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from bisect import insort

TERM = "\0" # ends every key, so no key is a prefix of another
SIZES = (4, 16, 48, 256)

class TrieNode:
    def __init__(self, size: int = 4, content: str = "", end: bool = False, children: dict = None, keys: list = None):
        self.size = size
        self.content = content
        self.children = {} if children is None else children
        self.keys = sorted(self.children) if keys is None else keys # edge chars in sorted order, for range scans
        self.end = end

class ART:
    def __init__(self):
        self.root = None

    def isLeaf(self, node: TrieNode) -> bool:
        """check if node is leaf"""
        return node.end

    def loadKey(self, leaf: TrieNode) -> str:
        """load content in leaf"""
        return leaf.content

    def leafMatches(self, leaf: TrieNode, key: str, depth: int) -> bool:
        """compare key from depth onward"""
        return self.loadKey(leaf)[depth:] == key[depth:]

    def checkPrefix(self, node: TrieNode, key: str, depth: int) -> int:
        """longest prefix match"""
        p = 0
        while p < len(node.content) and node.content[p] == key[depth + p]:
            p += 1
        return p

    def findChild(self, node: TrieNode, c: str) -> TrieNode:
        """get child node"""
        return node.children.get(c)

    def isFull(self, node: TrieNode) -> bool:
        """check if node is full"""
        return len(node.children) == node.size

    def grow(self, node: TrieNode) -> None:
        """grow node to next size"""
        node.size = SIZES[SIZES.index(node.size) + 1]

    def addChild(self, node: TrieNode, c: str, child: TrieNode) -> None:
        """add a child to node"""
        if c not in node.children: insort(node.keys, c)
        node.children[c] = child

    def replace(self, node: TrieNode, new: TrieNode) -> None:
        """node becomes new, in place, so its parent needs no update"""
        node.size, node.content, node.children, node.keys, node.end = new.size, new.content, new.children, new.keys, new.end

    def _insert(self, node: TrieNode, key: str, leaf: TrieNode, depth: int) -> None:
        if node is None: # empty tree
            self.root = leaf
            return
        if self.isLeaf(node):
            if self.leafMatches(node, key, depth): return # key already stored
            key2 = self.loadKey(node)
            i = depth
            while key[i] == key2[i]: i += 1 # key[depth:i] matches, key[i] and key2[i] differ
            new = TrieNode(4, key[depth:i]) # lazy expansion: matched part becomes the new parent
            self.addChild(new, key[i], leaf)
            self.addChild(new, key2[i], TrieNode(4, key2, True)) # a copy, node is about to be replaced
            self.replace(node, new)
            return
        p = self.checkPrefix(node, key, depth)
        if p != len(node.content): # path compression: split node.content at p
            new = TrieNode(4, node.content[:p]) # new parent takes content[:p]
            tail = TrieNode(node.size, node.content[p + 1:], node.end, node.children, node.keys) # content[p] is now the edge char
            self.addChild(new, key[depth + p], leaf)
            self.addChild(new, node.content[p], tail)
            self.replace(node, new)
            return
        depth += len(node.content) # content fully matched
        c = key[depth]
        nextNode = self.findChild(node, c)
        if nextNode is not None:
            self._insert(nextNode, key, leaf, depth + 1)
        else:
            if self.isFull(node): self.grow(node)
            self.addChild(node, c, leaf)

    def insert(self, word: str) -> None:
        key = word + TERM
        self._insert(self.root, key, TrieNode(4, key, True), 0)

    def _search(self, node: TrieNode, key: str, depth: int) -> bool:
        if node is None: return False
        if self.isLeaf(node): return self.leafMatches(node, key, depth)
        if self.checkPrefix(node, key, depth) != len(node.content): return False
        depth += len(node.content)
        return self._search(self.findChild(node, key[depth]), key, depth + 1)

    def search(self, word: str) -> bool:
        return self._search(self.root, word + TERM, 0)

    def startsWith(self, prefix: str) -> bool:
        if not prefix: return True
        node, depth = self.root, 0
        while node is not None:
            if self.isLeaf(node): return self.loadKey(node).startswith(prefix)
            rest = prefix[depth:]
            if len(rest) <= len(node.content): return node.content.startswith(rest)
            if self.checkPrefix(node, prefix, depth) != len(node.content): return False
            depth += len(node.content)
            node = self.findChild(node, prefix[depth])
            depth += 1
        return False
```
{% endraw %}

</div>
