---
layout: template
title: "Sparse Segment Tree"
description: "Sparse Segment Tree in C++ and Python, from my competitive programming notebook."
permalink: /library/sparsesegmenttree/
slug: sparsesegmenttree
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

struct SparseST {
    struct Node {
        int lazy = -1;
        int tracked = 0;
        Node* left = nullptr;
        Node* right = nullptr;
    };

    int N;
    Node* root;

    SparseST(int n) {
        N = n;
        root = new Node();
    }

    void apply(Node* node, int tl, int tr, int val) {
        node->tracked = val * (tr - tl + 1);
        node->lazy = val;
    }

    void push(Node* node, int tl, int tr) {
        // children first: update and query step into them even with nothing to push
        if (!node->left) node->left = new Node();
        if (!node->right) node->right = new Node();
        if (node->lazy == -1) return;
        int tm = tl + (tr - tl) / 2;
        apply(node->left, tl, tm, node->lazy);
        apply(node->right, tm + 1, tr, node->lazy);
        node->lazy = -1;
    }

    void update(Node* node, int tl, int tr, int ql, int qr, int val) {
        if (ql > qr) return;
        if (ql == tl && tr == qr) {
            apply(node, tl, tr, val);
            return;
        }
        push(node, tl, tr);
        int tm = tl + (tr - tl) / 2;
        update(node->left, tl, tm, ql, min(tm, qr), val);
        update(node->right, tm + 1, tr, max(tm + 1, ql), qr, val);
        node->tracked = node->left->tracked + node->right->tracked;
    }

    int query(Node* node, int tl, int tr, int ql, int qr) {
        if (ql > qr) return 0;
        if (ql == tl && tr == qr) return node->tracked;
        push(node, tl, tr);
        int tm = tl + (tr - tl) / 2;
        int left = query(node->left, tl, tm, ql, min(tm, qr));
        int right = query(node->right, tm + 1, tr, max(tm + 1, ql), qr);
        return left + right;
    }

    void update(int ql, int qr, int val) {
        update(root, 0, N - 1, ql, qr, val);
    }

    int query(int ql, int qr) {
        return query(root, 0, N - 1, ql, qr);
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
# Range assign, range sum over [0, N) for huge N: a node exists only once it is visited.


class Node:
    __slots__ = ("lazy", "tracked", "left", "right")

    def __init__(self):
        self.lazy = None # pending assignment for the whole segment
        self.tracked = 0 # sum of the segment
        self.left = None
        self.right = None


class SparseST:
    def __init__(self, n: int):
        self.N = n
        self.root = Node()

    def apply(self, node: Node, tl: int, tr: int, val) -> None:
        node.tracked = val * (tr - tl + 1)
        node.lazy = val

    def push(self, node: Node, tl: int, tr: int) -> None:
        if node.left is None: node.left = Node()
        if node.right is None: node.right = Node()
        if node.lazy is None: return
        tm = tl + (tr - tl) // 2
        self.apply(node.left, tl, tm, node.lazy)
        self.apply(node.right, tm + 1, tr, node.lazy)
        node.lazy = None

    # set a[ql..qr] = val
    def update(self, ql: int, qr: int, val, node: Node = None, tl: int = 0, tr: int = None) -> None:
        if node is None: node, tr = self.root, self.N - 1
        if ql > qr: return
        if ql == tl and tr == qr:
            self.apply(node, tl, tr, val)
            return
        self.push(node, tl, tr)
        tm = tl + (tr - tl) // 2
        self.update(ql, min(tm, qr), val, node.left, tl, tm)
        self.update(max(tm + 1, ql), qr, val, node.right, tm + 1, tr)
        node.tracked = node.left.tracked + node.right.tracked

    # sum of a[ql..qr]
    def query(self, ql: int, qr: int, node: Node = None, tl: int = 0, tr: int = None):
        if node is None: node, tr = self.root, self.N - 1
        if ql > qr: return 0
        if ql == tl and tr == qr: return node.tracked
        if node.left is None and node.lazy is None: return 0 # untouched: all zero
        self.push(node, tl, tr)
        tm = tl + (tr - tl) // 2
        left = self.query(ql, min(tm, qr), node.left, tl, tm)
        right = self.query(max(tm + 1, ql), qr, node.right, tm + 1, tr)
        return left + right
```
{% endraw %}

</div>
