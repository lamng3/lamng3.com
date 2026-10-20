---
layout: template
title: "FIFO Cache"
description: "FIFO Cache in C++, from my competitive programming notebook."
permalink: /library/fifo/
slug: fifo
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include "eviction_cache.h"

class FIFOCache : public EvictionCache {
private:
    struct Node {
        int key;
        int value;
        Node* prev;
        Node* next;
        Node() : key(-1), value(-1), prev(nullptr), next(nullptr) {}
        Node(int k, int v) : key(k), value(v), prev(nullptr), next(nullptr) {}
    };

    int capacity;
    unordered_map<int, Node*> nodeMap;
    queue<Node*> nodeQueue;

    Page evict() {
        if ((int)nodeQueue.size() <= capacity) return {};

        Node* removeNode = nodeQueue.front();
        nodeQueue.pop();

        Page evicted{removeNode->key, removeNode->value, true};
        nodeMap.erase(removeNode->key);
        delete removeNode;
        return evicted;
    }

public:
    FIFOCache(int cap) : capacity(cap) {}

    ~FIFOCache() override {
        nodeMap.clear();
        while (!nodeQueue.empty()) {
            Node* cur = nodeQueue.front();
            nodeQueue.pop();
            delete cur;
        }
    }

    string name() const override { return "FIFO"; }

    Page get(int key) override {
        if (!nodeMap.count(key)) return {};
        return {key, nodeMap[key]->value, true};
    }

    Page put(int key, int value) override {
        if (nodeMap.count(key)) {
            nodeMap[key]->value = value;
        } else {
            Node* newNode = new Node(key, value);
            nodeMap[key] = newNode;
            nodeQueue.push(newNode);
        }
        return evict();
    }
};
```
{% endraw %}

</div>
