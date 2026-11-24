---
layout: template
title: "Adaptive Radix Trie"
description: "Adaptive Radix Trie in Python, from my competitive programming notebook."
permalink: /library/adaptiveradixtrie/
slug: adaptiveradixtrie
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from collections import defaultdict

class TrieNode:
    def __init__(self, size: int = 4, content: str = "", end: bool = False):
        self.size = size
        self.content = content
        self.children = defaultdict(TrieNode)
        self.end = end

class ART:
    def __init__(self, children: defaultdict[TrieNode] = None):
        self.root = TrieNode(4)

    def insert(self, word: str):
        pass
```
{% endraw %}

</div>
