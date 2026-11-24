---
layout: template
title: "Persistent Trie"
description: "Persistent Trie in Python, from my competitive programming notebook."
permalink: /library/persistenttrie/
slug: persistenttrie
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from collections import defaultdict

class TrieNode:
    def __init__(self, children: dict = None, end: bool = None):
        self.children = {} if children is None else children
        self.end = False if end is None else end

class PersistentTrie:
    def __init__(self):
        self.roots = [TrieNode()]

    def current_version(self) -> int:
        return len(self.roots)-1

    def snapshot(self) -> TrieNode:
        return self.roots[-1]

    def insert(self, word: str, version: int = None) -> int:
        if version is None:
            version = self.current_version()

        root = self.roots[version]
        nroot = TrieNode(dict(root.children), root.end) # copy the dict, or the old version would change too

        node = nroot
        for c in word:
            ochild = node.children.get(c)
            if ochild is not None:
                nchild = TrieNode(dict(ochild.children), ochild.end)
            else:
                nchild = TrieNode()
            node.children[c] = nchild
            node = nchild
        node.end = True

        self.roots.append(nroot)
        return self.current_version()

    # erase creates a new version
    def erase(self, word: str, version: int = None) -> int:
        if version is None:
            version = self.current_version()
        if not self.search(word, version):
            return None

        root = self.roots[version]
        nroot = TrieNode(dict(root.children), root.end)

        node = nroot
        par_stack = []
        for c in word:
            ochild = node.children[c]
            nchild = TrieNode(dict(ochild.children), ochild.end)
            node.children[c] = nchild
            par_stack.append((node, c))
            node = nchild
        node.end = False

        while par_stack:
            parent, c = par_stack.pop()
            child = parent.children[c]
            # only delete if a root-to-leaf path
            if not child.children and not child.end:
                del parent.children[c]

        self.roots.append(nroot)
        return self.current_version()

    def search(self, word: str, version: int = None) -> bool:
        if version is None:
            version = self.current_version()
        node = self.roots[version]
        for c in word:
            if c not in node.children:
                return False
            node = node.children[c]
        return node.end

    def starts_with(self, prefix: str, version: int = None) -> bool:
        if version is None:
            version = self.current_version()
        node = self.roots[version]
        for c in prefix:
            if c not in node.children:
                return False
            node = node.children[c]
        return True
```
{% endraw %}

</div>
