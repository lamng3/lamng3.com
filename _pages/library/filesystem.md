---
layout: template
title: "File System Trie"
description: "File System Trie in Python, from my competitive programming notebook."
permalink: /library/filesystem/
slug: filesystem
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from collections import defaultdict


class Node:
    def __init__(self):
        self.children = defaultdict(Node) # name -> node
        self.content = None               # None: a directory, str: a file


class FileSystem:

    def __init__(self):
        self.root = Node()

    # follow a path one name at a time, creating what is missing (mkdir -p)
    def _walk(self, path: str) -> Node:
        node = self.root
        for name in path.split("/"):
            if name: node = node.children[name]
        return node

    def ls(self, path: str) -> list:
        node = self._walk(path)
        if node.content is not None: # a file lists itself
            return [path.split("/")[-1]]
        return sorted(node.children)

    def mkdir(self, path: str) -> None:
        self._walk(path)

    def addContentToFile(self, filePath: str, content: str) -> None:
        node = self._walk(filePath)
        node.content = (node.content or "") + content

    def readContentFromFile(self, filePath: str) -> str:
        return self._walk(filePath).content

# Your FileSystem object will be instantiated and called as such:
# obj = FileSystem()
# param_1 = obj.ls(path)
# obj.mkdir(path)
# obj.addContentToFile(filePath, content)
# param_4 = obj.readContentFromFile(filePath)
```
{% endraw %}

</div>
