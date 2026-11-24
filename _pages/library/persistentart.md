---
layout: template
title: "Persistent ART"
description: "Persistent ART in Python, from my competitive programming notebook."
permalink: /library/persistentart/
slug: persistentart
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
class TrieNode:
    def __init__(self, size: int = 4, content: str = "", end: bool = False, children: dict = None):
        self.size = size
        self.content = content
        self.children = {} if children is None else children
        self.end = end

SIZES = (4, 16, 48, 256)

# copy a node and its children dict, the children themselves stay shared
def copy(node: TrieNode) -> TrieNode:
    return TrieNode(node.size, node.content, node.end, dict(node.children))

class PersistentART:
    def __init__(self):
        self.roots = [TrieNode(4)]

    def current_version(self) -> int:
        return len(self.roots)-1

    def snapshot(self) -> TrieNode:
        return self.roots[-1]

    def findChild(self, node: TrieNode, c: str) -> TrieNode:
        return node.children.get(c)

    def _addChild(self, node: TrieNode, c: str, child: TrieNode) -> None:
        if len(node.children) == node.size:
            node.size = SIZES[SIZES.index(node.size) + 1]
        node.children[c] = child

    # insert creates a new version
    def insert(self, word: str, version: int = None) -> int:
        if version is None:
            version = self.current_version()

        nroot = copy(self.roots[version])
        node, i = nroot, 0 # node is always a fresh copy, so it is safe to change
        while True:
            content = node.content
            p = 0
            while p < len(content) and i + p < len(word) and content[p] == word[i + p]:
                p += 1
            if p < len(content): # path compression: split the compressed path at p
                tail = TrieNode(node.size, content[p + 1:], node.end, node.children)
                node.content = content[:p]
                node.children = {content[p]: tail}
                node.size, node.end = 4, False
            i += p
            if i == len(word):
                node.end = True
                break
            c = word[i]
            child = self.findChild(node, c)
            if child is None: # lazy expansion: one leaf keeps the rest of the word
                self._addChild(node, c, TrieNode(4, word[i + 1:], True))
                break
            nchild = copy(child)
            node.children[c] = nchild
            node, i = nchild, i + 1

        self.roots.append(nroot)
        return self.current_version()

    def _removeChild(self, node: TrieNode, c: str) -> None:
        del node.children[c]
        node.size = next(s for s in SIZES if s >= len(node.children))

    # path compression: a node with no word and one child merges into that child
    def _collapse(self, node: TrieNode) -> None:
        if node.end or len(node.children) != 1: return
        c, child = next(iter(node.children.items()))
        node.content += c + child.content
        node.children, node.end, node.size = dict(child.children), child.end, child.size

    # erase creates a new version
    def erase(self, word: str, version: int = None) -> int:
        if version is None:
            version = self.current_version()
        if not self.search(word, version):
            return None

        nroot = copy(self.roots[version])
        node, i = nroot, 0
        par_stack = []
        while True:
            i += len(node.content)
            if i == len(word): break
            c = word[i]
            nchild = copy(node.children[c])
            node.children[c] = nchild
            par_stack.append((node, c))
            node, i = nchild, i + 1
        node.end = False
        if not node.children and par_stack:
            parent, c = par_stack.pop()
            self._removeChild(parent, c)
            node = parent
        if node is not nroot:
            self._collapse(node)

        self.roots.append(nroot)
        return self.current_version()

    def search(self, word: str, version: int = None) -> bool:
        if version is None:
            version = self.current_version()
        node, i = self.roots[version], 0
        while True:
            if not word.startswith(node.content, i): return False
            i += len(node.content)
            if i == len(word): return node.end
            node = self.findChild(node, word[i])
            if node is None: return False
            i += 1

    def startsWith(self, prefix: str, version: int = None) -> bool:
        if version is None:
            version = self.current_version()
        node, i = self.roots[version], 0
        while True:
            rest = prefix[i:]
            if len(rest) <= len(node.content): return node.content.startswith(rest)
            if not rest.startswith(node.content): return False
            i += len(node.content)
            node = self.findChild(node, prefix[i])
            if node is None: return False
            i += 1
```
{% endraw %}

</div>
