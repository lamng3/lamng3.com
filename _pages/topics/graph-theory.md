---
layout: post
title: "Graph Theory"
description: "Graph theory for competitive programming. The facts the other pages prove on the way, gathered by idea, and the Steiner tree, the cheapest way to connect chosen vertices: forced on a tree and measured by walking the terminals in DFS order, and found on a graph with few terminals by a DP over subsets."
permalink: /blog/graph-theory/
last_updated: 2026-11-13
author: Lam Nguyen
toc:
  sidebar: right
---

Graph theory for competitive programming. The other pages prove a fair amount of it on the way to something else, so the first section gathers those facts by idea. The Steiner tree is the cheapest way to connect chosen vertices. On a tree it is forced, and walking the terminals in DFS order measures it. On a graph with few terminals, a DP over subsets finds it.

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

## Practice {#practice}

**Steiner Tree**

- [LeetCode 3553 — Minimum Weighted Subgraph With the Required Paths II](https://leetcode.com/problems/minimum-weighted-subgraph-with-the-required-paths-ii/) (three terminals)
- [Codeforces 176E — Archaeology](https://codeforces.com/problemset/problem/176/E) (terminals switched on and off)
- [Codeforces 152E — Garden](https://codeforces.com/problemset/problem/152/E) (weights on cells, $$k \le 7$$)
- [Library Checker — Minimum Steiner Tree](https://judge.yosupo.jp/problem/minimum_steiner_tree) ($$k \le 12$$)
- [Luogu P6192 — Minimum Steiner Tree](https://www.luogu.com.cn/problem/P6192) (the template problem)
- [Codeforces 613D — Kingdom and its Cities](https://codeforces.com/problemset/problem/613/D) (virtual tree)
- [Codeforces 1320E — Treeland and Viruses](https://codeforces.com/problemset/problem/1320/E) (virtual tree)

## Further reading {#further-reading}

**Steiner Tree**

- [Wikipedia — Steiner tree problem](https://en.wikipedia.org/wiki/Steiner_tree_problem).
- [OI Wiki — Steiner tree](https://oi-wiki.org/graph/steiner-tree/) (in Chinese), with the subset DP.
- S. E. Dreyfus and R. A. Wagner, _The Steiner Problem in Graphs_, Networks, 1971.
