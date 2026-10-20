---
layout: template
title: "Trie"
description: "Trie in Python, from my competitive programming notebook."
permalink: /library/trie/
slug: trie
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from collections import defaultdict


class TrieNode:
    def __init__(self):
        self.children = defaultdict(TrieNode) # a missing child is created on first touch
        self.exist = False                    # a word ends here


class Trie:

    def __init__(self):
        self.root = TrieNode()

    def insert(self, word: str) -> None:
        node = self.root
        for c in word:
            node = node.children[c]
        node.exist = True

    # one DFS answers every query: i letters of word matched, standing on node
    def _dfs(self, word: str, i: int, node: TrieNode, prefix: bool) -> bool:
        if i == len(word):
            return prefix or node.exist
        if word[i] == ".": # wildcard: try every child
            return any(self._dfs(word, i + 1, child, prefix) for child in node.children.values())
        child = node.children.get(word[i]) # .get, so a failed search adds nothing
        return child is not None and self._dfs(word, i + 1, child, prefix)

    def search(self, word: str) -> bool:
        return self._dfs(word, 0, self.root, False)

    def startsWith(self, prefix: str) -> bool:
        return self._dfs(prefix, 0, self.root, True)

    # every word that starts with prefix, in sorted order
    def words(self, prefix: str = "") -> list:
        node = self.root
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

# Your Trie object will be instantiated and called as such:
# obj = Trie()
# obj.insert(word)
# param_2 = obj.search(word)       "." matches any one letter
# param_3 = obj.startsWith(prefix)
# param_4 = obj.words(prefix)
```
{% endraw %}

</div>
