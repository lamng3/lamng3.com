---
layout: template
title: "Quadtree"
description: "Quadtree in Python, from my competitive programming notebook."
permalink: /library/quadtree/
slug: quadtree
---

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
class Node:
    def __init__(self, r0, c0, r1, c1):
        self.r0, self.c0, self.r1, self.c1 = r0, c0, r1, c1
        self.sum = 0
        self.children = []

class QuadTree:
    def __init__(self, grid):
        self.g = grid
        self.root = self.build(0, 0, len(grid)-1, len(grid[0])-1)

    def build(self, r0, c0, r1, c1):
        node = Node(r0, c0, r1, c1)
        if r0 == r1 and c0 == c1:
            node.sum = self.g[r0][c0]
            return node
        rm, cm = (r0 + r1) // 2, (c0 + c1) // 2
        for a, b, c, d in [(r0, c0, rm, cm), (r0, cm + 1, rm, c1),
                           (rm + 1, c0, r1, cm), (rm + 1, cm + 1, r1, c1)]:
            if a <= c and b <= d: # skip empty quadrants
                node.children.append(self.build(a, b, c, d))
        node.sum = sum(child.sum for child in node.children)
        return node

    def update(self, r, c, v, node=None):
        if node is None: node = self.root
        if not (node.r0 <= r <= node.r1 and node.c0 <= c <= node.c1): return
        if not node.children:
            node.sum = v
            return
        for child in node.children: self.update(r, c, v, child)
        node.sum = sum(child.sum for child in node.children)

    def query(self, r0, c0, r1, c1, node=None):
        if node is None: node = self.root
        if node.r1 < r0 or r1 < node.r0 or node.c1 < c0 or c1 < node.c0: return 0
        if r0 <= node.r0 and node.r1 <= r1 and c0 <= node.c0 and node.c1 <= c1: return node.sum
        return sum(self.query(r0, c0, r1, c1, child) for child in node.children)
```
{% endraw %}

</div>
