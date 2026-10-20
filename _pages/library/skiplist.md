---
layout: template
title: "Skip List"
description: "Skip List in C++ and Python, from my competitive programming notebook."
permalink: /library/skiplist/
slug: skiplist
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
/*
HW: show that memory references of a node is consistent
*/
#pragma once
#include <bits/stdc++.h>
#include "utils/hash.h"
using namespace std;

class SkipList {
private:
    struct Node {
        int key;
        int value;
        // next[i] = next node at level i
        vector<Node*> next;
        Node(int k, int v, int lvl) : key(k), value(v) {
            next.resize(lvl+1, nullptr);
        }
    };

    int toss() { 
        static std::mt19937 rng(std::random_device{}());
        int lvl = 0;
        while ((rng() & 1u) && lvl < MAX_LEVEL - 1) {
            lvl++;
        }
        return lvl;
    }

    const int MAX_LEVEL = 16;

    Node* head;
    int curr_mx_lvl;

public:
    SkipList() {
        head = new Node(-1, -1, MAX_LEVEL);
        curr_mx_lvl = 0;
    }

    int find(int key) {
        Node* curr = head;

        // each i is node moving down
        for (int i = curr_mx_lvl; i >= 0; i--) {
            // move right while has next node and next node has key < current search key
            while (curr->next[i] != nullptr && curr->next[i]->key < key) {
                curr = curr->next[i];
            }
        }

        // we are at level 0
        // since condition is curr->next[i]->key < key
        // we can safely move curr to next
        curr = curr->next[0];

        if (curr != nullptr && curr->key == key) {
            return curr->value;
        }

        return -1;
    }

    /* 
        left neighbor node for every level
            e.g. (k, v) with k < key
        motivation behind this is each node, even though it is the same curr
            has different address in the memory, so updating using the last curr
            will result in pointers being misplaced everywhere
        also curr is correct if we update only level 0

        if current node is higher than current max level, its left is head

        https://www.cs.cmu.edu/~ckingsf/bioinfo-lectures/skiplists.pdf (slides 20)
            each node is 1 address referenced many times with the pointers
                1 big node, instead of fragmented copies of a node
            we will be adding the node to the levels as high as max of 2 neighbors
                or we have reached maximum level of the node
    */
    void insert(int key, int value) {
        Node* curr = head;

        vector<Node*> left(MAX_LEVEL, nullptr);

        for (int i = curr_mx_lvl; i >= 0; i--) {
            while (curr->next[i] != nullptr && curr->next[i]->key < key) {
                curr = curr->next[i];
            }
            left[i] = curr;
        }

        curr = curr->next[0];

        if (curr != nullptr && curr->key == key) {
            curr->value = value;
            // We don't propagate changes up because SkipList
            // only update in a single place (leaf node)
            return;
        }

        int node_lvl = toss();

        if (node_lvl > curr_mx_lvl) {
            for (int i = curr_mx_lvl+1; i <= node_lvl; i++) {
                left[i] = head;
            }
            curr_mx_lvl = node_lvl;
        }

        Node* newNode = new Node(key, value, node_lvl);

        for (int i = 0; i <= node_lvl; i++) {
            Node* nxt = left[i]->next[i];
            left[i]->next[i] = newNode;
            newNode->next[i] = nxt;
        }
    }

    int remove(int key) {
        Node* curr = head;

        vector<Node*> left(MAX_LEVEL, nullptr);

        for (int i = curr_mx_lvl; i >= 0; i--) {
            while (curr->next[i] != nullptr && curr->next[i]->key < key) {
                curr = curr->next[i];
            }
            left[i] = curr;
        }

        Node* target = curr->next[0];
        if (target == nullptr || target->key != key) {
            return 0;
        }

        for (int i = 0; i <= curr_mx_lvl; i++) {
            if (left[i]->next[i] != target) {
                break;
            }
            left[i]->next[i] = target->next[i];
        }

        delete target;
        return 1;
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
import random

LEVELS = 16

class Node:
    def __init__(self, value, level):
        self.value = value
        self.next = [None] * level # next[i] = next node at level i

class Skiplist:

    def __init__(self):
        self.head = Node(-1, LEVELS) # sentinel node

    def _toss(self):
        level = 1
        while random.random() < 0.5 and level < LEVELS:
            level += 1
        return level

    # last node with value < x at every level
    def _left(self, x):
        left, cur = [None] * LEVELS, self.head
        for i in reversed(range(LEVELS)):
            while cur.next[i] and cur.next[i].value < x:
                cur = cur.next[i]
            left[i] = cur
        return left

    def search(self, target: int) -> bool:
        node = self._left(target)[0].next[0]
        return node is not None and node.value == target

    def add(self, num: int) -> None:
        left = self._left(num)
        node = Node(num, self._toss())
        for i in range(len(node.next)):
            node.next[i] = left[i].next[i]
            left[i].next[i] = node

    def erase(self, num: int) -> bool:
        left = self._left(num)
        node = left[0].next[0]
        if node is None or node.value != num:
            return False
        for i in range(len(node.next)):
            if left[i].next[i] is node:
                left[i].next[i] = node.next[i]
        return True

# Your Skiplist object will be instantiated and called as such:
# obj = Skiplist()
# param_1 = obj.search(target)
# obj.add(num)
# param_3 = obj.erase(num)
```
{% endraw %}

</div>
