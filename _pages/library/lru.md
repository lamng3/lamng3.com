---
layout: template
title: "LRU Cache"
description: "LRU Cache in C++, from my competitive programming notebook."
permalink: /library/lru/
slug: lru
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include "eviction_cache.h"

class LRUCache : public EvictionCache {
private:
    struct Node {
        int key;
        int value;
        Node* prev;
        Node* next;
        Node() : key(-1), value(-1), prev(nullptr), next(nullptr) {}
        Node(int k, int v) : key(k), value(v), prev(nullptr), next(nullptr) {}
    };

    Node* head;
    Node* tail;
    int capacity;
    unordered_map<int, Node*> nodeMap;

    void moveToHead(Node* node) {
        if (node->prev != nullptr) node->prev->next = node->next;
        if (node->next != nullptr) node->next->prev = node->prev;

        Node* nextHead = head->next;
        head->next = node;
        node->prev = head;
        node->next = nextHead;
        if (nextHead != nullptr) nextHead->prev = node;
    }

    Page evict() {
        if ((int)nodeMap.size() <= capacity) return {};

        Node* removeNode = tail->prev;
        if (removeNode == head) return {};

        Node* prevRemoveNode = removeNode->prev;
        prevRemoveNode->next = tail;
        tail->prev = prevRemoveNode;

        Page evicted{removeNode->key, removeNode->value, true};
        nodeMap.erase(removeNode->key);
        delete removeNode;
        return evicted;
    }

public:
    LRUCache(int cap) : capacity(cap) {
        head = new Node();
        tail = new Node();
        head->next = tail;
        tail->prev = head;
    }

    ~LRUCache() override {
        Node* cur = head;
        while (cur != nullptr) {
            Node* nxt = cur->next;
            delete cur;
            cur = nxt;
        }
    }

    string name() const override { return "LRU"; }

    Page get(int key) override {
        if (!nodeMap.count(key)) return {};
        moveToHead(nodeMap[key]);
        return {key, nodeMap[key]->value, true};
    }

    Page put(int key, int value) override {
        if (nodeMap.count(key)) {
            nodeMap[key]->value = value;
            moveToHead(nodeMap[key]);
        } else {
            Node* newNode = new Node(key, value);
            nodeMap[key] = newNode;
            moveToHead(newNode);
        }
        return evict();
    }
};
```
{% endraw %}

</div>
