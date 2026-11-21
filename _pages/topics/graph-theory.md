---
layout: post
title: "Graph Theory"
description: "Graph theory for competitive programming and beyond: the facts the other pages prove on the way, gathered by idea; the Steiner tree, forced on a tree and found on a graph with few terminals by a DP over subsets; and connectivity from the ground up, in parallel and under batches of edge insertions and deletions, from spanning forests and work and span to Euler tour trees and batch-dynamic connectivity."
permalink: /blog/graph-theory/
last_updated: 2026-11-21
author: Lam Nguyen
toc:
  sidebar: right
---

Graph theory for competitive programming. The other pages prove a fair amount of it on the way to something else, so the first section gathers those facts by idea. The Steiner tree is the cheapest way to connect chosen vertices. On a tree it is forced, and walking the terminals in DFS order measures it. On a graph with few terminals, a DP over subsets finds it.

The last three sections build one algorithm from the ground up: keeping track of which vertices are connected while batches of edges are inserted and deleted, with many processors working at once. [Spanning Forests](#spanning-forests) proves the graph theory it rests on. [Parallel Connectivity](#parallel-connectivity) measures parallel algorithms by work and span and finds the components of a fixed graph by contracting it. [Batch-Dynamic Connectivity](#batch-dynamic-connectivity) stores the forest in Euler tour trees, finds replacement edges with levels, and processes a whole batch in parallel.

<details markdown="1">
<summary>C++ template used by every implementation on this page</summary>

Each implementation below starts after this header. A snippet that needs a different modulus defines its own `MOD` in place of this one.

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using ull = unsigned long long;
using u32 = uint32_t;
using u64 = uint64_t;
using i64 = int64_t;
using i128 = __int128;
using u128 = unsigned __int128;

using vi = vector<int>;
using vii = vector<vector<int>>;
using pii = pair<int, int>;

#define REP(i, n) for (int i = 0; i < (n); i++)
#define FOR(i, a, b) for (int i = (a); i <= (b); i++)
#define FORD(i, a, b) for (int i = (a); i >= (b); i--)
#define RFOR(i, n) for (int i = (n) - 1; i >= 0; i--)

#define all(x) (x).begin(), (x).end()
#define sz(x) (int)((x).size())

#define fi first
#define se second
#define pb push_back

const int INF = 1e9+7;
const int MOD = 1e9+7;

mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());
```

</details>

## Graph Theory Across the Site {#across-the-site}

Each fact below is proved or used somewhere else on the site. Here they are in one place, grouped by idea, with a link to where each one does its work.

### Trees and walks

- **A tree has exactly one path between any two vertices.** So on a tree, the cheapest way to connect some vertices is not a choice. [Steiner Tree](#steiner-tree)
- **Every tree with at least two vertices has at least two leaves.** The ends of a longest path can't have any other neighbor. [LCA in O(1), Step 1](/blog/graphs-and-trees/#farach-colton-bender)
- **A tree with an edge has no Euler tour, but doubling every edge gives it one.** A closed walk that uses each edge once needs every degree to be even, and a leaf has degree $$1$$. A DFS walks the doubled tree, down and back up each edge. [LCA in O(1), Step 1](/blog/graphs-and-trees/#farach-colton-bender)
- **Two ways to flatten a tree.** Entry and exit times make each subtree a range. The full walk, which writes a vertex again after each child, makes each path a range. [Where the Euler tour fits](/blog/dynamic-programming/#dp-on-a-dag), [LCA in O(1), Step 1](/blog/graphs-and-trees/#farach-colton-bender)
- **DFS gives orders.** Reverse finishing order on a DAG is a topological order, and a tree DP runs in postorder, children before the parent. [DP on a DAG](/blog/dynamic-programming/#dp-on-a-dag)

### Ancestors and distances

- **LCA is a range minimum.** Over the Euler tour, the LCA of $$u$$ and $$v$$ is the shallowest vertex between them. Climbing, binary lifting, a sparse table, or Farach-Colton and Bender answers it. [LCA in O(1)](/blog/graphs-and-trees/#farach-colton-bender)
- **$$d(u, v) = W(u) + W(v) - 2\,W(\operatorname{lca}(u, v))$$**, with $$W$$ the weighted depth. [LeetCode 3553](/blog/graphs-and-trees/#lca-3553)
- **Range minimum on any array is an LCA** in the array's Cartesian tree, which closes the loop from RMQ to LCA to ±1 RMQ. [LCA in O(1)](/blog/graphs-and-trees/#farach-colton-bender)
- **The level ancestor**, the ancestor of $$v$$ at depth $$d$$, takes $$O(\log n)$$ with binary lifting, and $$O(1)$$ after $$O(n)$$ preprocessing is possible too. [LCA in O(1)](/blog/graphs-and-trees/#farach-colton-bender)

### Three vertices and more

- **Three paths share exactly one vertex**, the meeting vertex, and every other vertex lies on $$0$$ or $$2$$ of them. [Meeting Vertex](/blog/graphs-and-trees/#meeting-vertex)
- **Rooted, two of the three pairwise LCAs are equal**, and the deepest of them is the meeting vertex. [Meeting Vertex](/blog/graphs-and-trees/#meeting-vertex)
- **Each edge lies on $$0$$ or $$2$$ of the three paths**, so the smallest subtree joining three vertices weighs half the sum of their pairwise distances. [LeetCode 3553](/blog/graphs-and-trees/#lca-3553)
- **For any number of vertices, walk them in DFS order.** [Steiner Tree](#steiner-tree)

### Directed graphs and orders

- **A finite DAG always has a source.** Kahn's algorithm keeps taking vertices of indegree $$0$$. If it stalls, what is left contains a cycle. [Topological Order](/blog/graphs-and-trees/#topological-order), [Name the Query First](/blog/data-structure-design/#name-the-query)
- **Every DP is a DAG**, and a topological order evaluates it. That gives shortest and longest paths on a DAG in $$O(V + E)$$, negative weights included. [DP on a DAG](/blog/dynamic-programming/#dp-on-a-dag)
- **Collapsing each strongly connected component leaves a DAG**, the condensation. [DP on a DAG](/blog/dynamic-programming/#dp-on-a-dag)
- **A global order orients a tree.** When depth forces a direction on every edge, the root is the vertex of indegree $$0$$. [The Coloring Orients the Tree](/blog/graphs-and-trees/#colored-root)

### Searching and storing

- **BFS from many sources at once** gives every vertex its distance to the nearest source. Pruned to the vertices that get closer, it adds new sources to old distances and touches only what changes. [Xenia and Tree](/blog/graphs-and-trees/#xenia-and-tree)
- **A graph is a sparse matrix**, so adjacency lists fit in compressed sparse rows: one flat array of neighbors and one of offsets. A BFS over them ran more than five times faster than over a vector of vectors. [Compressed Sparse Row](/blog/databases/#compressed-sparse-row)

The code for these, from DSU to strongly connected components, is listed under [From the Notebook](/blog/graphs-and-trees/#notebook) on Graphs and Trees.

## Steiner Tree {#steiner-tree}

Two problems every contestant knows are the two ends of one problem. To connect two chosen vertices as cheaply as possible, you want a shortest path. To connect all of them, you want a minimum spanning tree. To connect some chosen set of vertices, the **terminals**, you want a **Steiner tree**: the cheapest connected subgraph that contains every terminal, free to pass through any other vertex when that helps.

### The problem

The input is a connected graph with positive edge weights and a set $$T$$ of $$k$$ terminals. The goal is a connected subgraph that contains every terminal, with the least total edge weight. The other vertices it uses are its **Steiner points**.

Steiner points are where the difficulty lives. Take three terminals $$a, b, c$$, joined pairwise by edges of weight $$2$$, and a fourth vertex $$s$$ joined to each of them by an edge of weight $$1$$:

```
         a
       / | \
      2  1  2
     /   |   \
    b -1- s -1- c
     \         /
      '---2---'
```

With terminals only, the best is two of the weight-$$2$$ edges, for $$4$$. Through $$s$$ it is three edges of weight $$1$$, for $$3$$.

Two facts shape every answer:

- **It is a tree.** With positive weights, any cycle has an edge that can go. Removing it keeps everything connected and lowers the weight.
- **Its leaves are terminals.** A leaf that isn't a terminal can go too, along with its edge.

Steiner points must be vertices of the graph. In the plane you could put a junction anywhere, but that is the geometric (Euclidean) Steiner tree, a different problem, and not one contests ask.

Here are the cases a contest can ask:

| Graph | Terminals         | Method                                         | Time                        |
| ----- | ----------------- | ---------------------------------------------- | --------------------------- |
| tree  | any $$k$$         | sort by DFS order, then halve the cyclic sum   | $$O(k \log k)$$ per query   |
| any   | $$2$$             | Dijkstra                                       | $$O(m \log n)$$             |
| any   | all $$n$$         | minimum spanning tree                          | $$O(m \log m)$$             |
| any   | $$k \lesssim 12$$ | DP over subsets of terminals                   | $$O(3^k n + 2^k m \log m)$$ |
| any   | many              | NP-hard, one of Karp's 21 NP-complete problems | no fast exact method known  |

The last row is why contests stay with the rows above it.

### On a tree, the answer is forced

In a tree there is exactly one path between two vertices, so there is nothing to choose. Delete an edge $$e$$, and the tree falls into two sides.

- If both sides hold a terminal, every connection between them uses $$e$$, so the answer contains $$e$$.
- If one side holds none, drop $$e$$ and that whole side. What is left is still a tree, and it still holds every terminal.

So the answer is exactly the edges with a terminal on each side, and its weight is their total. The rest is computing that quickly, for many queries.

### Two and three terminals

Root the tree and let $$W(x)$$ be the weighted depth of $$x$$. For two terminals the answer is one distance, and one LCA gives it:

$$
d(u, v) = W(u) + W(v) - 2\,W(\operatorname{lca}(u, v)).
$$

For three, count by edges. An edge with $$j$$ terminals on one side lies on $$j(k - j)$$ of the pairwise paths, one for each pair it separates. With $$k = 3$$, that is $$2$$ when $$j$$ is $$1$$ or $$2$$, which are exactly the needed edges, and $$0$$ when $$j$$ is $$0$$ or $$3$$. So the pairwise distances count every needed edge twice:

$$
\text{answer} = \frac{d(a, b) + d(b, c) + d(c, a)}{2}.
$$

This is LeetCode 3553, worked through in [Graphs and Trees](/blog/graphs-and-trees/#lca-3553).

### Many terminals: walk them in DFS order

The first instinct is to keep adding all the pairs. With four terminals it breaks: $$j(4 - j)$$ is $$3$$ when $$j$$ is $$1$$ or $$3$$, and $$4$$ when $$j = 2$$. Different edges are counted different numbers of times, and no single division fixes that. On this tree, with every edge of weight $$1$$ and terminals $$a, b, c, d$$:

```
        r
      /   \
     x     y
    / \   / \
   a   b c   d
```

The answer is all six edges, so $$6$$. The six pairwise distances add up to $$20$$, because each leaf edge is counted $$3$$ times and each edge at $$r$$ is counted $$4$$ times.

So which pairs should we add, so that every needed edge is counted exactly twice? Think of a walk that starts at a terminal, visits the others one by one, and comes back. A needed edge has terminals on both sides, so the walk crosses it at least twice, once out and once back. To cross it _only_ twice, the walk has to finish everything on one side before crossing over, and that is exactly how a DFS moves. So visit the terminals in the order a DFS reaches them, then return to the first.

> **Theorem.** Sort the terminals by DFS entry time into $$v_1, \dots, v_k$$, and let $$v_{k+1} = v_1$$. The answer is half the cyclic sum of consecutive distances.

$$
\text{answer} = \frac12 \sum_{i=1}^{k} d(v_i, v_{i+1}).
$$

<details markdown="1">
<summary>Proof</summary>

Take any edge $$e$$, from a vertex down to its child $$c$$. The terminals on $$c$$'s side are the ones in $$c$$'s subtree. A subtree is one contiguous run of entry times, so those terminals are consecutive in the sorted order.

A step from $$v_i$$ to $$v_{i+1}$$ pays for $$e$$ exactly when $$e$$ separates its two ends, meaning one end is in the run and the other is not. Going around the circle $$v_1, \dots, v_k, v_1$$, a run that is neither empty nor everything is entered once and left once, so exactly two steps cross $$e$$. If the run is empty or everything, no step crosses $$e$$, and $$e$$ is not needed. So the cyclic sum counts every needed edge twice and every other edge never. $$\blacksquare$$

</details>

On the tree above, the DFS order is $$a, b, c, d$$. The cyclic sum is $$2 + 4 + 2 + 4 = 12$$, and half of it is $$6$$. In the order $$a, c, b, d$$, every one of the four steps crosses both edges at $$r$$, the sum is $$16$$, and half of it is $$8$$, which is wrong.

With three terminals the order never matters. A cyclic order of three is either the DFS order or its reverse, and reversing a cycle doesn't change its sum. That is why LeetCode 3553 could add all three pairs.

The sort key costs nothing. `first_visit`, the index where the Euler tour first reaches a vertex, increases in DFS entry order, and the LCA already computes it. A query is one sort and $$k$$ LCAs, so $$O(k \log k)$$ with an $$O(1)$$ LCA.

The LCA below is the Euler tour with a plain sparse table from [Graphs and Trees](/blog/graphs-and-trees/#farach-colton-bender), with the weighted depth added. Farach-Colton and Bender drops in unchanged.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
int n;
vector<vector<pii>> adj; // (neighbor, weight)

vi first_visit, euler_tour, height;
vector<ll> depth; // weighted depth
vi log_2;
vii sp;

void flatten(int v, int p, int h, ll d) {
    first_visit[v] = sz(euler_tour);
    euler_tour.pb(v);
    height[v] = h;
    depth[v] = d;
    for (auto [u, w] : adj[v]) {
        if (u == p) continue;
        flatten(u, v, h + 1, d + w);
        euler_tour.pb(v);
    }
}

int min_by_h(int i, int j) {
    return height[euler_tour[i]] < height[euler_tour[j]] ? i : j;
}

void precompute_lca(int root) {
    first_visit.assign(n, -1);
    height.assign(n, 0);
    depth.assign(n, 0);
    euler_tour.clear();
    flatten(root, -1, 0, 0);

    int m = sz(euler_tour);
    log_2.assign(m + 1, -1);
    FOR(i, 1, m) log_2[i] = log_2[i / 2] + 1;
    sp.assign(log_2[m] + 1, vi(m));
    REP(i, m) sp[0][i] = i;
    for (int k = 1; (1 << k) <= m; k++)
        for (int i = 0; i + (1 << k) <= m; i++)
            sp[k][i] = min_by_h(sp[k-1][i], sp[k-1][i + (1 << (k-1))]);
}

int lca(int u, int v) {
    int l = first_visit[u], r = first_visit[v];
    if (l > r) swap(l, r);
    int k = log_2[r - l + 1];
    return euler_tour[min_by_h(sp[k][l], sp[k][r - (1 << k) + 1])];
}

ll dist(int u, int v) {
    return depth[u] + depth[v] - 2 * depth[lca(u, v)];
}

// weight of the smallest subtree joining the terminals
ll steiner(vi terms) {
    sort(all(terms), [](int a, int b) { return first_visit[a] < first_visit[b]; });
    int k = sz(terms);
    ll total = 0;
    REP(i, k) total += dist(terms[i], terms[(i + 1) % k]);
    return total / 2;
}
```

</details>

### Terminals that come and go

[Codeforces 176E — Archaeology](https://codeforces.com/problemset/problem/176/E) gives a tree with $$n \le 10^5$$ vertices and edge weights up to $$10^9$$. Then $$10^5$$ operations switch a vertex on, switch it off, or ask for the weight of the smallest subtree joining every vertex that is on.

Sorting again for every ask costs $$O(k \log k)$$ each time. But one switch changes the cyclic sum in only one place. Keep the vertices that are on in a set ordered by entry time, and keep the cyclic sum. Switching $$v$$ on between its cyclic neighbors $$a$$ and $$b$$ replaces the step from $$a$$ to $$b$$ with two steps:

$$
\text{total} \mathrel{+}= d(a, v) + d(v, b) - d(a, b).
$$

Switching it off subtracts the same amount. Every operation is $$O(\log n)$$, and an ask prints half the total. The edge cases take care of themselves. With one vertex on, $$a = b = v$$ and every term is $$0$$. With two, $$a = b$$ and the total is twice their distance.

```cpp
set<pii> active; // (first_visit, vertex)
ll total = 0;    // the cyclic sum of consecutive distances

// the active vertices just before and just after v, cyclically
pii neighbors(set<pii>::iterator it) {
    auto nxt = next(it) == active.end() ? active.begin() : next(it);
    auto prv = it == active.begin() ? prev(active.end()) : prev(it);
    return {prv->se, nxt->se};
}

void turn_on(int v) {
    auto it = active.insert({first_visit[v], v}).fi;
    auto [a, b] = neighbors(it);
    total += dist(a, v) + dist(v, b) - dist(a, b);
}

void turn_off(int v) {
    auto it = active.find({first_visit[v], v});
    auto [a, b] = neighbors(it);
    total -= dist(a, v) + dist(v, b) - dist(a, b);
    active.erase(it);
}
```

The answer can reach about $$10^{14}$$, so the total is a `long long`.

### On a graph with few terminals: a DP over subsets

On a general graph, paths aren't unique, and choosing the Steiner points is the hard part. With $$k \le 12$$ terminals, though, there are only $$2^k$$ subsets of terminals, and a DP over them works. It is due to Dreyfus and Wagner (1971).

**The state.** $$\mathrm{dp}[S][v]$$ is the weight of the cheapest tree that contains every terminal in $$S$$ and also the vertex $$v$$. Think of $$v$$ as a handle, the place where this tree will later attach to something else. The answer is $$\mathrm{dp}[T][t]$$ for any terminal $$t$$.

**Look at the best tree for $$(S, v)$$, and count the branches at $$v$$.**

- **Two or more.** Split the branches into two groups. Each group, together with $$v$$, is a tree through $$v$$, and each holds some of the terminals, because its leaves are terminals. So the tree is a tree for $$(A, v)$$ plus a tree for $$(S \setminus A, v)$$:

  $$
  \textbf{merge:}\quad \mathrm{dp}[S][v] = \min_{\emptyset \ne A \subsetneq S} \Big(\mathrm{dp}[A][v] + \mathrm{dp}[S \setminus A][v]\Big).
  $$

- **Exactly one.** Walk from $$v$$ along that branch to the first vertex $$u$$ that is a terminal or branches. The tree is that path plus a tree for $$(S, u)$$:

  $$
  \textbf{grow:}\quad \mathrm{dp}[S][v] = \min_{u} \Big(\mathrm{dp}[S][u] + d(u, v)\Big).
  $$

- **None.** The tree is $$v$$ alone, so $$S = \{v\}$$. This is the base case, $$\mathrm{dp}[\{t\}][t] = 0$$.

The grow step takes a minimum over every $$u$$ at once, and that is a shortest-path problem: run Dijkstra with every vertex starting at distance $$\mathrm{dp}[S][u]$$. One run covers every $$u$$.

**The order.** Every proper subset of $$S$$ is smaller than $$S$$ as a number, because removing bits lowers it (the same fact [Bitmask DP](/blog/dynamic-programming/#bitmask-dp) uses). So process $$S = 1, 2, \dots, 2^k - 1$$. For each $$S$$, merge first and then grow, so that the grow step can extend the trees the merge just built. The merge walks the subsets of $$S$$ with `A = (A - 1) & S`.

<details markdown="1">
<summary>Proof: the merge and the grow are enough</summary>

Let $$X$$ be a cheapest tree that contains $$S$$ and $$v$$. Its leaves are in $$S \cup \{v\}$$. Assume every $$\mathrm{dp}$$ value for a smaller set is already right.

- _$$v$$ has two or more branches._ Split them into two nonempty groups. Each group with $$v$$ is a tree through $$v$$ whose other leaves are terminals, so one holds a nonempty $$A \subsetneq S$$ and the other holds the rest. Their weights are at least $$\mathrm{dp}[A][v]$$ and $$\mathrm{dp}[S \setminus A][v]$$, so the merge finds $$X$$'s weight.
- _$$v$$ has one branch, and $$v \in S$$._ The merge with $$A = \{v\}$$ gives $$0 + \mathrm{dp}[S \setminus \{v\}][v]$$, and $$X$$ is a tree for $$(S \setminus \{v\}, v)$$.
- _$$v$$ has one branch, and $$v \notin S$$._ Walk from $$v$$ to the first vertex $$u$$ that is in $$S$$ or has two or more branches. The path weighs at least $$d(u, v)$$. The rest of $$X$$ is a tree for $$(S, u)$$, and at $$u$$ it falls into one of the cases above (or it is $$u$$ alone, with $$S = \{u\}$$), so the merge has already found it before the grow step runs. The grow step then reaches $$v$$.
- _$$v$$ has no branches._ $$X$$ is $$v$$ alone, so $$S = \{v\}$$, the base case.

Every value the DP writes is the weight of a real tree for $$(S, v)$$, so it never goes below the optimum either. $$\blacksquare$$

</details>

**The cost.** Each terminal is in $$A$$, in $$S \setminus A$$, or outside $$S$$, so the merge sees about $$3^k$$ pairs $$(A, S)$$, each across $$n$$ vertices. That is $$O(3^k n)$$, plus one Dijkstra per subset, $$O(2^k m \log m)$$. At the limits of [Library Checker's Minimum Steiner Tree](https://judge.yosupo.jp/problem/minimum_steiner_tree), $$n = 100$$, $$m = 1000$$ and $$k = 12$$, that is about $$5 \cdot 10^7$$ merge steps and $$4096$$ Dijkstras, and it runs in about 60 ms.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const ll INF64 = LLONG_MAX / 4;

// dp[S][v] = weight of the cheapest tree joining the terminals in S and the vertex v
ll steiner(int n, const vector<vector<pii>>& adj, const vi& terms) {
    int k = sz(terms), FULL = 1 << k;
    vector<vector<ll>> dp(FULL, vector<ll>(n, INF64));
    REP(i, k) dp[1 << i][terms[i]] = 0;

    for (int S = 1; S < FULL; S++) {
        // merge: two trees for the two parts of S, joined at v
        for (int A = (S - 1) & S; A > 0; A = (A - 1) & S)
            REP(v, n) dp[S][v] = min(dp[S][v], dp[A][v] + dp[S ^ A][v]);

        // grow: walk the tree out to every other vertex (Dijkstra from all of them at once)
        priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<>> pq;
        REP(v, n) if (dp[S][v] < INF64) pq.push({dp[S][v], v});
        while (!pq.empty()) {
            auto [d, v] = pq.top(); pq.pop();
            if (d > dp[S][v]) continue;
            for (auto [u, w] : adj[v]) {
                if (d + w < dp[S][u]) {
                    dp[S][u] = d + w;
                    pq.push({dp[S][u], u});
                }
            }
        }
    }
    return dp[FULL - 1][terms[0]];
}
```

</details>

I checked the tree code against a brute force that prunes non-terminal leaves (72,000 queries, half of them through `turn_on` and `turn_off`), and the graph DP against the minimum spanning tree of every vertex subset that contains the terminals (3,000 random graphs).

Notes:

- **Use `long long`.** Library Checker's weights go up to $$10^9$$, and a tree of $$99$$ such edges overflows an `int`.
- **Weights on vertices instead of edges**, as in [Codeforces 152E — Garden](https://codeforces.com/problemset/problem/152/E). Let $$\mathrm{dp}[S][v]$$ include $$v$$'s own cost and start from $$\mathrm{dp}[\{t\}][t] = c(t)$$. The merge counts $$v$$ in both halves, so subtract $$c(v)$$ once, and the grow step adds $$c(u)$$ when it enters $$u$$.
- **Each split is tried twice**, once as $$A$$ and once as $$S \setminus A$$. Keeping only the $$A$$ that holds the lowest bit of $$S$$ halves the merge.

### Where it goes next

- **Virtual trees.** The DFS order does more than measure the Steiner tree. Add the LCA of each pair of neighbors in that order, and you have every branch point. Joining each vertex to its nearest ancestor among them gives a tree on at most $$2k - 1$$ vertices with the Steiner tree's shape, the **virtual tree** (or auxiliary tree). A tree DP on it costs $$O(k)$$ per query instead of $$O(n)$$.
- **Many terminals on a graph: within a factor of $$2$$.** Join every pair of terminals with an edge of their shortest-path distance, and take a minimum spanning tree over the terminals. It is at most twice the optimum, by the same walk as the theorem. Walk around the optimal tree, crossing each edge twice, for twice its weight. Shortcutting between consecutive terminals only shortens the walk, and dropping its last step leaves a spanning tree on the terminals.

> **The pattern worth naming.** On a tree, the smallest subtree joining a set of vertices is fixed, and visiting them in DFS order, wrapping around, crosses each of its edges exactly twice. Anything you can add up along paths (weights, edge counts, values on vertices) can be added up over the Steiner tree from $$k$$ distances, one per neighboring pair.

## Spanning Forests {#spanning-forests}

Most connectivity algorithms never work on the whole graph. They keep a **spanning forest**, a handful of edges that already say who is connected to whom, and do everything on it. The parallel and dynamic algorithms in the next two sections rest on five facts about spanning forests and how they come apart. This section proves them.

### Forests and their edges

A **forest** is a graph with no cycles, so each of its connected pieces is a tree. A **spanning forest** of a graph $$G$$ is a forest made of edges of $$G$$ that contains every vertex and has exactly one tree for each connected component of $$G$$.

**Fact 1. A forest with $$n$$ vertices and $$c$$ trees has exactly $$n - c$$ edges.** Start from the $$n$$ vertices alone: $$n$$ trees and no edges. Add the forest's edges one at a time. No edge can join two vertices of the same tree, because together with the path already joining them it would close a cycle. So each edge joins two different trees into one, and lowers the number of trees by exactly one. After $$n - c$$ edges, $$c$$ trees are left.

The same count is a lower bound for every graph. Each edge lowers the number of components by at most one, so a graph with $$n$$ vertices and $$c$$ components has at least $$n - c$$ edges. It has exactly $$n - c$$ only when it is a forest: with a cycle, you could delete one of the cycle's edges and keep all $$c$$ components with fewer edges than the bound allows.

### A spanning forest is a certificate

**Fact 2. Two vertices are connected in $$G$$ exactly when they are connected in a spanning forest $$F$$ of $$G$$.** A path in $$F$$ is a path in $$G$$. Conversely, the vertices of one component of $$G$$ all lie in one tree of $$F$$, and a tree connects all of its vertices.

So for questions about connectivity, a graph with millions of edges can be replaced by at most $$n - 1$$ of them. The forest is a **certificate**: a small piece of evidence that settles every question about who is connected. Keeping connectivity up to date means keeping a spanning forest up to date.

Call the edges of $$F$$ **tree edges** and the rest of the graph's edges **non-tree edges**. Both ends of a non-tree edge $$(x, y)$$ lie in the same tree, since $$x$$ and $$y$$ are in the same component. So the edge, together with the tree path from $$x$$ to $$y$$, closes exactly one cycle, its **fundamental cycle**.

### Cutting a tree edge

Most updates are easy. A new edge whose ends lie in different trees joins them and becomes a tree edge. A new edge with both ends in one tree becomes a non-tree edge, and the forest stays as it is. Deleting a non-tree edge changes nothing either, since the forest never used it.

The hard case is deleting a tree edge $$e = (u, v)$$. Removing it splits its tree $$T$$ into two pieces: $$T_u$$, containing $$u$$, and $$T_v$$, containing $$v$$. The forest now says that $$u$$ and $$v$$ are disconnected. Is that true in the graph?

**Fact 3. After $$e$$ is deleted, $$u$$ and $$v$$ are still connected exactly when some non-tree edge has one end in $$T_u$$ and the other in $$T_v$$. Any such edge $$f$$ is a replacement: $$F - e + f$$ is again a spanning forest.**

If such an $$f$$ exists, it joins the two pieces, so $$u$$ and $$v$$ are still connected. For the converse, take a path from $$u$$ to $$v$$ in $$G - e$$. It starts in $$T_u$$ and ends in $$T_v$$, so one of its edges goes from a vertex of $$T_u$$ to a vertex outside $$T_u$$, and since the whole path stays in $$T$$'s component, that vertex lies in $$T_v$$. The edge is not $$e$$, which is gone, and $$e$$ was the only tree edge between the two pieces, so it is a non-tree edge. Finally, $$f$$ joins two different trees of $$F - e$$, so adding it closes no cycle, and $$F - e + f$$ is a forest with one tree for each component of $$G - e$$.

<figure>
<svg viewBox="0 0 640 290" width="100%" style="max-width:640px" role="img" aria-label="A spanning tree with the tree edge e between u and v deleted, which leaves two pieces, T_u on the left and T_v on the right. Dashed non-tree edges stay inside each piece, except the edge f, which runs from b in T_u to g in T_v and can replace e." font-family="inherit" fill="currentColor">
<ellipse cx="165" cy="130" rx="138" ry="102" fill="#2563eb" fill-opacity="0.06" stroke="#2563eb" stroke-opacity="0.35" stroke-width="1.2"/>
<ellipse cx="480" cy="130" rx="138" ry="102" fill="currentColor" fill-opacity="0.04" stroke="currentColor" stroke-opacity="0.3" stroke-width="1.2"/>
<text x="88" y="152" text-anchor="middle" font-size="15" font-style="italic">T<tspan dy="4" font-size="11">u</tspan></text>
<text x="572" y="152" text-anchor="middle" font-size="15" font-style="italic">T<tspan dy="4" font-size="11">v</tspan></text>
<line x1="60" y1="60" x2="160" y2="60" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<line x1="160" y1="60" x2="260" y2="130" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<line x1="260" y1="130" x2="160" y2="200" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<line x1="380" y1="130" x2="480" y2="60" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<line x1="480" y1="60" x2="580" y2="60" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<line x1="380" y1="130" x2="480" y2="200" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<line x1="160" y1="60" x2="160" y2="200" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" stroke-dasharray="5 4"/>
<line x1="480" y1="60" x2="480" y2="200" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" stroke-dasharray="5 4"/>
<line x1="260" y1="130" x2="380" y2="130" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="6 4"/>
<text x="320" y="120" text-anchor="middle" font-size="15" font-style="italic" fill="#dc2626">e</text>
<path d="M160 200 Q320 275 480 200" fill="none" stroke="#2563eb" stroke-width="2.6"/>
<text x="320" y="258" text-anchor="middle" font-size="15" font-style="italic" fill="#2563eb">f</text>
<circle cx="60" cy="60" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="60" y="65" text-anchor="middle" font-size="14">c</text>
<circle cx="160" cy="60" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="160" y="65" text-anchor="middle" font-size="14">a</text>
<circle cx="260" cy="130" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="260" y="135" text-anchor="middle" font-size="14" font-weight="600">u</text>
<circle cx="160" cy="200" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="160" y="205" text-anchor="middle" font-size="14">b</text>
<circle cx="380" cy="130" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="380" y="135" text-anchor="middle" font-size="14" font-weight="600">v</text>
<circle cx="480" cy="60" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="480" y="65" text-anchor="middle" font-size="14">d</text>
<circle cx="580" cy="60" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="580" y="65" text-anchor="middle" font-size="14">h</text>
<circle cx="480" cy="200" r="15" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="480" y="205" text-anchor="middle" font-size="14">g</text>
<text x="320" y="284" text-anchor="middle" font-size="13">solid: tree edges · dashed: non-tree edges · f crosses the cut, so it can replace e</text>
</svg>
</figure>

In the language of cycles, a non-tree edge can replace $$e$$ exactly when its fundamental cycle passes through $$e$$. Either way, **all the difficulty of keeping connectivity up to date lies in finding a replacement edge without looking at every edge.**

When every update is known in advance, there is a well-known way around the problem: divide and conquer over time, with a union-find that can undo its unions. The algorithms below work online, one batch at a time, without seeing the future.

### Contracting a forest

To **contract** an edge $$(x, y)$$ is to merge $$x$$ and $$y$$ into a single vertex that keeps all of their other edges. Contracting every edge of a forest $$H$$ turns each tree of $$H$$ into one vertex. Call the result $$G / H$$, with the self-loops it creates thrown away. Each of its edges still remembers the edge of $$G$$ it came from.

**Fact 4. If $$F'$$ is a spanning forest of $$G / H$$, then the edges of $$H$$, together with the edges of $$G$$ that $$F'$$'s edges came from, form a spanning forest of $$G$$.**

Together they connect everything $$G$$ connects: $$H$$ connects the vertices inside each of its trees, and $$F'$$ connects the trees that share a component. To see that they close no cycle, count. If $$H$$ has $$t$$ trees, it has $$n - t$$ edges by Fact 1. The graph $$G / H$$ has $$t$$ vertices and the same $$c$$ components as $$G$$, so $$F'$$ has $$t - c$$ edges. That makes $$n - c$$ edges for a graph with $$c$$ components, which by the lower bound above is a forest.

Parallel algorithms shrink graphs this way: contract many disjoint pieces at once, solve the smaller graph, and let Fact 4 assemble the answer. It is also how a batch of new edges is added to a forest, by treating each existing tree as a single vertex.

### Charge the smaller side

**Fact 5. Suppose $$n$$ elements start in one group, and groups are repeatedly split in two, each split costing the size of the smaller part. Then the total cost is at most $$n \log_2 n$$.** Charge each split to the elements of its smaller part, one unit each. An element is charged only when it lands in the smaller part, and then its group at least halves. A group never has fewer than one element, so no element is charged more than $$\log_2 n$$ times.

This is the argument behind merging small sets into large ones, run backward. It is why the dynamic algorithm below always searches the smaller piece of a cut tree.

## Parallel Connectivity {#parallel-connectivity}

The static problem comes first: given a graph, find its connected components and a spanning forest, with many processors working at once. The batch algorithm in the next section calls this as a subroutine, and it is the simplest place to learn how parallel algorithms are measured and built.

### Work and span

A sequential algorithm is measured by its number of steps. A parallel one needs two numbers. Picture the computation as a directed acyclic graph: each vertex is one operation taking one unit of time, and an edge from $$a$$ to $$b$$ means that $$b$$ needs the result of $$a$$.

- The **work** $$W$$ is the number of operations: the time on one processor.
- The **span** $$S$$, also called the depth, is the number of operations on the longest path: the time with unlimited processors, since the operations along a path must run one after another.

Summing $$n$$ numbers with a loop makes a path of $$n$$ additions, so $$W = S = n$$. Summing each half separately and then adding the two results gives

$$W(n) = 2\,W(n/2) + O(1) = O(n), \qquad S(n) = S(n/2) + O(1) = O(\log n),$$

because the two halves don't depend on each other and can run at the same time. The work is the same, and the span drops from $$n$$ to $$\log n$$. The parallelism lives in the shape of the graph, not in the number of operations.

### Brent's bound

**On $$p$$ processors, a greedy scheduler finishes within $$W/p + S$$ steps.** At each step, a greedy scheduler runs $$p$$ of the ready operations if there are at least $$p$$, and all of them otherwise. Call a step that runs $$p$$ operations full. There are at most $$W/p$$ full steps, since each one does $$p$$ of the $$W$$ operations. A step that is not full runs every ready operation, including the first remaining operation of every longest remaining path, so the longest remaining path gets one shorter. That can happen at most $$S$$ times.

So two numbers predict the running time on any number of processors, and they give parallel algorithm design its two goals:

- **Work-efficient:** $$W$$ within a constant factor of the best sequential algorithm, so that nothing is lost on a few processors.
- **Polylogarithmic span:** $$S = O(\log^c n)$$ for a constant $$c$$, so that $$W/p$$ dominates for any realistic $$p$$.

The ratio $$W/S$$ is the **parallelism**: roughly how many processors the algorithm can keep busy.

### Prefix sums

The most useful parallel primitive computes all the prefix sums $$b_i = a_1 + \dots + a_i$$ of an array. The loop $$b_i = b_{i-1} + a_i$$ is a chain of $$n$$ dependent additions, so its span is $$n$$. Computing each $$b_i$$ separately, as a divide-and-conquer sum, has span $$O(\log n)$$ but work $$O(n^2)$$, far from work-efficient.

The way out is the halving that made the sum fast, applied to the array itself. Add neighbors in pairs, $$c_j = a_{2j-1} + a_{2j}$$, all at once. The prefix sums of $$c$$ are exactly the even prefix sums $$b_2, b_4, \dots$$, so compute them recursively. Then fill in each odd position with one more addition, $$b_{2j+1} = b_{2j} + a_{2j+1}$$, again all at once. Each level does linear work in constant span, on an array half as long as the one before:

$$W(n) = W(n/2) + O(n) = O(n), \qquad S(n) = S(n/2) + O(1) = O(\log n).$$

Prefix sums give **filter**, which keeps the elements that pass a test and packs them into a new array. Mark each kept element $$1$$ and every other element $$0$$. The prefix sum at a kept element is its position in the output. That is $$O(n)$$ work and $$O(\log n)$$ span, and the algorithms below use it whenever they throw away vertices or edges.

### Star contraction

Now connectivity. The first instinct is breadth-first search, exploring each frontier in parallel. The frontiers, though, come one after another, so the span is at least the diameter of the graph, which is $$n - 1$$ for a path.

Contraction avoids the diameter: shrink the whole graph by a constant factor each round, and $$O(\log n)$$ rounds are enough whatever its shape. What can be contracted all at once without conflicts? **Stars**: a center together with some of its neighbors. Different stars share no vertices, so they can all be contracted at the same time.

The trouble is choosing the centers. A rule that looks only at a vertex's neighborhood fails on symmetric graphs. On a cycle every vertex sees exactly the same thing, so whatever the rule does to one vertex, it does to all of them. Getting out of such ties is called **symmetry breaking**, and the simplest tool for it is a coin. One round goes:

1. Every vertex flips a coin.
2. Every vertex that flipped tails and has a neighbor that flipped heads picks one such neighbor and **hooks** onto it. The hook edges form stars, each centered at a heads vertex.
3. Contract every star into its center: rename each edge's endpoints to their centers, then filter out the self-loops. A vertex left with no edges is a finished component.

A vertex with at least one neighbor hooks with probability at least $$1/4$$: it flips tails with probability $$1/2$$, and independently, a fixed neighbor flips heads with probability $$1/2$$. So in expectation at least a quarter of the remaining vertices disappear each round, and $$O(\log n)$$ rounds finish the job with high probability.

The spanning forest comes for free. The hook edges of one round form a forest in the current graph, and Fact 4, applied once per round, shows that the original edges behind all the hook edges form a spanning forest of the input.

A round costs work linear in the current graph and $$O(\log n)$$ span for the filter, so the total is $$O((n + m)\log n)$$ work and $$O(\log^2 n)$$ span with high probability. That is a factor of $$\log n$$ more work than breadth-first search, because vertices disappear every round but edges need not. Work-efficient algorithms exist. A **low-diameter decomposition**, due to Miller, Peng and Xu, cuts the graph into pieces of small diameter while cutting only a small fraction of the edges. Each piece is contracted with a short breadth-first search, and the edges between pieces shrink geometrically from round to round. Built that way, connectivity takes $$O(n + m)$$ expected work and polylogarithmic span (Shun, Dhulipala and Blelloch). The batch algorithm only needs some parallel spanning forest algorithm, and any of these will do.

## Batch-Dynamic Connectivity {#batch-dynamic-connectivity}

Now the graph changes. Updates arrive in **batches**, each a set of edges to insert or a set of edges to delete, and between batches come questions about who is connected. Two first instincts fail:

- **Rerun the parallel algorithm after every batch.** That costs $$O(n + m)$$ work even when the batch holds three edges.
- **Apply the best sequential dynamic algorithm to the updates one at a time.** The work is small, but nothing runs in parallel, because each update is a chain of dependent steps.

A **batch-dynamic** algorithm beats both. Its total work on a batch of $$k$$ updates should be no more than the best sequential algorithm would spend on them one at a time, which makes it work-efficient, and its span should be polylogarithmic. Batches are what make this possible. A single update has too little work to share among processors. A batch of $$k$$ has $$k$$ times as much, and updates that land in the same tree can share their work.

The algorithm has three layers, built here in order. **Euler tour trees** hold the spanning forest. **Levels**, from Holm, de Lichtenberg and Thorup, make replacement edges cheap to find, one update at a time. **Batch versions of both**, from Acar, Anderson, Blelloch and Dhulipala, process a whole batch in parallel.

### Euler tour trees

The forest needs three operations, each in $$O(\log n)$$: **link** two trees with a new tree edge, **cut** a tree edge, and ask whether two vertices are **connected**. Union-find can link and answer the question, but it cannot cut.

Walk around a tree the way a pencil traces its outline, crossing every edge twice, once in each direction. Write the walk down as a sequence. Each tree edge $$\{x, y\}$$ contributes one element for the step $$x \to y$$ and one for the step $$y \to x$$, and each vertex $$x$$ contributes one element $$[x]$$, written at a moment when the walk stands at $$x$$, so that a vertex on its own still has a sequence. This is the tree's **Euler tour**. A tree with $$t$$ vertices has a tour of $$3t - 2$$ elements. The walk ends where it started, so the tour can be read cyclically, starting anywhere.

For the tree with edges $$1$$–$$2$$, $$1$$–$$3$$ and $$3$$–$$4$$, starting at $$1$$, the tour is

$$[1],\ 1{\to}2,\ [2],\ 2{\to}1,\ 1{\to}3,\ [3],\ 3{\to}4,\ [4],\ 4{\to}3,\ 3{\to}1.$$

The three operations become operations on sequences:

- **connected(u, v):** are $$[u]$$ and $$[v]$$ in the same sequence?
- **link(u, v):** rotate $$u$$'s tour to start at $$[u]$$ and $$v$$'s tour to start at $$[v]$$. The new tour is $$u$$'s tour, then $$u \to v$$, then $$v$$'s tour, then $$v \to u$$: the walk around $$u$$'s tree, a step over to $$v$$, the walk around $$v$$'s tree, and the step back.
- **cut(u, v):** the tour reads $$A,\ u{\to}v,\ B,\ v{\to}u,\ C$$, possibly with the two steps in the other order. Everything strictly between the two steps, $$B$$, is the walk around the piece on the far side, so it is that piece's tour. What is left, $$A$$ followed by $$C$$, is the tour of the other piece.

<figure>
<svg viewBox="0 0 640 210" width="100%" style="max-width:640px" role="img" aria-label="The tree with edges 1-2, 1-3 and 3-4, and its Euler tour: [1], 1 to 2, [2], 2 to 1, 1 to 3, [3], 3 to 4, [4], 4 to 3, 3 to 1. Cutting the edge 1-3 removes the steps 1 to 3 and 3 to 1, marked in red. The four elements between them form the tour of the piece {3, 4}, and the four before them form the tour of the piece {1, 2}." font-family="inherit" fill="currentColor">
<line x1="60" y1="55" x2="28" y2="125" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<line x1="60" y1="55" x2="92" y2="125" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="6 4"/>
<line x1="92" y1="125" x2="92" y2="190" stroke="currentColor" stroke-opacity="0.75" stroke-width="1.6"/>
<circle cx="60" cy="55" r="14" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="60" y="60" text-anchor="middle" font-size="14">1</text>
<circle cx="28" cy="125" r="14" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="28" y="130" text-anchor="middle" font-size="14">2</text>
<circle cx="92" cy="125" r="14" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="92" y="130" text-anchor="middle" font-size="14">3</text>
<circle cx="92" cy="190" r="14" style="fill:var(--bg)" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="92" y="195" text-anchor="middle" font-size="14">4</text>
<text x="152" y="24" font-size="13" font-weight="600">Euler tour</text>
<circle cx="174" cy="50" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="174" y="55" text-anchor="middle" font-size="13">1</text>
<rect x="201" y="37" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="222" y="54" text-anchor="middle" font-size="12">1→2</text>
<circle cx="270" cy="50" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="270" y="55" text-anchor="middle" font-size="13">2</text>
<rect x="297" y="37" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="318" y="54" text-anchor="middle" font-size="12">2→1</text>
<rect x="345" y="37" width="42" height="26" rx="5" fill="none" stroke="#dc2626" stroke-width="1.8"/>
<text x="366" y="54" text-anchor="middle" font-size="12" fill="#dc2626">1→3</text>
<circle cx="414" cy="50" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="414" y="55" text-anchor="middle" font-size="13">3</text>
<rect x="441" y="37" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="462" y="54" text-anchor="middle" font-size="12">3→4</text>
<circle cx="510" cy="50" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="510" y="55" text-anchor="middle" font-size="13">4</text>
<rect x="537" y="37" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="558" y="54" text-anchor="middle" font-size="12">4→3</text>
<rect x="585" y="37" width="42" height="26" rx="5" fill="none" stroke="#dc2626" stroke-width="1.8"/>
<text x="606" y="54" text-anchor="middle" font-size="12" fill="#dc2626">3→1</text>
<text x="152" y="104" font-size="13" font-weight="600">After cut(1, 3)</text>
<circle cx="174" cy="128" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="174" y="133" text-anchor="middle" font-size="13">1</text>
<rect x="201" y="115" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="222" y="132" text-anchor="middle" font-size="12">1→2</text>
<circle cx="270" cy="128" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="270" y="133" text-anchor="middle" font-size="13">2</text>
<rect x="297" y="115" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="318" y="132" text-anchor="middle" font-size="12">2→1</text>
<text x="356" y="133" font-size="13">tour of {1, 2}</text>
<text x="388" y="177" text-anchor="end" font-size="13">tour of {3, 4}</text>
<circle cx="414" cy="172" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="414" y="177" text-anchor="middle" font-size="13">3</text>
<rect x="441" y="159" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="462" y="176" text-anchor="middle" font-size="12">3→4</text>
<circle cx="510" cy="172" r="13" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.3"/>
<text x="510" y="177" text-anchor="middle" font-size="13">4</text>
<rect x="537" y="159" width="42" height="26" rx="5" fill="none" stroke="currentColor" stroke-opacity="0.5" stroke-width="1.3"/>
<text x="558" y="176" text-anchor="middle" font-size="12">4→3</text>
</svg>
</figure>

Cutting $$1$$–$$3$$ removes the two red steps. The four elements between them are the tour of $$\{3, 4\}$$, and the rest is the tour of $$\{1, 2\}$$.

So the forest is a collection of sequences that must split at a position, concatenate, and say which sequence an element belongs to. A balanced binary search tree ordered by position does all three in $$O(\log n)$$: split and join are its usual operations, and the root names the sequence. A treap ordered by position, the implicit treap from contests, is the shortest to write. Each forest operation is a constant number of splits and joins.

The implementation keeps parent pointers, so that it can climb from an element to its root and count the elements before it. `vertices(v)` reads the size of $$v$$'s tree off the length of its tour, which the next layer needs in order to find the smaller piece.

```cpp
// A forest on n vertices: link, cut, and connected in O(log n) expected time.
// Each tree's Euler tour is a sequence in an implicit treap. Node v (for
// v < n) is the vertex element [v]; a tree edge {u, v} adds a node for the
// arc u -> v and one for v -> u.
struct EulerTourTree {
    vi L, R, P, S;  // children, parent, subtree size
    vector<u64> pri;
    map<pii, int> arc;  // arc[{u, v}]: the node of the arc u -> v
    vi spare;           // nodes of cut arcs, ready for reuse

    EulerTourTree(int n) { REP(v, n) node(); }

    int node() {
        int x;
        if (!spare.empty()) x = spare.back(), spare.pop_back();
        else x = sz(L), L.pb(0), R.pb(0), P.pb(0), S.pb(0), pri.pb(0);
        L[x] = R[x] = P[x] = -1, S[x] = 1, pri[x] = rng();
        return x;
    }
    int size(int x) { return x < 0 ? 0 : S[x]; }
    void pull(int x) {
        S[x] = 1 + size(L[x]) + size(R[x]);
        if (L[x] >= 0) P[L[x]] = x;
        if (R[x] >= 0) P[R[x]] = x;
    }
    // Concatenate two sequences, given their roots.
    int join(int a, int b) {
        if (a < 0 || b < 0) return a < 0 ? b : a;
        if (pri[a] > pri[b]) { R[a] = join(R[a], b); pull(a); return a; }
        L[b] = join(a, L[b]); pull(b); return b;
    }
    // Split off the first k elements: returns {first k, the rest}.
    pii split(int x, int k) {
        if (x < 0) return {-1, -1};
        P[x] = -1;
        if (size(L[x]) >= k) {
            auto [a, b] = split(L[x], k);
            L[x] = b; pull(x);
            return {a, x};
        }
        auto [a, b] = split(R[x], k - size(L[x]) - 1);
        R[x] = a; pull(x);
        return {x, b};
    }
    int root(int x) { while (P[x] >= 0) x = P[x]; return x; }
    // How many elements come before x in its sequence.
    int index(int x) {
        int i = size(L[x]);
        for (; P[x] >= 0; x = P[x])
            if (R[P[x]] == x) i += size(L[P[x]]) + 1;
        return i;
    }
    // Rotate v's tour so that it starts at [v].
    int reroot(int v) {
        auto [a, b] = split(root(v), index(v));
        return join(b, a);
    }

    bool connected(int u, int v) { return root(u) == root(v); }
    // A tree with t vertices has 3t - 2 elements in its tour.
    int vertices(int v) { return (S[root(v)] + 2) / 3; }

    void link(int u, int v) {  // u and v must be in different trees
        int a = reroot(u), b = reroot(v);
        int uv = node(), vu = node();
        arc[{u, v}] = uv, arc[{v, u}] = vu;
        join(join(join(a, uv), b), vu);
    }
    void cut(int u, int v) {  // {u, v} must be a tree edge
        int x = arc[{u, v}], y = arc[{v, u}];
        arc.erase({u, v}), arc.erase({v, u});
        int i = index(x), j = index(y);
        if (i > j) swap(x, y), swap(i, j);
        // The tour reads A, x, B, y, C.
        auto [A, rest] = split(root(x), i);
        auto [xB, yC] = split(rest, j - i);
        auto [xx, B] = split(xB, 1);
        auto [yy, C] = split(yC, 1);
        join(A, C);  // one piece; B alone is the other
        spare.pb(xx), spare.pb(yy);
    }
};
```

It has been checked against a brute-force search on random forests and on a path of $$200{,}000$$ vertices. The next layer keeps one forest per level and adds one thing to each: every node counts the marked elements below it, where a vertex element is marked when its vertex has a non-tree edge of that level, and a step is marked when its edge is a tree edge of that level. A walk down from the root then finds the next marked element in $$O(\log n)$$.

### Levels

With the forest stored, deleting a tree edge needs a replacement (Fact 3). The first instinct is to scan the non-tree edges at the vertices of the smaller piece. Fact 5 bounds how often a vertex can be in the smaller piece, but not how often an edge can be scanned and rejected. An edge with both ends in the smaller piece fails, stays where it is, and is scanned and rejected again on the next deletion, and the one after that. A single deletion can cost $$O(m)$$.

So the question becomes: when an edge fails, how do we record the failure, so that each edge can fail only a bounded number of times? Holm, de Lichtenberg and Thorup's answer is to give every edge a **level**, an integer from $$1$$ to $$\log_2 n$$. A new edge starts at the top level, $$\log_2 n$$, and every failure costs it one level. Write $$G_i$$ for the edges of level at most $$i$$ and $$F_i$$ for the tree edges among them. Two invariants hold throughout:

1. **Every tree of $$F_i$$ has at most $$2^i$$ vertices.**
2. **For every $$i$$, $$F_i$$ is a spanning forest of $$G_i$$.**

At the top level, $$G_{\log_2 n}$$ is the whole graph and $$F_{\log_2 n}$$ is the whole forest. Lower levels hold fewer edges in smaller trees, and each level keeps its own Euler tour trees.

A replacement for a tree edge $$e$$ of level $$\ell$$ never has a level below $$\ell$$. A non-tree edge of level $$j < \ell$$ has its ends connected in $$F_j$$, by invariant 2, and that path avoids $$e$$, which is not in $$F_j$$. So both of its ends lie in the same piece. The search therefore runs upward from level $$\ell$$, and the first replacement it finds has the lowest possible level, which keeps invariant 2 true. At level $$i$$:

1. Of the two pieces that $$e$$'s tree in $$F_i$$ falls into, take the smaller. The tree had at most $$2^i$$ vertices, so the smaller piece has at most $$2^{i-1}$$.
2. Move every level-$$i$$ tree edge of the smaller piece down to level $$i - 1$$. Invariant 1 allows it, since the piece has at most $$2^{i-1}$$ vertices.
3. Scan the level-$$i$$ non-tree edges at the vertices of the smaller piece, one at a time. If an edge's other end lies in the other piece, it is the replacement: make it a tree edge of level $$i$$ and stop. If both ends lie in the smaller piece, it fails: move it down to level $$i - 1$$. Invariant 2 allows that, because after step 2 the whole piece is connected in $$F_{i-1}$$.
4. If no level-$$i$$ edge works, go up to level $$i + 1$$. If no level works, the component has really split in two.

Levels start at $$\log_2 n$$ and only go down, and they never fall below $$1$$: at level $$1$$ the smaller piece is a single vertex, with no edges inside it to move. So each edge moves down at most $$\log_2 n$$ times in its life. Each move, scan step, or lookup costs $$O(\log n)$$ in the Euler tour trees, so an edge pays $$O(\log^2 n)$$ over its lifetime for its moves, and each update pays $$O(\log^2 n)$$ more for linking or cutting at up to $$\log_2 n$$ levels. That is $$O(\log^2 n)$$ amortized time per insertion or deletion. A question about connectivity goes to the top level's Euler tour tree and takes $$O(\log n)$$.

A level is a budget. Each time an edge is examined and turns out useless, it pays one unit, and the budget suffices for the reason in Fact 5: an edge moves down only when it sits in the smaller piece, and the trees it can live in halve in size at every level. The original paper numbers the levels the other way, upward from $$0$$. The parallel paper numbers them downward, as here.

### Batch-parallel Euler tour trees

The batch algorithm needs Euler tour trees that accept a whole batch of links or cuts at once. That makes them a **batch-parallel data structure**. Rather than letting $$k$$ threads run $$k$$ operations at the same time, with locks to keep them out of each other's way, it receives the $$k$$ operations together and runs one parallel algorithm on all of them.

A batch of $$k$$ cuts, for example, finds the $$2k$$ steps to remove, splits the sequences at all of those places at once, and glues the pieces back together in the right order, all in parallel. Tseng, Dhulipala and Blelloch store the tours in skip lists that support batches of splits and joins, and process a batch of $$k$$ links or cuts in $$O(k \log(1 + n/k))$$ expected work and $$O(\log n)$$ span with high probability. A batch of $$k$$ connectivity questions costs the same.

That bound beats $$k$$ separate operations at $$\log n$$ each. Processed together, the $$k$$ operations share the top of the structure. Its top $$\log_2 k$$ levels hold only about $$2k$$ nodes, so the batch can visit each of them once, for $$O(k)$$ in total, and below that each operation has only about $$\log_2(n/k)$$ levels left. When $$k$$ is small, $$k \log(1 + n/k)$$ is about $$k \log n$$, as before. When $$k$$ is close to $$n$$, it is $$O(n)$$, a constant per operation. The paper shows the work bound is optimal.

### Batch insertions

To insert a batch of $$k$$ edges, the first instinct is to link every new edge whose ends lie in different trees. That can close cycles. Two new edges can join the same two trees, or three new edges can join three trees in a triangle. Each edge looks fine on its own, but linking all of them puts a cycle in the forest.

Fact 4 is the fix: treat each current tree as one vertex. Replace each new edge $$(u, v)$$ by an edge between the tree of $$u$$ and the tree of $$v$$, named by the roots of their Euler tour trees, which is one batch of connectivity questions. Run a static parallel spanning forest algorithm on these $$k$$ edges, link the edges it picks as tree edges, all at once, and keep the rest as non-tree edges. Every new edge enters at the top level. The paper does this in $$O(k \log(1 + n/k))$$ expected work and $$O(\log n)$$ span.

### Batch deletions

Deleted non-tree edges are simply removed. Deleted tree edges are cut from every level's Euler tour tree at once, with batch cuts. A tree may now be cut in many places, leaving many pieces, and the search for replacements runs level by level, from the lowest level of a deleted edge up to the top.

At level $$i$$, a piece of $$F_i$$ with at most $$2^{i-1}$$ vertices is **active**: it is small enough to move its edges down. A tree with at most $$2^i$$ vertices, cut into several pieces, has at most one piece larger than $$2^{i-1}$$, so every possible reconnection has an active piece at one end. The active pieces search in rounds:

1. Every active piece moves its level-$$i$$ tree edges down to level $$i - 1$$.
2. Every active piece, in parallel, examines its level-$$i$$ non-tree edges in growing steps: $$1$$ edge, then $$2$$, then $$4$$, doubling until a step finds an edge that leads to another piece or the edges run out. Each examined edge with both ends inside the piece moves down to level $$i - 1$$, as before.
3. The pieces' finds may form cycles: piece $$A$$ finds an edge to $$B$$ while $$B$$ finds one to $$A$$, or three pieces find a triangle. So, exactly as with insertions, contract each piece to a vertex and run a static spanning forest algorithm on the edges found. Only the edges it picks become tree edges of level $$i$$.
4. Pieces that merged count as one piece from then on. A piece stops being active when it grows past $$2^{i-1}$$ vertices or runs out of level-$$i$$ non-tree edges. When no piece is active, move up to level $$i + 1$$.

Why doubling? A piece cannot know in advance how many edges it will have to examine. Examining one at a time, as the sequential algorithm does, makes the span grow with the count. Examining all of them at once is parallel but can waste work. In the sequential algorithm, every examined edge pays for itself, either by moving down a level or by being the one replacement. An examined edge that leads out of the piece but is not picked does neither, so if the first edge already worked and the piece had a thousand more, nothing pays for looking at them. Doubling bounds the waste. If the search succeeds at the step that examines $$2^q$$ edges, every earlier step failed, so the $$1 + 2 + \dots + 2^{q-1} = 2^q - 1$$ edges they examined all moved down a level and paid for themselves. The last step costs no more than all of those together, plus one, so its cost can be charged to them, at most doubling their bill. The number of steps is $$O(\log n)$$, so the span stays small.

Putting it all together, Acar, Anderson, Blelloch and Dhulipala get $$O(\log n \log(1 + n/\Delta))$$ expected amortized work per inserted or deleted edge, where $$\Delta$$ is the average size of a deletion batch, with $$O(\log n)$$ span for a batch of insertions and $$O(\log^3 n)$$ span for a batch of deletions, with high probability. When every batch holds a single edge, the work is $$O(\log^2 n)$$ per update, the same as the sequential algorithm, and larger batches make each update cheaper.

### Where it goes next

- **Path questions on a dynamic forest.** Euler tour trees answer connectivity and questions about subtrees. Rake-compress trees also answer questions about paths, such as the heaviest edge between two vertices, and have batch-parallel versions. The newest, UFO trees, are fast both sequentially and in parallel.
- **Minimum spanning forests.** A minimum spanning forest can also be kept under batches of updates in parallel, and single-linkage clustering, which keeps merging the two closest clusters, reduces to it.
- **Graph indexes for vector search.** The same habit of working in batches builds the proximity graphs used for nearest-neighbor search: ParlayANN inserts points in batches of doubling size, each against a frozen snapshot of the graph.

> **The pattern worth naming.** Keep a small certificate instead of the whole graph, and put all the effort into the one hard update, the cut that needs a replacement. Make every wasted look pay with something that runs out slowly, a level. To process a batch, contract what is already connected and run a static parallel algorithm on what is left. The spanning forest over contracted pieces does the work in both insertions and deletions.

## Practice {#practice}

**Steiner Tree**

- [LeetCode 3553 — Minimum Weighted Subgraph With the Required Paths II](https://leetcode.com/problems/minimum-weighted-subgraph-with-the-required-paths-ii/) (three terminals)
- [Codeforces 176E — Archaeology](https://codeforces.com/problemset/problem/176/E) (terminals switched on and off)
- [Codeforces 152E — Garden](https://codeforces.com/problemset/problem/152/E) (weights on cells, $$k \le 7$$)
- [Library Checker — Minimum Steiner Tree](https://judge.yosupo.jp/problem/minimum_steiner_tree) ($$k \le 12$$)
- [Luogu P6192 — Minimum Steiner Tree](https://www.luogu.com.cn/problem/P6192) (the template problem)
- [Codeforces 613D — Kingdom and its Cities](https://codeforces.com/problemset/problem/613/D) (virtual tree)
- [Codeforces 1320E — Treeland and Viruses](https://codeforces.com/problemset/problem/1320/E) (virtual tree)

**Batch-Dynamic Connectivity**

- [Library Checker — Dynamic Tree Vertex Add Subtree Sum](https://judge.yosupo.jp/problem/dynamic_tree_vertex_add_subtree_sum) (an Euler tour tree with subtree sums)
- [CSES — Dynamic Connectivity](https://cses.fi/problemset/task/2133) (offline: divide and conquer over time with a union-find that undoes its unions)

## Further reading {#further-reading}

**Steiner Tree**

- [Wikipedia — Steiner tree problem](https://en.wikipedia.org/wiki/Steiner_tree_problem).
- [OI Wiki — Steiner tree](https://oi-wiki.org/graph/steiner-tree/) (in Chinese), with the subset DP.
- S. E. Dreyfus and R. A. Wagner, _The Steiner Problem in Graphs_, Networks, 1971.

**Parallel Connectivity**

- G. E. Blelloch, L. Dhulipala and Y. Sun, [_Introduction to Parallel Algorithms_](https://www.cs.umd.edu/~laxman/notes/parallel.pdf), draft lecture notes. Sections 2 to 4 cover the model and prefix sums, 6.3 and 6.4 low-diameter decomposition and connectivity, and 7 balanced trees built on join.
- R. P. Brent, _The Parallel Evaluation of General Arithmetic Expressions_, Journal of the ACM, 1974, where the bound comes from.
- G. L. Miller, R. Peng and S. C. Xu, [_Parallel Graph Decompositions Using Random Shifts_](https://arxiv.org/abs/1307.3692), SPAA 2013.
- J. Shun, L. Dhulipala and G. E. Blelloch, _A Simple and Practical Linear-Work Parallel Algorithm for Connectivity_, SPAA 2014.

**Batch-Dynamic Connectivity**

- MIT 6.851, [Dynamic Graphs I](https://courses.csail.mit.edu/6.851/spring21/lectures/L19.html) (link-cut trees) and [Dynamic Graphs II](https://courses.csail.mit.edu/6.851/spring21/lectures/L20.html) (Euler tour trees and dynamic connectivity), with lecture videos on MIT OpenCourseWare.
- M. R. Henzinger and V. King, _Randomized Fully Dynamic Graph Algorithms with Polylogarithmic Time per Operation_, Journal of the ACM, 1999, which introduced Euler tour trees.
- J. Holm, K. de Lichtenberg and M. Thorup, _Poly-Logarithmic Deterministic Fully-Dynamic Algorithms for Connectivity, Minimum Spanning Tree, 2-Edge, and Biconnectivity_, Journal of the ACM, 2001.
- T. Tseng, L. Dhulipala and G. E. Blelloch, [_Batch-Parallel Euler Tour Trees_](https://arxiv.org/abs/1810.10738), ALENEX 2019.
- U. A. Acar, D. Anderson, G. E. Blelloch and L. Dhulipala, [_Parallel Batch-Dynamic Graph Connectivity_](https://arxiv.org/abs/1903.08794), SPAA 2019.
- D. Anderson, [_Parallel Batch-Dynamic Algorithms: Dynamic Trees, Graphs, and Self-Adjusting Computation_](https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-23-120.pdf), PhD thesis, Carnegie Mellon University, 2023. The whole area in one place, from batch-dynamic trees to connectivity and minimum spanning trees.
- L. Dhulipala, [_Provably Efficient and Scalable Shared-Memory Graph Processing_](https://www.cs.umd.edu/~laxman/papers/thesis.pdf), PhD thesis, Carnegie Mellon University, 2020, with the batch-dynamic model and graph streaming.
- T. Tseng, L. Dhulipala and J. Shun, [_Parallel Batch-Dynamic Minimum Spanning Forest and the Efficiency of Dynamic Agglomerative Graph Clustering_](https://arxiv.org/abs/2205.04956), SPAA 2022.
- Q. De Man, A. Sharma, K. N. Gowda and L. Dhulipala, [_UFO Trees: Practical and Provably-Efficient Parallel Batch-Dynamic Trees_](https://arxiv.org/abs/2601.10706), PPoPP 2026.
- K. Hanauer, M. Henzinger and C. Schulz, [_Recent Advances in Fully Dynamic Graph Algorithms_](https://arxiv.org/abs/2102.11169), SAND 2022, a survey.
