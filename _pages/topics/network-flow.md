---
layout: post
title: "Network Flow"
description: "Max flow, min cut, and bipartite matching, learned one question at a time. Binary search the load so that max flow counts bears instead of weight, see why a matching is a flow, and turn a min cut into a minimum vertex cover (König's theorem)."
permalink: /blog/network-flow/
last_updated: 2026-11-20
author: Lam Nguyen
toc:
  sidebar: right
---

Network flow comes up often in harder contests: national olympiads and ICPC regionals. The algorithms are short templates. The hard part is the modeling: turning the story into a graph whose max flow or min cut is the answer. Four models cover most of it:

- **Max flow**: sending resources through a network, counting disjoint paths.
- **Bipartite matching**: assigning jobs to people.
- **Min cut**: splitting a set in two, or choosing projects at the least cost.
- **Min-cost flow**: sending the most units, and paying the least for them.

This page is written the way I learned it: the questions I asked, in the order I asked them, each followed by the answer that settled it. The quoted lines are my questions as I asked them, rough edges included. I hadn't read Dinic's algorithm yet, and nothing here needs it.

**The vocabulary.** A flow network is a directed graph with a source $$s$$, a sink $$t$$, and a capacity $$c(e) \ge 0$$ on every edge. A flow puts an amount $$f(e)$$ on every edge, with $$0 \le f(e) \le c(e)$$, and at every vertex except $$s$$ and $$t$$, what flows in flows out. Its value is the net amount leaving $$s$$. The max flow is the largest value possible.

<details markdown="1">
<summary>C++ template used by every implementation on this page</summary>

Each implementation below starts after this header.

```cpp
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
using i64 = int64_t;
using u64 = uint64_t;
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

## Change the Units {#change-the-units}

This is a max flow problem with no min cut in it yet, and the interesting part is a change of units: from weight to bears.

### The problem

[Codeforces 653D — Delivery Bears](https://codeforces.com/problemset/problem/653/D). A directed graph has $$n \le 50$$ vertices and $$m \le 500$$ edges, and edge $$i$$ can carry at most $$c_i \le 10^6$$ units of weight in total. Exactly $$x \le 10^5$$ bears walk from vertex $$1$$ to vertex $$n$$, each on a simple path of its own. Every bear carries the **same** weight $$w$$, and the bears that cross an edge together may not exceed its capacity. Maximize the total weight $$x \cdot w$$.

The first sample has $$x = 3$$ bears and four edges:

| Edge        | Capacity |
| ----------- | -------- |
| $$1 \to 2$$ | $$2$$    |
| $$2 \to 4$$ | $$1$$    |
| $$1 \to 3$$ | $$1$$    |
| $$3 \to 4$$ | $$2$$    |

The answer is $$1.5$$.

### First instinct: a flow of weight

Weight moves from $$1$$ to $$n$$ along edges with capacities, so take the max flow with capacities $$c_i$$. On the sample it is $$2$$: one unit along $$1 \to 2 \to 4$$ and one along $$1 \to 3 \to 4$$. But the answer is $$1.5$$.

A flow can split weight into any pieces it likes. Bears can't split. Three bears with the same load must share the two paths, so one path carries two of them, and its capacity-$$1$$ edge forces $$2w \le 1$$. That gives $$w = 1/2$$ and a total of $$1.5$$. The flow of weight is only an upper bound.

### How many bears cross each edge?

So I tried fixing the load:

> We binary search the weight each bear carries, call it $$w$$. If $$k$$ bears cross edge $$i$$, then $$k \cdot w \le c_i$$. But how can we know $$k$$? Oh, so $$c_i \ge k \cdot w$$ means we are now sending bears across? At each edge, the question is how many bears can cross. Now it's bears, not weight?

Yes. And $$k$$, the number I was stuck on, is not mine to choose.

Once $$w$$ is fixed, edge $$i$$ fits at most $$\lfloor c_i / w \rfloor$$ bears. Make that its capacity, and the whole graph is measured in bears. Then run max flow from $$1$$ to $$n$$. The flow decides by itself how many bears use each edge. All I supply is the ceiling. The max flow value is the largest number of bears that can reach $$n$$ without overloading any edge.

Why does a flow of bears mean real bears walking? The capacities are integers, so there is a max flow that is an integer on every edge, and augmenting paths find one (more on that [below](#integrality)). An integer flow of value $$F$$ splits into $$F$$ paths from $$1$$ to $$n$$, each carrying one unit: follow edges with positive flow from $$1$$ to $$n$$, take one unit off that path, and repeat. Cancel any cycles first, since they carry nothing from $$1$$ to $$n$$, and every path is simple, as the problem requires. If $$F \ge x$$, send any $$x$$ of them.

### Why binary search works

A lighter load can only fit more bears. When $$w$$ shrinks, every $$\lfloor c_i / w \rfloor$$ grows or stays the same, so the max flow can only grow. The loads that work form an interval $$(0, w^\ast]$$, and binary search finds its end. It is the move from [Search D, Not x](/blog/binary-search/#search-d-not-x): stop searching over choices and search over the answer, because "can $$x$$ bears carry $$w$$ each?" is monotone in $$w$$.

On the sample, $$w = 1/2$$ turns the capacities into $$4, 2, 2, 4$$ bears, and $$4 \ge 3$$ bears get through. Any $$w > 1/2$$ leaves the two capacity-$$1$$ edges with one bear each, and only $$2$$ get through. So $$w^\ast = 1/2$$, and the answer is $$3 \cdot 1/2 = 1.5$$.

The max flow only changes where some $$\lfloor c_i / w \rfloor$$ does, at $$w = c_i / k$$, so $$w^\ast$$ is exactly $$c_i / k$$ for some edge $$i$$ and some $$k \le x$$. That gives an exact answer to check against: try those fractions from the largest down. On $$400$$ random small graphs the code below agreed with it every time.

### The code

```cpp
const int MAX_ITER = 100;

int n, m, x;
int k;
vii capacity;
vii Adj;

struct Edge { int from, to, cap; };
vector<Edge> edges;

int bfs(int s, int t, vi& parent) {
    vi vis(k, 0);
    vis[s] = 1;

    queue<pii> q;
    q.push({s, INF});

    while (!q.empty()) {
        auto [cur, flow] = q.front(); q.pop();
        for (int nxt : Adj[cur]) {
            if (vis[nxt] || capacity[cur][nxt] <= 0) continue;
            vis[nxt] = 1;
            parent[nxt] = cur;
            int new_flow = min(flow, capacity[cur][nxt]);
            if (nxt == t) return new_flow;
            q.push({nxt, new_flow});
        }
    }

    return 0;
}

int maxflow(int s, int t) {
    int flow = 0;
    vi parent(k);
    int new_flow;
    while (new_flow = bfs(s, t, parent)) {
        flow += new_flow;
        int cur = t;
        while (cur != s) {
            int prv = parent[cur];
            capacity[prv][cur] -= new_flow;
            capacity[cur][prv] += new_flow;
            cur = prv;
        }
    }
    return flow;
}

void solve() {
    cin >> n >> m >> x;

    k = n+1;
    Adj.assign(k, vi());
    edges.clear();

    auto add_edge = [&](int u, int v, int c) {
        edges.pb({u, v, c});
        Adj[u].pb(v);
        Adj[v].pb(u);
    };

    REP(i, m) {
        int u, v, c; cin >> u >> v >> c;
        add_edge(u, v, c);
    }

    auto check = [&](double w) {
        capacity.assign(k, vi(k, 0));
        for (auto& [u, v, c] : edges) {
            capacity[u][v] += (int)min<double>(x, c / w);
        }
        return maxflow(1, n) >= x;
    };

    double left = 0, right = 1e6;
    REP(i, MAX_ITER) {
        double mid = (left + right) / 2.0;
        if (check(mid)) left = mid;
        else right = mid;
    }

    cout << fixed << setprecision(10) << left * x << '\n';
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    solve();
    return 0;
}
```

`maxflow` is Edmonds–Karp. BFS finds a shortest path from $$s$$ to $$t$$ on which every edge still has spare capacity, and pushes the smallest spare amount along it. Each push also adds that amount to the reverse edge, `capacity[cur][prv] += new_flow`, so a later path can send flow back and undo an earlier choice. That is why `Adj` gets both directions of every edge. Repeat until no path is left.

Three details:

- **`min<double>(x, c / w)`.** No edge ever needs more than $$x$$ bears. The cap also matters for correctness: when $$w$$ is tiny, $$c / w$$ is far past `INT_MAX`, and converting an out-of-range `double` to `int` is undefined behavior.
- **A fixed number of iterations.** Each step halves the interval, and after $$100$$ of them $$w$$ is as precise as a `double` can be. A loop like `while (right - left > eps)` can run forever instead: near $$10^6$$, neighboring doubles are about $$2 \cdot 10^{-10}$$ apart, so with `eps = 1e-12` the interval stops shrinking and never gets that small.
- **The output is $$w \cdot x$$.** The judge accepts a relative error of $$10^{-6}$$, and multiplying by $$x$$ doesn't change the relative error of $$w$$.

> **The pattern worth naming.** When every unit must have the same size, fix the size and count units. Binary search the size, divide each capacity by it and round down, and max flow counts how many units fit. You never decide how many units cross an edge. The flow does.

## Bipartite Matching Is a Max Flow {#bipartite-matching}

Of the four models at the top, bipartite matching was next.

### Is the matching just the max flow?

> So for bipartite matching, the answer is basically the max flow?

Yes, for a maximum matching: the most pairs, with no weights. Take a bipartite graph with left side $$L$$ and right side $$R$$, and build a network:

1. Add a source $$S$$ with an edge $$S \to u$$ of capacity $$1$$ for every $$u \in L$$.
2. Add a sink $$T$$ with an edge $$v \to T$$ of capacity $$1$$ for every $$v \in R$$.
3. Direct every original edge from $$L$$ to $$R$$, with capacity $$1$$. (Capacity $$\infty$$ works too, because the edges at $$S$$ and $$T$$ already limit each vertex to one unit. The [next section](#min-cut) uses that.)

The maximum matching has exactly as many pairs as the max flow, and the matched pairs are the $$L \to R$$ edges that carry flow.

### Why exactly the max flow?

> Why is the answer to matching exactly max flow?

Because a matching with $$k$$ pairs and an integer flow of value $$k$$ are the same thing, seen two ways.

**A matching gives a flow.** For each pair $$(u_i, v_i)$$, send one unit along $$S \to u_i \to v_i \to T$$. Each vertex is in at most one pair, so no edge carries more than $$1$$, and what enters each vertex leaves it. The flow has value $$k$$. So the maximum matching is at most the max flow.

**An integer flow gives a matching.** Every capacity is $$1$$, so each edge carries $$0$$ or $$1$$. A vertex $$u \in L$$ has one incoming edge, $$S \to u$$, of capacity $$1$$, so at most one unit leaves it: $$u$$ is matched to at most one $$v$$. In the same way, $$v \in R$$ has one outgoing edge of capacity $$1$$, so at most one unit enters it. The whole flow of $$k$$ crosses from $$L$$ to $$R$$, so exactly $$k$$ of those edges carry $$1$$, and they form a matching. So the max flow is at most the maximum matching.

### What if the flow splits in half? {#integrality}

The second direction needs an integer flow. What if the best flow sends half a unit down two edges? On a square, $$u_1$$ and $$u_2$$ both joined to $$v_1$$ and $$v_2$$, putting $$1/2$$ on each of the four middle edges is a max flow of value $$2$$, and it is no matching.

The **integrality theorem** settles it. When every capacity is an integer, some maximum flow is an integer on every edge, and every augmenting path algorithm finds one: it starts from zero and only ever adds or subtracts bottleneck amounts, which are integers. So the max flow value is reached by an integer flow, and that flow is a matching.

Two practical notes:

- **Speed.** On this network, with every capacity $$1$$, Dinic's algorithm runs in $$O(E\sqrt{V})$$, the bound of Hopcroft–Karp. For small graphs, Kuhn's algorithm (one DFS per left vertex) is shorter to write.
- **Weights.** Plain max flow ignores costs. For the cheapest or heaviest perfect matching, put the weights on the edges as costs and use min-cost max flow, or the Hungarian algorithm.

## Min Cut and König's Theorem {#min-cut}

### Every cut bounds the flow

> Oh, this is actually a min cut property too. With $$L$$ and $$R$$, the max flow is at most the total capacity of the edges between $$L$$ and $$R$$.

Exactly, and that observation is half of the max-flow min-cut theorem.

A **cut** splits the vertices into two groups, $$A$$ containing $$S$$ and $$B$$ containing $$T$$. Its **capacity** is the total capacity of the edges that go from $$A$$ to $$B$$. Every unit of flow starts in $$A$$ and ends in $$B$$, so it crosses from $$A$$ to $$B$$ at least once. A unit that crosses back from $$B$$ to $$A$$ has to cross forward again. So for every cut,

$$\text{flow value} = f(A \to B) - f(B \to A) \le c(A \to B).$$

My bound is the cut $$A = \{S\} \cup L$$, $$B = R \cup \{T\}$$, whose crossing edges are exactly the edges between $$L$$ and $$R$$. The **max-flow min-cut theorem** says the bound is tight for the best cut:

$$\text{max flow} = \min_{\text{cuts } (A, B)} c(A \to B).$$

### What does a finite cut cut?

Now make every middle edge $$u \to v$$ capacity $$\infty$$. The max flow doesn't change, since $$u$$ still receives at most one unit from $$S$$. But a cut with finite capacity can no longer cross any middle edge from $$A$$ to $$B$$. To block a path $$S \to u \to v \to T$$, it has to cut $$S \to u$$ or $$v \to T$$.

> So $$u \to v$$ is always $$\infty$$, and to cut $$S \to u \to v \to T$$ we have to cut $$S \to u$$ or $$v \to T$$. But after cutting, then what? Basically $$u \to v$$ is kept, and the rest is cut? Actually, restate König's theorem on minimum vertex cover for me.

Yes, $$u \to v$$ stays. What gets cut are the unit edges at the two ends, and choosing which end to cut is choosing a vertex.

**König's theorem.** In a bipartite graph, the maximum matching has the same size as the minimum vertex cover.

A **vertex cover** is a set of vertices that touches every edge. The theorem needs the graph to be bipartite: a triangle has a maximum matching of $$1$$ but needs $$2$$ vertices to cover its three edges.

Read the cut as a choice of vertices:

- cutting $$S \to u$$ means picking $$u$$,
- cutting $$v \to T$$ means picking $$v$$.

Each of those edges has capacity $$1$$, so **the capacity of the cut is the number of picked vertices**.

**A finite cut picks a cover.** Suppose some edge $$(u, v)$$ has neither end picked. Then $$S \to u$$ and $$v \to T$$ are both uncut, and $$u \to v$$ has capacity $$\infty$$, so it isn't cut either. The path $$S \to u \to v \to T$$ survives, and that is not a cut.

**A cover gives a cut.** Given a cover $$C$$, put $$S$$, the left vertices outside $$C$$, and the right vertices inside $$C$$ in $$A$$, and the rest in $$B$$. The edges from $$A$$ to $$B$$ are $$S \to u$$ for each $$u \in L \cap C$$ and $$v \to T$$ for each $$v \in R \cap C$$. A middle edge from $$A$$ to $$B$$ would join a left vertex outside $$C$$ to a right vertex outside $$C$$, an edge that $$C$$ misses. So the cut costs exactly $$\lvert C \rvert$$.

So the min cut is the minimum vertex cover, and the whole chain reads

$$\text{max matching} = \text{max flow} = \text{min cut} = \text{min vertex cover}.$$

One more follows for free. The vertices outside a cover have no edge among them, since such an edge would be uncovered. So the **maximum independent set** of a bipartite graph has $$\lvert L \rvert + \lvert R \rvert - \text{max matching}$$ vertices. That is the count behind problems about seating people, or placing pieces on a grid, so that no two conflict.

### Is the cover the smaller side?

> So the minimum vertex cover is the smaller side of the bipartite graph? Oh, but the two sides are equal, right? Well, they don't have to be equal, as long as there are edges. Show me a picture. Oh, and it's one of $$S \to u$$ or $$v \to T$$, right? Then are the two sides equal at this point?

No on both counts. $$L$$ and $$R$$ can have any sizes. All of $$L$$ is always a cover, since every edge has an end in $$L$$, and so is all of $$R$$. So the minimum cover is at most the smaller side, but it can do better by mixing vertices from both. And the mix isn't balanced either: for each edge at least one end is picked, but a cover can take two vertices from $$L$$ and none from $$R$$. A star, $$u_1$$ joined to $$v_1, v_2, v_3$$, is covered by $$u_1$$ alone.

Here both sides have $$3$$ vertices, and the edges are $$u_1 v_1$$, $$u_1 v_2$$, $$u_1 v_3$$, $$u_2 v_2$$, $$u_3 v_2$$. Either side costs $$3$$, but $$\{u_1, v_2\}$$ covers all five edges:

<figure>
<svg viewBox="0 0 620 300" width="100%" style="max-width:620px" role="img" aria-label="Bipartite network with S, u1 to u3, v1 to v3, and T. The edges S to u1 and v2 to T are cut, so the vertex cover is u1 and v2." font-family="inherit" fill="currentColor">
<defs><marker id="fa" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L10 5L0 9z" fill="currentColor"/></marker><marker id="fc" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L10 5L0 9z" fill="#dc2626"/></marker></defs>
<text x="40" y="22" text-anchor="middle" font-size="13" opacity="0.7">source</text>
<text x="200" y="22" text-anchor="middle" font-size="13" opacity="0.7">L</text>
<text x="420" y="22" text-anchor="middle" font-size="13" opacity="0.7">R</text>
<text x="580" y="22" text-anchor="middle" font-size="13" opacity="0.7">sink</text>
<text x="120" y="42" text-anchor="middle" font-size="12" opacity="0.55">cap 1</text>
<text x="310" y="42" text-anchor="middle" font-size="12" opacity="0.55">cap ∞</text>
<text x="500" y="42" text-anchor="middle" font-size="12" opacity="0.55">cap 1</text>
<line x1="55" y1="142" x2="183" y2="78" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="6 4" marker-end="url(#fc)"/>
<text x="119" y="104" text-anchor="middle" font-size="16" font-weight="700" fill="#dc2626">✕</text>
<line x1="57" y1="150" x2="181" y2="150" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="55" y1="158" x2="183" y2="222" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="217" y1="70" x2="401" y2="70" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="216" y1="76" x2="402" y2="144" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="214" y1="80" x2="405" y2="219" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="217" y1="150" x2="401" y2="150" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="216" y1="224" x2="402" y2="156" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="435" y1="78" x2="563" y2="142" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<line x1="437" y1="150" x2="561" y2="150" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="6 4" marker-end="url(#fc)"/>
<text x="499" y="144" text-anchor="middle" font-size="16" font-weight="700" fill="#dc2626">✕</text>
<line x1="435" y1="222" x2="563" y2="158" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#fa)"/>
<circle cx="40" cy="150" r="17" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="40" y="155" text-anchor="middle" font-size="14" font-weight="600">S</text>
<circle cx="200" cy="70" r="17" fill="#dc2626" fill-opacity="0.12" stroke="#dc2626" stroke-width="2.2"/>
<text x="200" y="75" text-anchor="middle" font-size="14" font-weight="600">u₁</text>
<circle cx="200" cy="150" r="17" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="200" y="155" text-anchor="middle" font-size="14" font-weight="400">u₂</text>
<circle cx="200" cy="230" r="17" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="200" y="235" text-anchor="middle" font-size="14" font-weight="400">u₃</text>
<circle cx="420" cy="70" r="17" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="420" y="75" text-anchor="middle" font-size="14" font-weight="400">v₁</text>
<circle cx="420" cy="150" r="17" fill="#dc2626" fill-opacity="0.12" stroke="#dc2626" stroke-width="2.2"/>
<text x="420" y="155" text-anchor="middle" font-size="14" font-weight="600">v₂</text>
<circle cx="420" cy="230" r="17" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="420" y="235" text-anchor="middle" font-size="14" font-weight="400">v₃</text>
<circle cx="580" cy="150" r="17" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="580" y="155" text-anchor="middle" font-size="14" font-weight="600">T</text>
<text x="310" y="288" text-anchor="middle" font-size="13">Cut S → u₁ and v₂ → T: capacity 2, cover {u₁, v₂}</text>
</svg>
</figure>

The matching side agrees: $$u_2$$ and $$u_3$$ can only go to $$v_2$$, so at most one of them is matched, and $$\{u_1 v_1, u_2 v_2\}$$ is a maximum matching of size $$2$$.

### What is a min cut, exactly?

> So what is the definition of min cut? It's the smallest cut, so is it where the flow is maximum? Or is it the minimum capacity? I haven't read Dinic yet.

**The minimum capacity.** The definition has no flow in it: among all ways to split the vertices into $$A \ni S$$ and $$B \ni T$$, a min cut is one where the edges from $$A$$ to $$B$$ have the least total capacity. Think of pipes: it is the narrowest bottleneck between $$S$$ and $$T$$.

The theorem is what connects it to flow. Everything from $$S$$ to $$T$$ passes through the bottleneck, so no flow is larger than it, and the max flow equals it exactly. At a max flow, every edge from $$A$$ to $$B$$ of a min cut is full and every edge from $$B$$ to $$A$$ is empty. None of this depends on how the max flow is computed. Edmonds–Karp and Dinic are just two ways to get it.

### Groups of vertices, or edges at S and T?

> Wait, slow down. We split the vertices into $$A$$ and $$B$$, then destroy the pipes from $$A$$ to $$B$$? Not destroy $$S \to u$$ or $$v \to T$$?

They are the same thing. $$S$$ is always in $$A$$ and $$T$$ always in $$B$$, and every other vertex can go on either side. An edge is cut exactly when its tail is in $$A$$ and its head is in $$B$$. Putting $$u_1$$ in $$B$$ cuts $$S \to u_1$$. Putting $$v_2$$ in $$A$$ cuts $$v_2 \to T$$.

The picture above is the cut $$A = \{S, u_2, u_3, v_2\}$$, $$B = \{u_1, v_1, v_3, T\}$$. Checking every edge:

| Edge                             | From | To  | Cut?                   |
| -------------------------------- | ---- | --- | ---------------------- |
| $$S \to u_1$$                    | A    | B   | yes, $$1$$             |
| $$S \to u_2$$, $$S \to u_3$$     | A    | A   | no                     |
| $$u_2 \to v_2$$, $$u_3 \to v_2$$ | A    | A   | no                     |
| $$v_2 \to T$$                    | A    | B   | yes, $$1$$             |
| $$u_1 \to v_1$$, $$u_1 \to v_3$$ | B    | B   | no                     |
| $$u_1 \to v_2$$                  | B    | A   | no, only A to B counts |
| $$v_1 \to T$$, $$v_3 \to T$$     | B    | B   | no                     |

The cut edges are exactly $$S \to u_1$$ and $$v_2 \to T$$, for a capacity of $$2$$.

### Inside a group, or between groups?

> Ah, lol, because there are no edges inside a group, so we destroy. But we still keep $$A \to B$$, right? So there's still a way from $$S$$ to $$T$$? But not anymore if we destroy $$A \to B$$. So basically we split the vertices into two groups: one way, group $$A$$ keeps its edges, the other is the bipartite one. So the cut destroys either inter or intra edges: if we destroy inside a group, $$A$$–$$B$$ is kept, otherwise $$A \to B$$ has to be destroyed.

This mixes up two different splits.

- **$$(L, R)$$ is the bipartition** of the original graph. It has no edges inside $$L$$ or inside $$R$$.
- **$$(A, B)$$ is the cut.** It has plenty of edges inside each group: $$S \to u_2 \to v_2$$ lies entirely in $$A$$.

A cut only ever removes edges **between** the groups, from $$A$$ to $$B$$. Edges inside $$A$$ or inside $$B$$ stay. Flow can go around inside $$A$$ as much as it likes, but once every bridge from $$A$$ to $$B$$ is gone, it cannot reach $$T$$. In the original graph the $$A \to B$$ edges are all still there, which is why $$S$$ reaches $$T$$. The cut is a question: if I drew the border here and removed every edge crossing it from $$A$$ to $$B$$, what would that cost? The min cut is the border that costs least.

### Finding the cover in code

After the max flow, the vertices still reachable from $$S$$ through edges with spare capacity form the source side $$A$$ of a min cut. On the network with middle edges of capacity `INF`, the cover is the left vertices **not** reached and the right vertices that **are** reached:

```cpp
// after maxflow(S, T) on S -> u (1), u -> v (INF), v -> T (1)
vi seen(k, 0);
queue<int> q;
q.push(S);
seen[S] = 1;
while (!q.empty()) {
    int u = q.front(); q.pop();
    for (int v : Adj[u])
        if (!seen[v] && capacity[u][v] > 0) {
            seen[v] = 1;
            q.push(v);
        }
}
// cover = { u in L : !seen[u] }  and  { v in R : seen[v] }
```

On the picture, a max flow sends $$u_1 \to v_1$$ and $$u_2 \to v_2$$. From $$S$$, only $$S \to u_3$$ has room left. From $$u_3$$ the search reaches $$v_2$$, and from $$v_2$$ it goes back to $$u_2$$ along the reverse of $$u_2 \to v_2$$. That makes the reached set $$\{S, u_2, u_3, v_2\}$$, the $$A$$ from the table, and the cover $$\{u_1, v_2\}$$. On $$3000$$ random bipartite graphs, this cover always covered every edge and had the size of a brute-force minimum cover.

> **The pattern worth naming.** A cut chooses a side for every vertex. Infinite edges forbid some choices, and finite edges put a price on the rest. König's theorem is the case where the forbidden choice is an edge with neither end picked, and each picked vertex costs $$1$$. Most min cut models, project selection among them, are this same move with other prices.

## Practice {#practice}

**Change the Units**

- [Codeforces 653D — Delivery Bears](https://codeforces.com/problemset/problem/653/D)
- [CSES 1694 — Download Speed](https://cses.fi/problemset/task/1694) (the max flow template)
- [CSES 1711 — Distinct Routes](https://cses.fi/problemset/task/1711) (edge-disjoint paths, printed)

**Bipartite Matching Is a Max Flow**

- [CSES 1696 — School Dance](https://cses.fi/problemset/task/1696) (maximum matching, printed)

**Min Cut and König's Theorem**

- [CSES 1695 — Police Chase](https://cses.fi/problemset/task/1695) (print the edges of a min cut)
- [LeetCode 1349 — Maximum Students Taking Exam](https://leetcode.com/problems/maximum-students-taking-exam/) (seats conflict only across neighboring columns, so the conflicts form a bipartite graph: a maximum independent set)

**Next: min-cost flow**

- [VNOJ MINCOST](https://oj.vnoi.info/problem/mincost) (the fourth model at the top)

## Further reading {#further-reading}

- [cp-algorithms — Maximum flow: Ford–Fulkerson and Edmonds–Karp](https://cp-algorithms.com/graph/edmonds_karp.html), with the integrality argument and the residual graph.
- [cp-algorithms — Kuhn's algorithm for maximum bipartite matching](https://cp-algorithms.com/graph/kuhn_maximum_bipartite_matching.html).
- [Wikipedia — Max-flow min-cut theorem](https://en.wikipedia.org/wiki/Max-flow_min-cut_theorem).
- [Wikipedia — König's theorem](https://en.wikipedia.org/wiki/K%C5%91nig%27s_theorem_%28graph_theory%29), with the proof through flows and the construction of the cover.
- Jeff Erickson, [_Algorithms_](https://jeffe.cs.illinois.edu/teaching/algorithms/), the chapters on maximum flows and minimum cuts and on their applications.
