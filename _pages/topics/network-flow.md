---
layout: post
title: "Network Flow"
description: "Max flow and min cut from scratch: augmenting paths and the residual graph, why the largest flow always equals the smallest cut, and how bipartite matching, minimum vertex cover, and maximum independent set all come out of one max flow. Then a contest problem where the whole trick is choosing what to count."
permalink: /blog/network-flow/
last_updated: 2026-11-21
author: Lam Nguyen
toc:
  sidebar: right
---

Network flow is about moving something through a network whose links have limited capacity: water through pipes, packets through cables, cars through roads. It shows up regularly in national olympiads and at ICPC. The algorithms are short, and once you understand them you can treat them as templates. The real skill is **modeling**: noticing that a problem about bears, seats, or job assignments is secretly a flow problem, and building the graph whose max flow or min cut is the answer.

Four models cover most of what you will meet:

- **Max flow**: how much can get from a source to a sink, or how many disjoint paths connect them.
- **Bipartite matching**: pairing people with jobs, one each.
- **Min cut**: the cheapest way to separate two things, which also solves problems about splitting a set in two or choosing projects.
- **Min-cost flow**: sending the most units while paying the least for them.

This page builds the first three from nothing. It starts with what a flow is and how to find the largest one, proves that the largest flow always equals the smallest cut, and then gets matchings, vertex covers, and independent sets out of that one theorem. It ends with a contest problem where the whole difficulty is deciding what to count.

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

## Max Flow {#max-flow}

### Networks and flows

A **flow network** is a directed graph with two special vertices, a **source** $$s$$ and a **sink** $$t$$, and a **capacity** $$c(e) \ge 0$$ on every edge. Picture the edges as pipes and the capacity as how much water a pipe can carry.

A **flow** assigns an amount $$f(e)$$ to every edge, subject to two rules:

1. **Capacity.** $$0 \le f(e) \le c(e)$$: no pipe carries more than it can.
2. **Conservation.** At every vertex other than $$s$$ and $$t$$, the total flowing in equals the total flowing out. Water is neither created nor stored along the way.

The **value** of a flow is the net amount leaving $$s$$. By conservation, it is also the net amount arriving at $$t$$. The **max flow** problem asks for a flow of the largest value.

### Greedy gets stuck

The obvious algorithm: find any path from $$s$$ to $$t$$ whose edges all have room, push as much as fits, and repeat until no such path is left.

It can stop too early. In the network below every edge has capacity $$1$$. Suppose the first path found is $$s \to a \to b \to t$$. It fills $$s \to a$$, $$a \to b$$, and $$b \to t$$. Now every path from $$s$$ to $$t$$ uses one of those full edges, so the greedy algorithm stops with a flow of $$1$$. The answer is $$2$$: send one unit along $$s \to a \to t$$ and one along $$s \to b \to t$$.

<figure>
<svg viewBox="0 0 640 270" width="100%" style="max-width:640px" role="img" aria-label="Two copies of a four-vertex network s, a, b, t with unit capacities. Left: the greedy path s to a to b to t, after which no path is left. Right: the augmenting path s to b to a to t, which goes backward over a to b and cancels it." font-family="inherit" fill="currentColor">
<defs><marker id="ga" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 1L10 5L0 9z" fill="currentColor"/></marker><marker id="gb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L10 5L0 9z" fill="#2563eb"/></marker><marker id="gr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 1L10 5L0 9z" fill="#dc2626"/></marker></defs>
<text x="160" y="20" text-anchor="middle" font-size="13" font-weight="600">Greedy: s → a → b → t</text>
<line x1="54" y1="127" x2="144" y2="74" stroke="#2563eb" stroke-width="2.6" marker-end="url(#gb)"/>
<line x1="160" y1="81" x2="160" y2="187" stroke="#2563eb" stroke-width="2.6" marker-end="url(#gb)"/>
<line x1="174" y1="197" x2="264" y2="144" stroke="#2563eb" stroke-width="2.6" marker-end="url(#gb)"/>
<line x1="54" y1="143" x2="144" y2="196" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#ga)"/>
<line x1="174" y1="73" x2="264" y2="126" stroke="currentColor" stroke-opacity="0.45" stroke-width="1.4" marker-end="url(#ga)"/>
<circle cx="40" cy="135" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="40" y="140" text-anchor="middle" font-size="14" font-weight="600">s</text>
<circle cx="160" cy="65" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="160" y="70" text-anchor="middle" font-size="14" font-weight="400">a</text>
<circle cx="160" cy="205" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="160" y="210" text-anchor="middle" font-size="14" font-weight="400">b</text>
<circle cx="280" cy="135" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="280" y="140" text-anchor="middle" font-size="14" font-weight="600">t</text>
<text x="160" y="256" text-anchor="middle" font-size="13">flow 1, and no path has room left</text>
<text x="480" y="20" text-anchor="middle" font-size="13" font-weight="600">Augment: s → b → a → t</text>
<line x1="374" y1="127" x2="464" y2="74" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.4" marker-end="url(#ga)"/>
<line x1="474" y1="81" x2="474" y2="187" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.4" marker-end="url(#ga)"/>
<line x1="494" y1="197" x2="584" y2="144" stroke="currentColor" stroke-opacity="0.2" stroke-width="1.4" marker-end="url(#ga)"/>
<line x1="374" y1="143" x2="464" y2="196" stroke="#2563eb" stroke-width="2.6" marker-end="url(#gb)"/>
<line x1="486" y1="189" x2="486" y2="83" stroke="#dc2626" stroke-width="2.6" stroke-dasharray="6 4" marker-end="url(#gr)"/>
<line x1="494" y1="73" x2="584" y2="126" stroke="#2563eb" stroke-width="2.6" marker-end="url(#gb)"/>
<circle cx="360" cy="135" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="360" y="140" text-anchor="middle" font-size="14" font-weight="600">s</text>
<circle cx="480" cy="65" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="480" y="70" text-anchor="middle" font-size="14" font-weight="400">a</text>
<circle cx="480" cy="205" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="480" y="210" text-anchor="middle" font-size="14" font-weight="400">b</text>
<circle cx="600" cy="135" r="16" fill="none" stroke="currentColor" stroke-opacity="0.6" stroke-width="1.4"/>
<text x="600" y="140" text-anchor="middle" font-size="14" font-weight="600">t</text>
<text x="480" y="256" text-anchor="middle" font-size="13">b → a cancels a → b: flow 2</text>
<line x1="320" y1="40" x2="320" y2="230" stroke="currentColor" stroke-opacity="0.15"/>
</svg>
</figure>

The first path made a poor choice: it used $$a \to b$$. A correct algorithm needs a way to take such a choice back later.

### The residual graph

The fix is to track, for every edge, what it could still do.

- An edge $$u \to v$$ with capacity $$c$$ and flow $$f$$ can carry $$c - f$$ more. That is a **forward** residual edge $$u \to v$$ with capacity $$c - f$$.
- It can also give back up to $$f$$. Represent that as a **reverse** residual edge $$v \to u$$ with capacity $$f$$. Pushing a unit along $$v \to u$$ means cancelling a unit on $$u \to v$$.

These edges, with these capacities, form the **residual graph**. A path from $$s$$ to $$t$$ in it is an **augmenting path**, and pushing flow along one always increases the value.

Back to the example. After the greedy path, the residual graph has a reverse edge $$b \to a$$, the "undo" of $$a \to b$$. So $$s \to b \to a \to t$$ is an augmenting path. Pushing one unit along it sends a unit into $$b$$, cancels the unit on $$a \to b$$, and sends that unit on from $$a$$ to $$t$$. The result is exactly the two paths $$s \to a \to t$$ and $$s \to b \to t$$, with value $$2$$.

### Augmenting paths

The **Ford–Fulkerson** method is the greedy algorithm, run on the residual graph instead of the original one: while an augmenting path exists, push its **bottleneck** (its smallest residual capacity) along it. Each push raises the value by the bottleneck. With integer capacities that is at least $$1$$, so the method stops after at most as many pushes as the max flow value. The [next section](#min-cut) proves that when it stops, the flow is maximum.

**Edmonds–Karp** always picks a shortest augmenting path, the one with the fewest edges, found by BFS. That bounds the number of pushes by $$O(VE)$$ no matter how large the capacities are, for $$O(VE^2)$$ in total. With few vertices, an adjacency matrix of residual capacities keeps the code short:

```cpp
int k;          // number of vertices
vii capacity;   // capacity[u][v]: residual capacity of u -> v
vii Adj;        // both directions of every edge

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
    while ((new_flow = bfs(s, t, parent))) {
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
```

- `capacity` holds residual capacities, not the original ones. It starts out equal to the capacities.
- Pushing along $$u \to v$$ subtracts from `capacity[u][v]` and adds to `capacity[v][u]`. That second line is the reverse edge, the "undo".
- `Adj[u]` lists every neighbor in either direction, so the BFS can walk reverse edges too.
- Each BFS entry carries the bottleneck so far, so the BFS returns it as soon as it reaches $$t$$.

On larger graphs, **Dinic's algorithm** is the usual template. It groups the shortest augmenting paths into phases and runs in $$O(V^2 E)$$, much faster in practice. Nothing below depends on which algorithm computes the flow, only on its value.

### Integer capacities give integer flows {#integrality}

**Integrality theorem.** If every capacity is an integer, some maximum flow has an integer on every edge, and augmenting paths find one. They start from zero and only ever add or subtract bottlenecks, which are integers.

This is what turns flow into a counting tool. An integer flow of value $$F$$ splits into $$F$$ paths from $$s$$ to $$t$$, each carrying one unit. Start at $$s$$ and follow edges that still carry flow. Conservation means you never get stuck before $$t$$. Remove one unit along that path, and repeat. Cycles of flow move nothing from $$s$$ to $$t$$, so cancel them first, and every path is simple.

So when all capacities are $$1$$, the max flow is the largest number of **edge-disjoint paths** from $$s$$ to $$t$$. With other integer capacities, it counts whatever the units stand for: trucks, people, matched pairs.

## Min Cut {#min-cut}

### Cuts

Max flow asks how much can get through. A cut asks the opposite question: what is the cheapest way to separate $$s$$ from $$t$$?

An **$$s$$–$$t$$ cut** splits the vertices into two groups: $$A$$, which contains $$s$$, and $$B$$, which contains $$t$$. Every other vertex can go on either side. The **capacity** of the cut is the total capacity of the edges that go **from $$A$$ to $$B$$**.

Two points are easy to get wrong:

- **Only edges from $$A$$ to $$B$$ count.** Edges inside $$A$$, edges inside $$B$$, and edges going back from $$B$$ to $$A$$ are not part of the cut.
- **The edges come with the split.** You choose a side for every vertex, and the cut edges are whatever crosses from $$A$$ to $$B$$. Deleting just those edges disconnects $$s$$ from $$t$$: a path from $$s$$ starts in $$A$$ and ends in $$B$$, so it has to cross the border forward somewhere, and every forward crossing is gone. Edges inside a group can stay.

In the network from the figure:

| $$A$$           | Edges from $$A$$ to $$B$$             | Capacity |
| --------------- | ------------------------------------- | -------- |
| $$\{s\}$$       | $$s \to a$$, $$s \to b$$              | $$2$$    |
| $$\{s, a\}$$    | $$s \to b$$, $$a \to b$$, $$a \to t$$ | $$3$$    |
| $$\{s, b\}$$    | $$s \to a$$, $$b \to t$$              | $$2$$    |
| $$\{s, a, b\}$$ | $$a \to t$$, $$b \to t$$              | $$2$$    |

For $$A = \{s, b\}$$, the edge $$a \to b$$ runs from $$B$$ back into $$A$$, so it doesn't count.

### Every cut bounds every flow

Take any flow and any cut. Each unit that leaves $$s$$ ends at $$t$$, so it crosses from $$A$$ to $$B$$. If it ever crosses back from $$B$$ to $$A$$, it has to cross forward again. Adding up conservation over the vertices of $$A$$ makes this exact:

$$\text{value} = f(A \to B) - f(B \to A) \le c(A \to B).$$

So **every flow is at most every cut**. In the example, the cut $$A = \{s\}$$ has capacity $$2$$, so no flow can beat $$2$$, and the flow of $$2$$ we found is maximum.

### The max-flow min-cut theorem

A **min cut** is a cut of the smallest capacity. The definition involves no flow at all: it is the narrowest bottleneck between $$s$$ and $$t$$. The theorem says flow fills it exactly.

> **Max-flow min-cut theorem.** The maximum flow value equals the minimum cut capacity.

The proof starts from the moment augmenting paths run out. Let $$A$$ be the set of vertices reachable from $$s$$ in the residual graph, and $$B$$ the rest. $$t$$ is in $$B$$, or there would be an augmenting path. Now look at the edges between the two groups:

- **An edge $$u \to v$$ from $$A$$ to $$B$$ is full.** If it had room left, $$v$$ would be reachable.
- **An edge $$v \to u$$ from $$B$$ to $$A$$ carries nothing.** If it carried flow, its reverse edge $$u \to v$$ would have room, and $$v$$ would be reachable.

So $$\text{value} = f(A \to B) - f(B \to A) = c(A \to B) - 0$$. This flow equals this cut. Since no flow exceeds any cut, the flow is a maximum and the cut is a minimum. The same argument shows that Ford–Fulkerson is correct: when it can't find an augmenting path, the flow is maximum.

### Reading the min cut off the flow

The proof is also an algorithm. After the max flow, a BFS from $$s$$ over edges with residual capacity left finds $$A$$:

```cpp
// after maxflow(s, t): the source side A of a minimum cut
vi reachable(int s) {
    vi seen(k, 0);
    queue<int> q;
    q.push(s);
    seen[s] = 1;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : Adj[u])
            if (!seen[v] && capacity[u][v] > 0) {
                seen[v] = 1;
                q.push(v);
            }
    }
    return seen;
}
```

The cut edges are the original edges $$u \to v$$ with `seen[u]` set and `seen[v]` not. All of them are full.

## Bipartite Matching Is a Max Flow {#bipartite-matching}

### Matchings

A graph is **bipartite** if its vertices split into two sides, $$L$$ and $$R$$, with every edge going between the sides and none inside a side. The two sides can have different sizes. A typical example: $$L$$ is a set of workers, $$R$$ a set of jobs, and an edge means the worker can do the job.

A **matching** is a set of edges with no shared endpoint: each worker gets at most one job, and each job at most one worker. A **maximum matching** has as many edges as possible.

The rest of the page uses one running example. $$L = \{u_1, u_2, u_3\}$$, $$R = \{v_1, v_2, v_3\}$$, and the edges are $$u_1 v_1$$, $$u_1 v_2$$, $$u_1 v_3$$, $$u_2 v_2$$, $$u_3 v_2$$. Worker $$u_1$$ can do every job, while $$u_2$$ and $$u_3$$ can only do $$v_2$$. A maximum matching has $$2$$ edges, for example $$u_1 v_1$$ and $$u_2 v_2$$. A third is impossible, because $$u_2$$ and $$u_3$$ both need $$v_2$$.

### The network

Turn the bipartite graph into a flow network:

1. Add a source $$S$$ with an edge $$S \to u$$ of capacity $$1$$ for every $$u \in L$$.
2. Add a sink $$T$$ with an edge $$v \to T$$ of capacity $$1$$ for every $$v \in R$$.
3. Direct every original edge from $$L$$ to $$R$$, with capacity $$1$$.

The maximum matching has exactly as many edges as the max flow, and the matched pairs are the $$L \to R$$ edges that carry flow.

### Why the two are equal

**A matching gives a flow.** For each matched pair $$(u, v)$$, send one unit along $$S \to u \to v \to T$$. No vertex is in two pairs, so no edge carries more than $$1$$, and conservation holds. A matching with $$k$$ edges gives a flow of value $$k$$.

**An integer flow gives a matching.** With integer flow and capacity $$1$$ everywhere, each edge carries $$0$$ or $$1$$. A vertex $$u \in L$$ has a single incoming edge, $$S \to u$$, of capacity $$1$$. So at most one unit leaves it, and $$u$$ is matched to at most one vertex. In the same way, $$v \in R$$ has a single outgoing edge of capacity $$1$$, so at most one unit enters it. A flow of value $$k$$ crosses from $$L$$ to $$R$$ on exactly $$k$$ edges, and they form a matching.

The second direction needs an **integer** flow, and [integrality](#integrality) provides one. Without it, a max flow could split. Take a square, with $$u_1$$ and $$u_2$$ both joined to $$v_1$$ and $$v_2$$. Putting $$1/2$$ on each of the four middle edges is a max flow of value $$2$$, and it is no matching. But an integer max flow of the same value also exists, and augmenting paths find that one.

### In practice

- **Speed.** On this network, with every capacity $$1$$, Dinic's algorithm runs in $$O(E\sqrt{V})$$, the same bound as the specialized Hopcroft–Karp algorithm. For small graphs, **Kuhn's algorithm** (one DFS per left vertex, looking for an augmenting path) is the shortest code.
- **Weights.** Plain max flow ignores costs. To find the cheapest or heaviest assignment, put the weights on the edges as costs and use min-cost max flow, or the Hungarian algorithm.

## Vertex Cover and Independent Set {#vertex-cover}

### Vertex covers

A **vertex cover** is a set of vertices that touches every edge: each edge has at least one endpoint in the set. Picture guards standing on vertices, each watching every edge at their vertex. A **minimum vertex cover** uses as few guards as possible.

In a bipartite graph, all of $$L$$ is a cover, since every edge has an end in $$L$$, and so is all of $$R$$. So the minimum cover is never larger than the smaller side. It can be smaller still by mixing vertices from both sides. In the running example, either whole side costs $$3$$, but $$\{u_1, v_2\}$$ covers all five edges: $$u_1$$ covers its three edges, and $$v_2$$ covers $$u_2 v_2$$ and $$u_3 v_2$$. A cover doesn't have to take the same number of vertices from each side either. A star, one vertex of $$L$$ joined to three of $$R$$, is covered by its center alone.

There is an easy bound between covers and matchings. The edges of a matching share no endpoint, so a cover needs a different vertex for each of them:

$$\text{min vertex cover} \ge \text{max matching}.$$

This is the same shape as "every cut bounds every flow". In the example the two are equal: a matching of $$2$$ and a cover of $$2$$. In a bipartite graph they always are.

### König's theorem

> **König's theorem.** In a bipartite graph, the maximum matching and the minimum vertex cover have the same size.

The proof is a min cut on the matching network, with one change: give every middle edge $$u \to v$$ capacity $$\infty$$. The max flow stays the same, because $$u$$ still receives at most one unit from $$S$$ and so can't pass on more than one.

What changes is which cuts are cheap. A cut with finite capacity can't contain an $$\infty$$ edge, so it never cuts a middle edge. It can only cut edges $$S \to u$$ and $$v \to T$$, each of capacity $$1$$. Read each one as choosing a vertex:

- cutting $$S \to u$$ chooses $$u$$,
- cutting $$v \to T$$ chooses $$v$$.

The capacity of the cut is then the number of chosen vertices. Now the two directions:

**A finite cut chooses a cover.** Suppose some edge $$(u, v)$$ had neither end chosen. Then $$S \to u$$ and $$v \to T$$ are both intact, and $$u \to v$$ can't be cut. The path $$S \to u \to v \to T$$ still connects $$S$$ to $$T$$, so this was not a cut after all.

**A cover gives a cut of the same size.** Given a cover $$C$$, put $$S$$, the left vertices outside $$C$$, and the right vertices inside $$C$$ into $$A$$, and everything else into $$B$$. The edges from $$A$$ to $$B$$ are $$S \to u$$ for each $$u \in L \cap C$$, and $$v \to T$$ for each $$v \in R \cap C$$. A middle edge from $$A$$ to $$B$$ would join a left vertex outside $$C$$ to a right vertex outside $$C$$, an edge $$C$$ fails to cover. So the cut has capacity exactly $$\lvert C \rvert$$.

So the minimum cut is the minimum vertex cover, and the whole chain reads

$$\text{max matching} = \text{max flow} = \text{min cut} = \text{min vertex cover}.$$

Here is the cut for the cover $$\{u_1, v_2\}$$:

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

Its sides are $$A = \{S, u_2, u_3, v_2\}$$ and $$B = \{u_1, v_1, v_3, T\}$$. Checking every edge against the rule that only $$A \to B$$ counts:

| Edge                             | From | To  | Cut?                   |
| -------------------------------- | ---- | --- | ---------------------- |
| $$S \to u_1$$                    | A    | B   | yes, $$1$$             |
| $$S \to u_2$$, $$S \to u_3$$     | A    | A   | no, inside $$A$$       |
| $$u_2 \to v_2$$, $$u_3 \to v_2$$ | A    | A   | no, inside $$A$$       |
| $$v_2 \to T$$                    | A    | B   | yes, $$1$$             |
| $$u_1 \to v_1$$, $$u_1 \to v_3$$ | B    | B   | no, inside $$B$$       |
| $$u_1 \to v_2$$                  | B    | A   | no, it points backward |
| $$v_1 \to T$$, $$v_3 \to T$$     | B    | B   | no, inside $$B$$       |

Two edges are cut, for a capacity of $$2$$. Notice that $$A$$ contains a whole path, $$S \to u_2 \to v_2$$. That is fine: a cut never removes edges inside a group. Flow can move around inside $$A$$ freely, but with both edges from $$A$$ to $$B$$ gone, none of it reaches $$T$$.

The theorem needs the graph to be bipartite. A triangle has a maximum matching of $$1$$, but covering its three edges takes $$2$$ vertices.

### Finding the cover

After the max flow on the network with $$\infty$$ middle edges, `reachable(S)` from the [min cut section](#min-cut) returns the source side $$A$$ of a minimum cut. The cover is the left vertices it **didn't** reach, plus the right vertices it **did**: $$(L \setminus A) \cup (R \cap A)$$.

On the running example, say the max flow sends $$u_1 \to v_1$$ and $$u_2 \to v_2$$. From $$S$$, only $$S \to u_3$$ has room left. From $$u_3$$ the search crosses to $$v_2$$, and from $$v_2$$ it goes back to $$u_2$$ along the reverse of $$u_2 \to v_2$$. It reaches nothing else, so $$A = \{S, u_2, u_3, v_2\}$$, exactly the cut in the figure, and the cover is $$\{u_1, v_2\}$$. Checked against brute force on $$3000$$ random bipartite graphs, this cover always covers every edge and always has the minimum size.

### Maximum independent set

An **independent set** is a set of vertices with no edge between any two of them. It is the mirror image of a cover:

- Take any vertex cover. No edge can join two vertices outside it, since that edge would be uncovered. So the vertices outside a cover form an independent set.
- Take any independent set. Every edge has at most one end inside it, so at least one end outside. So the vertices outside an independent set form a cover.

So in any graph, $$\text{max independent set} = \lvert V \rvert - \text{min vertex cover}$$. In a bipartite graph, König's theorem turns that into something one max flow computes:

$$\text{max independent set} = \lvert L \rvert + \lvert R \rvert - \text{max matching}.$$

In the running example, that is $$6 - 2 = 4$$, for instance $$\{u_2, u_3, v_1, v_3\}$$. On general graphs, both maximum independent set and minimum vertex cover are NP-hard. Being bipartite is what makes them easy.

The classic use is choosing as many things as possible with no two in conflict, when the conflicts happen to be bipartite. In [LeetCode 1349 — Maximum Students Taking Exam](https://leetcode.com/problems/maximum-students-taking-exam/), a student can copy from the seats to the left, right, upper left, and upper right. Every such pair of seats is in neighboring columns. Color the columns alternately, and every conflict joins the two colors, so the conflict graph is bipartite. The most students is the number of usable seats minus a maximum matching.

### More counts from one matching

Two more quantities reduce to a maximum matching:

- **Minimum edge cover.** This is the fewest edges that touch every vertex, in a graph with no isolated vertex. It equals $$\lvert V \rvert - \text{max matching}$$ in any graph. Take a maximum matching, then add one edge for each vertex it leaves out.
- **Minimum path cover of a DAG.** This is the fewest vertex-disjoint paths that cover every vertex. Split each vertex $$v$$ into $$v_{\text{out}}$$ on the left and $$v_{\text{in}}$$ on the right, and turn each edge $$u \to v$$ into $$u_{\text{out}}\, v_{\text{in}}$$. Each matched edge joins two paths into one, so the answer is $$n - \text{max matching}$$.

## Change the Units {#change-the-units}

With the theory in place, here is a problem where all of the difficulty is in the modeling.

### The problem

[Codeforces 653D — Delivery Bears](https://codeforces.com/problemset/problem/653/D). A directed graph has $$n \le 50$$ vertices and $$m \le 500$$ edges, and edge $$i$$ can carry at most $$c_i \le 10^6$$ units of weight in total. Exactly $$x \le 10^5$$ bears walk from vertex $$1$$ to vertex $$n$$, each on a simple path of its own. Every bear carries the **same** weight $$w$$, and the bears crossing an edge may not carry more than its capacity together. Maximize the total weight $$x \cdot w$$.

The first sample has $$x = 3$$ bears and four edges:

| Edge        | Capacity |
| ----------- | -------- |
| $$1 \to 2$$ | $$2$$    |
| $$2 \to 4$$ | $$1$$    |
| $$1 \to 3$$ | $$1$$    |
| $$3 \to 4$$ | $$2$$    |

The answer is $$1.5$$.

### A flow of weight is not enough

Weight moves from $$1$$ to $$n$$ through edges with capacities, so the first idea is a max flow with capacities $$c_i$$. On the sample it is $$2$$, one unit along $$1 \to 2 \to 4$$ and one along $$1 \to 3 \to 4$$. But the answer is $$1.5$$.

A flow can split weight into any pieces it likes, and bears can't. Three bears with equal loads have to share two paths. One path gets two bears, so its capacity-$$1$$ edge forces $$2w \le 1$$. That makes $$w = 1/2$$ and the total $$1.5$$. The flow of weight is only an upper bound.

### Fix the load, count the bears

Suppose we already knew $$w$$. Edge $$i$$ then fits at most $$\lfloor c_i / w \rfloor$$ bears. Use that as its capacity, and the network is measured in bears instead of weight. Its max flow from $$1$$ to $$n$$ is the largest number of bears that can make the trip.

A natural worry is that we don't know how many bears $$k_i$$ should cross each edge. We don't need to. Each edge only gets an upper limit, and the max flow chooses the $$k_i$$ itself. By [integrality](#integrality), an integer max flow of $$F$$ splits into $$F$$ simple paths, one per bear. If $$F \ge x$$, send any $$x$$ of them.

### Binary search on the load

A lighter load can only fit more bears. As $$w$$ shrinks, every $$\lfloor c_i / w \rfloor$$ grows or stays the same, so the max flow can only grow. The loads that work form an interval $$(0, w^\ast]$$, and binary search finds its end. This is the move from [Search D, Not x](/blog/binary-search/#search-d-not-x): instead of searching over how to route the bears, search over the answer, because "can $$x$$ bears carry $$w$$ each?" is monotone in $$w$$.

On the sample, $$w = 1/2$$ gives capacities of $$4, 2, 2, 4$$ bears, and all $$3$$ bears get through. Any $$w > 1/2$$ leaves the two capacity-$$1$$ edges with one bear each, so only $$2$$ get through. So $$w^\ast = 1/2$$, and the answer is $$3 \cdot 1/2 = 1.5$$.

The max flow only changes where some $$\lfloor c_i / w \rfloor$$ does, at $$w = c_i / k$$. So $$w^\ast$$ is exactly $$c_i / k$$ for some edge $$i$$ and some $$k \le x$$. Trying those fractions from the largest down gives an exact answer to test against. On $$400$$ random small graphs the code below agreed with it every time.

### The code

This uses `bfs` and `maxflow` from [Max Flow](#max-flow):

```cpp
const int MAX_ITER = 100;

int n, m, x;

struct Edge { int from, to, cap; };
vector<Edge> edges;

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

Three details:

- **`min<double>(x, c / w)`.** No edge ever needs more than $$x$$ bears. The cap also prevents a bug: when $$w$$ is tiny, $$c / w$$ is far past `INT_MAX`, and converting an out-of-range `double` to `int` is undefined behavior.
- **A fixed number of iterations.** Each step halves the interval, and after $$100$$ of them $$w$$ is as precise as a `double` can be. A loop like `while (right - left > eps)` can run forever instead. Near $$10^6$$, neighboring doubles are about $$2 \cdot 10^{-10}$$ apart, so with `eps = 1e-12` the interval stops shrinking long before it gets that small.
- **The output is $$w \cdot x$$.** The judge accepts a relative error of $$10^{-6}$$, and multiplying by $$x$$ leaves the relative error of $$w$$ unchanged.

> **The pattern worth naming.** When every unit must have the same size, fix the size and count units. Binary search the size, divide each capacity by it and round down, and max flow counts how many units fit. You never decide how many units cross an edge. The flow does.

## Practice {#practice}

**Max Flow**

- [CSES 1694 — Download Speed](https://cses.fi/problemset/task/1694) (the max flow template)
- [CSES 1711 — Distinct Routes](https://cses.fi/problemset/task/1711) (edge-disjoint paths, printed)

**Min Cut**

- [CSES 1695 — Police Chase](https://cses.fi/problemset/task/1695) (print the edges of a min cut)

**Bipartite Matching Is a Max Flow**

- [CSES 1696 — School Dance](https://cses.fi/problemset/task/1696) (maximum matching, printed)

**Vertex Cover and Independent Set**

- [LeetCode 1349 — Maximum Students Taking Exam](https://leetcode.com/problems/maximum-students-taking-exam/) (maximum independent set on a bipartite conflict graph)

**Change the Units**

- [Codeforces 653D — Delivery Bears](https://codeforces.com/problemset/problem/653/D)

**Next: min-cost flow**

- [VNOJ MINCOST](https://oj.vnoi.info/problem/mincost) (the fourth model at the top)

## Further reading {#further-reading}

- [cp-algorithms — Maximum flow: Ford–Fulkerson and Edmonds–Karp](https://cp-algorithms.com/graph/edmonds_karp.html), with the residual graph and the integrality argument.
- [cp-algorithms — Dinic's algorithm](https://cp-algorithms.com/graph/dinic.html), the faster template.
- [cp-algorithms — Kuhn's algorithm for maximum bipartite matching](https://cp-algorithms.com/graph/kuhn_maximum_bipartite_matching.html).
- [Wikipedia — Max-flow min-cut theorem](https://en.wikipedia.org/wiki/Max-flow_min-cut_theorem).
- [Wikipedia — König's theorem](https://en.wikipedia.org/wiki/K%C5%91nig%27s_theorem_%28graph_theory%29), with the proof through flows and the construction of the cover.
- Jeff Erickson, [_Algorithms_](https://jeffe.cs.illinois.edu/teaching/algorithms/), the chapters on maximum flows and minimum cuts and on their applications.
