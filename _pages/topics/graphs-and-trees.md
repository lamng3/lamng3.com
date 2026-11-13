---
layout: post
title: "Graphs and Trees"
description: "Dependency graphs and trees. Kahn's algorithm kept as a live invariant resolves definitions as they arrive, and on a tree, counting by the vertex where three paths meet turns a triple loop into one pass. A colored tree orients its own edges. And an Euler tour, a sparse table, blocks and bitmasks together answer LCA in O(1) after O(n) preprocessing."
permalink: /blog/graphs-and-trees/
last_updated: 2026-11-13
author: Lam Nguyen
toc:
  sidebar: right
---

Dependency graphs and trees. Kahn's algorithm kept as a live invariant resolves definitions as they arrive, and on a tree, counting by the vertex where three paths meet turns a triple loop into one pass. A colored tree orients its own edges. And an Euler tour, a sparse table, blocks and bitmasks together answer LCA in O(1) after O(n) preprocessing.

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

## Topological Order, One Entry at a Time {#topological-order}

[LeetCode 3481 — Apply Substitutions](https://leetcode.com/problems/apply-substitutions/) hands you a mapping of keys to values, where a value may itself mention other keys as `%KEY%`, plus a text full of placeholders. Expand everything.

The constraints are deliberately tiny — at most 10 keys, values of at most 8 characters, and an explicit promise of no cyclic dependencies. So the problem as stated is a few lines. But the _shape_ of it — values that reference other values, resolvable only in dependency order — is the shape of a build system, a CI config loader, a shell's variable expansion, and every template engine. That shape is worth building a component for rather than an answer.

### The one-shot answer, and what it assumes

If every definition is in hand before you start, expand recursively and memoize:

```cpp
string expand(const string& k) {
    if (mp.contains(k)) return mp[k];        // already done
    string res = "";
    for (auto& [lit, key] : parse(raw[k]))   // literal chunks and placeholders
        res += lit + (key.empty() ? "" : expand(key));
    return mp[k] = res;
}
```

This is correct and runs in time linear in the total output size. The recursion _is_ a depth-first topological sort — the memo table is the "finished" mark, and a key's value is written only after all of its dependencies have been written.

Three assumptions are buried in it, though:

| Assumption                                  | What breaks without it                                                                                         |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Every key is defined before the first query | `raw[k]` silently default-constructs to `""`, and a missing definition expands to nothing instead of erroring  |
| No cycles                                   | Infinite recursion, then a stack overflow — the constraints promise this away, nothing in the code enforces it |
| You only ever ask for the final answer      | No way to ask "is this resolvable _yet_?" between definitions                                                  |

Drop the first assumption and the problem genuinely changes. Suppose definitions arrive one at a time, in arbitrary order — `C` may reference `B` before `B` exists — and you must answer questions in between. You no longer want a function. You want a **data structure** that holds a partially-resolved world and repairs itself on every insertion.

### The dependency graph

Let $$K$$ be the set of keys. Write $$\text{raw}(k)$$ for the literal value of $$k$$ and

$$
D(k) = \{\, d \in K : \texttt{\%}d\texttt{\%} \text{ occurs in } \text{raw}(k) \,\}
$$

for its **dependency set**. The fully expanded value is then defined by the mutual recursion

$$
\text{val}(k) = \text{raw}(k)\Big[\ \texttt{\%}d\texttt{\%} \mapsto \text{val}(d)\ \ \text{for each } d \in D(k)\ \Big],
$$

which is well-defined precisely when the dependency relation is acyclic.

Now orient an edge $$d \to k$$ whenever $$d \in D(k)$$ — read it as "$$d$$ must be resolved before $$k$$ can be." A legal resolution order is exactly a topological order of this DAG. **Mind the direction:** edges run from dependency to dependent, the reverse of how you'd naturally write `C depends on B`. That orientation is the point — it lets a newly resolved key _push_ progress forward to everything waiting on it, which is what makes the structure incremental rather than something you re-run from scratch.

Let $$R \subseteq K$$ be the set of keys resolved so far, and define

$$
\operatorname{indeg}(k) = \big|\, D(k) \setminus R \,\big|
$$

— the number of $$k$$'s dependencies that are **still pending**. Then the resolution rule is a single line:

$$
\operatorname{indeg}(k) = 0 \iff k \text{ is resolvable right now.}
$$

### Kahn's algorithm as a live invariant

Textbook [Kahn's algorithm](https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm) is a batch procedure: compute every indegree, seed a queue with the zeros, then pop and decrement until the queue empties. Here the graph isn't known up front — it _grows_. The move is to stop thinking of Kahn's as a procedure you run and start thinking of its state as an **invariant you maintain**.

Two invariants carry the whole design:

> **I1.** `mp` contains exactly the fully resolved keys. No value stored in `mp` contains a placeholder.
>
> **I2.** For every known key $$k$$, `indeg[k]` equals the number of $$k$$'s dependencies not yet in `mp`.

Every insertion must leave both true. Here is `add`, and the subtle line is the `continue`:

```cpp
void add(const string& k, const string& v) {
    raw[k] = v;
    indeg[k] = 0;
    for (auto& d : get_keys(v)) {
        if (mp.contains(d)) continue;   // already resolved — folded in at fill time, no edge
        Adj[d].pb(k);                   // reverse edge: dependency -> dependent
        indeg[k]++;
    }
    if (indeg[k] == 0) resolve(k);      // nothing pending — resolve, and cascade
}
```

A dependency that is **already resolved contributes nothing**: no edge, no indegree. It needs no edge because its value is already sitting in `mp`, so the substitution pass will pick it up directly; and counting it would violate I2, which counts only _pending_ dependencies. Only unresolved dependencies get tracked. That one `continue` is what keeps the indegree meaningful across a stream of insertions instead of a single batch.

And if nothing is pending, $$k$$ is resolvable immediately — so resolve it, which may unblock others.

### The cascade

`resolve` is Kahn's main loop, seeded with a single node instead of every source:

```cpp
void resolve(const string& s) {
    queue<string> q; q.push(s);
    while (!q.empty()) {
        auto u = q.front(); q.pop();
        mp[u] = fill_value(raw[u]);     // every dep of u is in mp, so this is complete
        for (auto& v : Adj[u]) {
            indeg[v]--;                 // u is no longer pending for v
            if (indeg[v] == 0) q.push(v);
        }
        Adj.erase(u);                   // u's outgoing edges are spent
    }
}
```

When $$u$$ resolves, every dependent $$v$$ loses one pending dependency. Those that drop to zero become resolvable and are enqueued, transitively. Termination is immediate: a key is enqueued only when its indegree _reaches_ zero, which happens at most once, so each key is processed at most once and the loop is $$O(\lvert K \rvert + \lvert E \rvert)$$ across the structure's whole lifetime — amortized across all the `add` calls, not per call.

**Forward references fall out for free.** Add a key whose dependencies don't exist yet and it simply sits with a positive indegree, parked in the adjacency lists of keys that haven't arrived. When the last missing dependency finally shows up, its `resolve` cascade reaches the waiting key and finishes it. Nothing special-cases the out-of-order case; the invariant does it.

Here is the trace on Example 2 with the definitions arriving in the most hostile order — `C` first, referencing a `B` that doesn't exist yet, and `A` last:

| Step               | `mp` (resolved)            | `indeg`    | pending edges `Adj` |
| ------------------ | -------------------------- | ---------- | ------------------- |
| `add(C, "abc%B%")` | —                          | `C:1`      | `B → [C]`           |
| `add(B, "ace")`    | `B: ace`, then `C: abcace` | `B:0, C:0` | —                   |
| `add(A, "bce")`    | `A: bce`                   | `A:0`      | —                   |

The second insertion does the real work: `B` has no dependencies, so it resolves at once; that drops `indeg[C]` to zero, so `C` resolves in the same cascade and picks up `mp[B]` — even though `C` was defined before `B` existed. `substitute("%A%_%B%_%C%")` then returns `bce_ace_abcace`.

### Keeping the placeholder

The substitution pass makes one choice worth calling out. When it meets a key that isn't resolved, it writes the placeholder back out unchanged:

```cpp
res += mp.contains(run) ? mp[run] : "%" + run + "%";
```

That single ternary is what makes partial substitution **total**: `substitute` is always callable, never throws, never silently drops text, and — crucially — its output is a valid _input_ to a later `substitute`. Running it again after more definitions arrive makes strictly more progress, and running it on fully resolved text is a no-op. So a caller has two honest strategies, and `ready` lets it pick:

```cpp
bool ready(const string& text) {
    for (auto& d : get_keys(text)) if (!mp.contains(d)) return false;
    return true;
}
```

Ask first and block until `ready`, or substitute optimistically now and re-run later. Had the unresolved case thrown, or expanded to the empty string, neither strategy would be available — the output would stop being re-feedable, and a missing definition would become indistinguishable from an empty one.

### The check: what is stuck, and why

Since `indeg[k] > 0` means "waiting on something," the blocked set is a one-liner:

```cpp
vector<string> stuck() {
    vector<string> res;
    for (auto& [k, v] : indeg) if (v > 0) res.pb(k);
    return res;
}
```

This is the diagnostic the batch recursion cannot give you: it reports _who_ is blocked, not just that something went wrong. But it conflates two genuinely different failures, and they want different fixes:

- a dependency was **never defined** — the caller forgot an entry, or typed a key wrong;
- a **cycle** — the definitions are contradictory and no amount of waiting will help.

Distinguishing them rests on a small fact about finite DAGs: **every finite non-empty DAG has a source.** So if some keys are blocked and no definition is missing, the pending subgraph has no source, and therefore contains a cycle. Missing definitions are the easy half:

```cpp
vector<string> missing() {               // referenced somewhere, never defined
    set<string> res;
    for (auto& [k, v] : raw)
        for (auto& d : get_keys(v))
            if (!raw.contains(d)) res.insert(d);
    return vector<string>(all(res));
}
```

For cycles, a depth-first search over the _forward_ relation (key → its dependencies) finds a back edge, and the gray stack above it **is** the cycle — which is far more useful to report than a bare "cycle detected":

```cpp
// color: 0 = unvisited, 1 = on the current path (gray), 2 = done (black)
bool find_cycle(const string& u, map<string,int>& color,
                vector<string>& path, vector<string>& cyc) {
    color[u] = 1; path.pb(u);
    for (auto& d : get_keys(raw[u])) {
        if (!raw.contains(d)) continue;                      // missing, not a cycle
        if (color[d] == 1) {                                 // back edge to the path
            cyc.assign(find(all(path), d), path.end());      // the cycle itself
            return true;
        }
        if (color[d] == 0 && find_cycle(d, color, path, cyc)) return true;
    }
    color[u] = 2; path.pop_back();
    return false;
}
```

Note the asymmetry: `resolve` pushes forward along `Adj` (dependency → dependent) because progress flows that way, while cycle detection walks backward along `D(k)` (dependent → dependency) because that is the direction a _reason_ flows. Same relation, two orientations, each used where it reads naturally.

### Where it breaks

Being honest about the edges of a structure is part of designing it. Four real limits:

| Limitation                      | What happens                                                                                                                                                                                | Why it's hidden here                                  |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| **Re-adding a key**             | `add` resets `indeg[k] = 0`, but stale edges to `k` still sit in other keys' `Adj` lists. A later `resolve` decrements past zero, the `== 0` test never fires, and `k` is never re-resolved | LeetCode guarantees "all replacement keys are unique" |
| **Stale downstream values**     | Even with re-adding fixed, keys already resolved _from_ the old value keep their old expansion — invalidation has to cascade too                                                            | Same guarantee                                        |
| **No escape for a literal `%`** | `%%` is read as an empty key, and an unbalanced trailing `%` is dropped by both the scanner and the filler                                                                                  | Values are drawn from a restricted alphabet           |
| **Exponential output**          | A value like `%B%%B%` doubles its dependency's length, so $$n$$ chained keys can expand to $$\Theta(2^n)$$ characters                                                                       | Values cap at 8 characters and $$n \le 10$$           |

That last one is worth internalizing: the structure is linear in the **output** size, not the input size, and those can be exponentially far apart. A real template engine either shares expansions by reference instead of copying strings, or caps the total expansion.

Fixing the first two means versioning the edges — stamp each adjacency entry with the generation of the key that created it and ignore entries from a stale generation — then re-running the cascade in _invalidate_ mode before re-running it in resolve mode. That is a genuinely different structure, and it is where incremental build systems actually live.

One more design note, on representation. `Adj` here is a `map<string, vector<string>>` — a node-keyed adjacency list with a `map` lookup per edge traversal. That is the right call _because_ the structure is streaming: nodes appear mid-run, keys are strings rather than dense indices, and `Adj.erase(u)` reclaims a node's edges once they are spent. If the key set were known up front and dense, the same graph would be far better laid out as [Compressed Sparse Row](/blog/databases/#compressed-sparse-row) — one contiguous array of neighbors plus one offset per node, which is both smaller and cache-friendly. But CSR needs the whole edge list before it can compute offsets, which is exactly the assumption a streaming structure gives up. The flexibility has a price, and it is worth knowing which one you are paying.

> **The pattern worth naming.** Converting a batch graph algorithm into an incrementally maintained one is a move that generalizes well beyond substitution. The recipe: identify the algorithm's working state (here, `indeg` plus the queue), promote it to an invariant of the data structure, then show that each mutation restores the invariant in time proportional to the damage done rather than to the whole graph. Incremental topological order is the classic instance — it is what `make` and every modern build system compute when a file changes, what a spreadsheet does when you edit a cell that other formulas reference, and what a dataflow framework does to schedule operators.

### Implementation

The full structure. `get_keys` collects the dependencies of a value by toggling on `%`; `fill_value` does one substitution pass, keeping unresolved placeholders intact; `add` maintains I1 and I2; `resolve` runs the cascade.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
class StreamingSubstitutor {
private:
    map<string,vector<string>> Adj;   // dependency -> dependents (reverse edges)
    map<string,string> raw, mp;       // literal values; fully resolved values
    map<string,int> indeg;            // number of dependencies still pending

    vector<string> get_keys(const string& s) {
        set<string> st;
        string run = "";
        bool started = false;
        for (auto& c : s) {
            if (c == '%') {
                if (started) st.insert(run);
                run = "";
                started = !started;
            }
            else if (started) run += c;
        }
        return vector<string>(all(st));
    }

    string fill_value(const string& s) {
        string res = "", run = "";
        bool started = false;
        for (auto& c : s) {
            if (c == '%') {
                if (!started) res += run;
                // keep placeholder if not resolvable
                else res += mp.contains(run) ? mp[run] : "%" + run + "%";
                run = "";
                started = !started;
            }
            else run += c;
        }
        if (!run.empty()) res += run;
        return res;
    }

    void resolve(const string& s) {
        queue<string> q; q.push(s);
        while (!q.empty()) {
            auto u = q.front(); q.pop();
            mp[u] = fill_value(raw[u]);
            for (auto& v : Adj[u]) {
                indeg[v]--;
                if (indeg[v] == 0) q.push(v);
            }
            Adj.erase(u);
        }
    }

public:
    void clear() { Adj.clear(); raw.clear(); mp.clear(); indeg.clear(); }

    void add(const string& k, const string& v) {
        raw[k] = v;
        indeg[k] = 0;
        for (auto& d : get_keys(v)) {
            if (mp.contains(d)) continue;
            Adj[d].pb(k); // reverse
            indeg[k]++;
        }
        if (indeg[k] == 0) resolve(k);
    }

    bool ready(const string& text) {
        for (auto& d : get_keys(text)) if (!mp.contains(d)) return false;
        return true;
    }

    string substitute(const string& text) { return fill_value(text); }

    vector<string> stuck() { // missing defs or cycles
        vector<string> res;
        for (auto& [k, v] : indeg) if (v > 0) res.pb(k);
        return res;
    }
};

class Solution {
public:
    string applySubstitutions(vector<vector<string>>& replacements, string text) {
        StreamingSubstitutor ssub;
        for (auto& r : replacements) ssub.add(r[0], r[1]);
        return ssub.substitute(text);
    }
};
```

</details>

Against the judge, `applySubstitutions` just feeds the pairs in and asks for the text — the streaming machinery is invisible, and the no-cycle guarantee means `stuck()` is always empty. The structure earns its keep the moment definitions stop arriving all at once.

### The takeaway

The problem says "apply substitutions." The structure underneath says **topological order**, and once you see that, the interesting question stops being "what is the answer" and becomes "what state do I keep between insertions." Three choices did the work here: edges oriented dependency → dependent so progress flows forward; indegree counting only _pending_ dependencies so it stays meaningful mid-stream; and unresolved placeholders preserved verbatim so partial output stays re-feedable. None of them are needed to pass the judge. All of them are what separates an answer from a component. When the graph is known up front and each node should be combined once, that same order is [DP on a DAG](/blog/dynamic-programming/#dp-on-a-dag).

## Counting on Trees: The Meeting Vertex {#meeting-vertex}

The substitution problem walks a graph in dependency order. On a tree there is a different way to organize the work: pick the vertex where things meet, and count from there.

[Codeforces 2241E](https://codeforces.com/contest/2241/problem/E) gives a tree on $$n$$ vertices with a value $$a_x$$ on each vertex. Write $$p(x, y)$$ for the product of the values along the simple path from $$x$$ to $$y$$. Count the unordered triplets $$\{u, v, w\}$$ for which

$$
p(u, v)\cdot p(v, w)\cdot p(w, u)
$$

is a perfect square. The product ranges over paths, so it looks like it depends on the whole triangle; it does not. It depends on one vertex.

### The three paths share exactly one vertex

Fix a triplet $$\{u, v, w\}$$ and look at how many of the three paths $$P(u,v)$$, $$P(v,w)$$, $$P(w,u)$$ each vertex lies on.

> **Lemma.** There is exactly one vertex $$c$$ that lies on all three paths, and every other vertex lies on $$0$$ or $$2$$ of them.

**A vertex on all three exists.** If one of the triplet, say $$w$$, already lies on $$P(u,v)$$, take $$c = w$$: both $$P(w,u)$$ and $$P(w,v)$$ pass through $$w$$, and $$w \in P(u,v)$$ by assumption. Otherwise walk from $$w$$ toward $$P(u,v)$$; since the graph is a tree there is a unique first vertex $$c$$ where the walk meets that path. Every route from $$w$$ into $$P(u,v)$$ goes through $$c$$, so $$P(w,u)$$ and $$P(w,v)$$ both contain $$c$$, and $$c \in P(u,v)$$ by construction.

**It is unique.** Suppose $$x$$ lies on all three paths. From $$x \in P(w,u)$$ and $$x \in P(u,v)$$, the route from $$w$$ to $$x$$ enters $$P(u,v)$$ at $$x$$. But the first entry point from $$w$$ into $$P(u,v)$$ is $$c$$, so $$x = c$$.

**Everyone else is on $$0$$ or $$2$$.** Take $$x \ne c$$ and delete it; the tree breaks into components. If $$u, v, w$$ all land in one component, no pairwise path uses $$x$$, so $$x$$ is on $$0$$ paths. If they split across exactly two components, exactly two of the three pairs are separated by $$x$$, so $$x$$ is on $$2$$. If they split across three components, $$x$$ would separate all three pairs and hence lie on all three paths — making $$x$$ the unique common vertex, contradicting $$x \ne c$$. $$\blacksquare$$

That vertex $$c$$ is the Steiner point of the triplet. Counting edges the same way, each edge lies on $$0$$ or $$2$$ of the three paths, which gives the weight of the smallest subtree joining the triplet in [LeetCode 3553](#lca-3553).

### An LCA restatement: two of the three pairwise LCAs coincide

The $$O(n)$$ solution never computes an LCA — it deletes $$c$$ and counts components — but the meeting vertex has a clean rooted-tree description worth keeping in your pocket.

Root the tree anywhere. The highest vertex on a path $$P(x, y)$$ is $$\operatorname{lca}(x, y)$$, so the three pairwise LCAs are the topmost points of the three paths. Let $$L = \operatorname{lca}(u, v, w)$$ be the shallowest common ancestor of all three. Two cases:

- The three vertices descend into three different child-subtrees of $$L$$ (or one of them _is_ $$L$$). Then every pairwise path climbs all the way to $$L$$, so $$\operatorname{lca}(u,v) = \operatorname{lca}(v,w) = \operatorname{lca}(w,u) = L$$, and the meeting vertex is $$c = L$$.
- Otherwise two of them, say $$u$$ and $$v$$, share a child-subtree of $$L$$ while $$w$$ does not. Then $$\operatorname{lca}(u, v)$$ sits strictly below $$L$$ and equals the meeting vertex $$c$$, while $$\operatorname{lca}(v, w) = \operatorname{lca}(w, u) = L$$.

Either way, **at least two of the three pairwise LCAs are equal, and the deepest of them is the meeting vertex $$c$$.** This is the same $$c$$ as before, seen from the root instead of by deletion.

### Why only $$a_c$$ matters

In the product $$p(u,v)\,p(v,w)\,p(w,u)$$, each vertex $$x$$ contributes $$a_x$$ raised to the number of paths it lies on. Writing $$e_x$$ for that exponent, the lemma says $$e_x \in \{0, 2\}$$ for every $$x \ne c$$ and $$e_c = 3$$:

$$
p(u,v)\,p(v,w)\,p(w,u) = a_c^{3} \prod_{x \ne c} a_x^{e_x}.
$$

Every exponent on the right is even except $$e_c = 3$$, and $$a_c^3 = a_c^2 \cdot a_c$$, so the whole thing is $$a_c$$ times a perfect square. It is a perfect square **iff $$a_c$$ is a perfect square**. The triangle of paths was a distraction; the condition lives entirely at the meeting vertex.

### Counting triplets by their meeting vertex

Every triplet has exactly one meeting vertex, so we can bucket triplets by it without any double counting:

$$
\text{answer} = \sum_{\substack{x \,:\, a_x \text{ is a perfect square}}} \bigl(\text{triplets whose meeting vertex is } x\bigr).
$$

Delete $$x$$ and let the resulting components have sizes $$s_1, s_2, \dots, s_d$$. A triplet meets at $$x$$ in one of two ways:

- **$$x$$ is one of the three chosen vertices.** The other two must sit in _different_ components (otherwise the path between them avoids $$x$$). Count: $$\sum_{i<j} s_i s_j$$.
- **$$x$$ is not chosen.** All three vertices must sit in _different_ components, so that $$x$$ separates every pair. Count: $$\sum_{i<j<\ell} s_i s_j s_\ell$$.

Both sums are **elementary symmetric polynomials** of the component sizes: $$e_2 = \sum_{i<j} s_i s_j$$ and $$e_3 = \sum_{i<j<\ell} s_i s_j s_\ell$$. The contribution of $$x$$ is $$e_2 + e_3$$.

### Elementary symmetric sums, computed online

Evaluating $$e_2$$ and $$e_3$$ term by term is $$O(d^2)$$ and $$O(d^3)$$. A single left-to-right scan gets every $$e_k$$ at once in $$O(d)$$.

Keep $$p_k$$ equal to $$e_k$$ of the prefix seen so far. When a new size $$s$$ arrives, a $$k$$-subset of the extended prefix either omits $$s$$ (already counted in $$e_k$$) or includes $$s$$ alongside a $$(k-1)$$-subset of what came before:

$$
e_k \mathrel{+}= s \cdot e_{k-1}.
$$

Apply this from the largest $$k$$ downward so each update reads the _old_ lower-order values:

```cpp
ll p1 = 0; // e1 = sum s_i
ll p2 = 0; // e2 = sum_{i<j} s_i s_j
ll p3 = 0; // e3 = sum_{i<j<k} s_i s_j s_k

for (ll s : branches) {
    p3 += s * p2;  // (k-1)=2 subsets before, plus s
    p2 += s * p1;  // (k-1)=1 subsets before, plus s
    p1 += s;       // s joins the pool
}
```

The generating-function view makes the invariant obvious: the scan multiplies in one factor at a time of

$$
\prod_{i=1}^{d} (1 + s_i\, t) = \sum_{k \ge 0} e_k\, t^k,
$$

and each line is in-place polynomial multiplication by $$(1 + s\,t)$$, updating coefficients top-down so the low coefficients used on the right are still the previous ones. For an arbitrary cap $$K$$ it generalizes to a knapsack-style loop:

```cpp
vector<ll> dp(K + 1, 0);
dp[0] = 1;
for (ll s : branches)
    for (int k = K; k >= 1; k--)
        dp[k] += dp[k - 1] * s;   // dp[k] = e_k
```

That is $$O(dK)$$, and the top-down inner loop is the standard trick that stops a single element from being used twice. Here $$K = 3$$ suffices, so the three-line version is enough.

### Component sizes in one rooting

The last piece is the component sizes after deleting $$x$$. Root the tree anywhere and compute subtree sizes $$\text{sub}[\cdot]$$ with one DFS. Deleting $$x$$ produces one component per child (the child's subtree, size $$\text{sub}[\text{child}]$$) plus, unless $$x$$ is the root, the everything-else component of size $$n - \text{sub}[x]$$. Feed those sizes into the scan.

Every step — the DFS, and one linear scan of each vertex's incident branches — is linear, so the whole solution is $$O(n)$$.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const int MAXN = 2e5+5;

int A[MAXN];
vi Adj[MAXN];
int sub[MAXN];
int parent[MAXN];

int dfs(int u, int p) {
    sub[u] = 1;
    parent[u] = p;
    for (int v : Adj[u]) {
        if (v == p) continue;
        sub[u] += dfs(v, u);
    }
    return sub[u];
}

void solve() {
    int n; cin >> n;

    REP(i,n) cin >> A[i];

    REP(i,n) Adj[i].clear();
    REP(i,n-1) {
        int u, v; cin >> u >> v;
        u--; v--;
        Adj[u].pb(v);
        Adj[v].pb(u);
    }

    dfs(0,-1);

    ll ans = 0;
    REP(u,n) {
        int x = sqrt(A[u]);
        if (x * x != A[u]) continue;
        // component sizes when u is removed from the tree
        vector<ll> branches;
        for (int v : Adj[u]) {
            if (v == parent[u]) continue;
            branches.pb(sub[v]);
        }
        if (u != 0) branches.pb(n - sub[u]);
        // p2 = pairs (u chosen); p3 = triples (u not chosen)
        ll pref = 0, p2 = 0, p3 = 0;
        for (auto& b : branches) {
            p3 += b * p2;
            p2 += b * pref;
            pref += b;
        }
        ans += p2 + p3;
    }
    cout << ans << '\n';
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    int tt = 1;
    cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

One implementation note: `int x = sqrt(A[u])` can land one off from floating error, so re-check `x*x == A[u]` (and, to be safe on the boundary, you may test `x+1` too). Everything is 64-bit for the products — with $$n$$ up to $$2\cdot10^5$$, a single vertex's $$e_3$$ already overflows 32-bit.

## The Coloring Orients the Tree {#colored-root}

[LeetCode 4085 — Find Root of a Colored Tree](https://leetcode.com/problems/find-root-of-a-colored-tree/) hands you an undirected tree and a color in $$\{\mathrm{R}, \mathrm{B}, \mathrm{W}\}$$ on every node. Pick a root. Orient every edge away from it. Two things must hold.

- No node has more than two children.
- Nodes at the same depth share a color, and the colors down the levels follow one of
  $$\mathrm{R}\to\mathrm{B}\to\mathrm{W}\to\mathrm{R}\to\cdots$$,
  $$\mathrm{B}\to\mathrm{W}\to\mathrm{R}\to\mathrm{B}\to\cdots$$,
  $$\mathrm{W}\to\mathrm{R}\to\mathrm{B}\to\mathrm{W}\to\cdots$$.

Return any such root, or $$-1$$.

### Try every root, then try not to

The condition is a statement about depth. Root the tree at an arbitrary $$u$$, set $$\mathrm{depth}(u) = 0$$, and paint each level by $$\mathrm{depth} \bmod 3$$. Checking one root is a BFS, $$O(n)$$. The expensive part is choosing $$u$$: there are $$n$$ candidates.

Rerooting looks like a way out. Depths from $$u$$ are already known, and the depth of $$z$$ once $$v$$ is the root is a distance:

$$
d(v, z) = d(u, v) + d(u, z) - 2\,d(u, \mathrm{lca}(v, z)).
$$

With binary lifting that is $$O(\log n)$$ per pair, so you can move the root without a fresh BFS. It does not answer the question that matters, which is how many roots can possibly work. You still have to test candidates, and nothing yet says the answer is unique. The formula saves the rebuild. It does not save the search.

### Three sequences, one cycle

Look at what a parent and a child are allowed to be. Depth increases by exactly one along every edge that leaves the root, and each of the three sequences is the same cycle started at a different letter. The next color is a function:

$$
\mathrm{next}(\mathrm{R}) = \mathrm{B}, \qquad \mathrm{next}(\mathrm{B}) = \mathrm{W}, \qquad \mathrm{next}(\mathrm{W}) = \mathrm{R}.
$$

If $$u$$ is the parent of $$v$$, then the color of $$v$$ is $$\mathrm{next}$$ of the color of $$u$$. The legal ordered pairs are only $$(\mathrm{R},\mathrm{B})$$, $$(\mathrm{B},\mathrm{W})$$, and $$(\mathrm{W},\mathrm{R})$$.

Now forget the root and look at one undirected edge $$\{u, v\}$$.

- The two colors are one step apart on the cycle. Exactly one order is legal, so the edge has exactly one direction. $$\mathrm{R}-\mathrm{B}$$ must point $$\mathrm{R}\to\mathrm{B}$$. $$\mathrm{W}-\mathrm{R}$$ must point $$\mathrm{W}\to\mathrm{R}$$, because the other way would need $$\mathrm{next}(\mathrm{R}) = \mathrm{W}$$.
- The two colors are the same. Neither order is legal. No root can orient this edge, and the answer is $$-1$$.

The undirected tree has become a directed one, and the directions did not depend on which node you hoped was the root. That is the whole deduction. The three patterns were never a choice you make per candidate. They are one rule, applied to every edge locally.

A small tree:

```
0 —— 1 —— 2
R    B    W
```

$$0\to 1$$ because $$\mathrm{R}\to\mathrm{B}$$, and $$1\to 2$$ because $$\mathrm{B}\to\mathrm{W}$$. Node $$0$$ is the only one with no parent. Its depths are $$0, 1, 2$$ and the colors are exactly the cycle. Node $$2$$ cannot be a root: the edge into it already points the other way.

### One source, or a node with two parents

In that directed graph a parent points at its child. The root of a valid orientation is a node of indegree $$0$$, and every other node has indegree $$1$$. There are $$n - 1$$ edges, so the indegrees sum to $$n - 1$$.

- Exactly one indegree is $$0$$. Then every other indegree is $$1$$. Following parent pointers ends at that source, the underlying graph is a tree, and the orientation is the tree rooted there.
- Two or more indegrees are $$0$$. The same sum forces some other node to have indegree at least $$2$$. That node has two parents. Two parents means two edges argued, from their colors, that they point inward, so those two neighbors both want to sit above it. No single root produces that picture.

```
  0       2
  R       R
   \     /
    \   /
      1
      B
```

$$0\to 1$$ and $$2\to 1$$. Nodes $$0$$ and $$2$$ are both sources, and $$1$$ has two parents. Neither source works as a root: the far leaf sits at depth $$2$$, where the cycle wants $$\mathrm{W}$$, and the leaf is $$\mathrm{R}$$.

Zero sources cannot happen on a tree. Every indegree at least $$1$$ would sum to at least $$n$$, and there are only $$n - 1$$ edges. So the test is exactly: after orienting, is there one source? The BFS in the code walks from that source and counts how many nodes it reaches. On a promised tree it always reaches all $$n$$ once the source is unique. The walk is the same fact written out, and it is what you keep if you do not want the argument to lean on the promise.

The binary constraint is the out-degree of this same orientation. A node may have three neighbors in the undirected tree and still be fine, if one of them is its parent. Three children is the failure, and it shows up as three outgoing edges from one node.

### Implementation

Orient each edge or reject it. Reject a third child. The answer is the unique indegree-$$0$$ node, if the walk from it covers the tree.

```python
from collections import deque

class Solution:
    def findColoredRoot(self, edges: list[list[int]], colors: str) -> int:
        n = len(colors)
        if n == 1:
            return 0

        valid = {("R", "B"), ("B", "W"), ("W", "R")}
        adj = [[] for _ in range(n)]
        indeg = [0] * n

        for u, v in edges:
            if (colors[u], colors[v]) in valid:
                parent, child = u, v
            elif (colors[v], colors[u]) in valid:
                parent, child = v, u
            else:
                return -1
            adj[parent].append(child)
            indeg[child] += 1
            if len(adj[parent]) > 2:
                return -1

        roots = [i for i, d in enumerate(indeg) if d == 0]
        if len(roots) != 1:
            return -1

        seen = 0
        queue = deque(roots)
        while queue:
            node = queue.popleft()
            seen += 1
            queue.extend(adj[node])
        return roots[0] if seen == n else -1
```

### Complexity

- Orienting the $$n - 1$$ edges, and the walk: $$O(n)$$.
- No LCA and no second BFS. The direction of an edge is a lookup in a three-element set.

> **The pattern worth naming.** When a global order (depth, time, ancestry) forces a local constraint on every edge, stop searching for the root and read the direction off the edge. The undirected graph becomes a directed one. The root is whoever has indegree $$0$$, and a second source is a node that grew a second parent.

## LCA in O(1): Farach-Colton and Bender {#farach-colton-bender}

The lowest common ancestor problem, and its bigger sibling the level ancestor problem ("what is the ancestor of $$v$$ at depth $$d$$?"), have a long and beautiful line of work behind them. In contests we almost always reach for binary lifting. It is short, it is hard to get wrong, and it also answers $$k$$-th ancestor queries. But every query costs $$O(\log n)$$.

Farach-Colton and Bender showed how to do better: $$O(n)$$ preprocessing and $$O(1)$$ per query. What I like about it is that it is not one trick. Four ideas from different corners each do one job:

- An **Euler tour** flattens the tree so that LCA becomes a range-minimum query (RMQ). I had used a different flattening before, to turn subtree queries into range queries. This one turns _paths_ into ranges.
- A **sparse table** answers RMQ in $$O(1)$$, but it costs $$O(n \log n)$$ to build.
- **Blocks** shrink that table. This is the move behind square root decomposition, with a different block size than $$\sqrt n$$.
- **Bitmasks** squeeze the possible shapes of a block into a space small enough to precompute every one of them. Blocks plus one table per shape is the **Method of Four Russians**.

The plan follows the thought process: reduce LCA to RMQ, solve RMQ with a sparse table, then ask exactly where the $$\log n$$ comes from and how to remove it. Two problems close the section. LeetCode 3553 finds the smallest subtree joining three vertices with three LCAs per query, and Xenia and Tree cuts the same blocks along time instead of along the array, to ask for tens of millions of LCAs.

The proofs are folded under **Proof**. The argument reads without them.

### Four ways to answer an LCA query

| Method                    | Preprocessing   | Per query     | Memory          |
| ------------------------- | --------------- | ------------- | --------------- |
| Climb one level at a time | $$O(n)$$        | $$O(h)$$      | $$O(n)$$        |
| Binary lifting            | $$O(n \log n)$$ | $$O(\log n)$$ | $$O(n \log n)$$ |
| Euler tour + sparse table | $$O(n \log n)$$ | $$O(1)$$      | $$O(n \log n)$$ |
| Farach-Colton and Bender  | $$O(n)$$        | $$O(1)$$      | $$O(n)$$        |

Here $$h$$ is the height of the tree, which is $$n - 1$$ on a path.

- **Climb.** One DFS records each vertex's parent and depth. To answer $$\operatorname{lca}(u, v)$$, move the deeper vertex up until the depths match, then move both up together until they meet. Each step rises one level, so a query takes $$O(h)$$ steps. On a path with $$n = q = 5 \cdot 10^5$$, that is on the order of $$10^{11}$$ steps.
- **Binary lifting.** Store $$\mathrm{up}_k(v)$$, the $$2^k$$-th ancestor of $$v$$, for $$0 \le k \le \lfloor \log_2 n \rfloor$$, using $$\mathrm{up}_k(v) = \mathrm{up}_{k-1}(\mathrm{up}_{k-1}(v))$$. Rising $$d$$ levels takes one jump per 1-bit of $$d$$, and the final "rise together" step tries each $$k$$ once from high to low. Both are at most $$\lfloor \log_2 n \rfloor + 1$$ jumps.
- **Euler tour + sparse table** and **Farach-Colton and Bender** are the rest of this section.

A note on "$$O(1)$$". It means a constant number of operations on machine words, where a word holds $$\Theta(\log n)$$ bits. That is the usual model (array indices already need it), and the bitmasks below need it too: each one has about $$\tfrac{1}{2}\log_2 n$$ bits, so it fits in an `int` and can index an array directly.

### Step 1: the Euler tour

Flatten the tree by walking it. Start at the root, go down every edge and back up it, and write down the vertex you are at after every move:

```cpp
void flatten(int v, int p, int h) {
    first_visit[v] = sz(euler_tour);
    euler_tour.pb(v);              // arrive at v
    height[v] = h;
    for (int u : adj[v]) {
        if (u == p) continue;      // the edge back up to the parent
        flatten(u, v, h + 1);      // walk down to u, tour its subtree
        euler_tour.pb(v);          // walk back up to v
    }
}
```

On this tree, rooted at $$1$$:

```
        1
      /   \
     2     3
    / \   / \
   4   5 6   7
```

```
index  0 1 2 3 4 5 6 7 8 9 10 11 12
T      1 2 4 2 5 2 1 3 6 3 7  3  1
h      0 1 2 1 2 1 0 1 2 1 2  1  0
```

Only the down moves come from `adj`. Each one is a recursive call, and the up move is the return from that call followed by `euler_tour.pb(v)`. The input doesn't say which end of an edge is the parent, so `adj` stores both directions, and `if (u == p) continue` skips the one that leads back up.

The walk crosses every edge twice, and it has to. The only way out of a child $$c$$'s subtree and back to its parent $$v$$ is the edge $$\{v, c\}$$ itself, and that return to $$v$$ is what will put the LCA between $$u$$ and $$v$$ in the theorem below. So the name is a little loose. An **Euler tour** is a closed walk that uses every edge exactly once, and a tree with an edge has none, since a leaf can be entered but never left. What the walk really is: an Euler tour of the tree with each edge $$\{u, v\}$$ replaced by two directed edges $$(u, v)$$ and $$(v, u)$$, a down edge one level deeper and an up edge one level back.

<details markdown="1">
<summary>Proof: a tree has no Euler tour, and the doubled tree has one</summary>

**A tree has none.** Two facts.

- _A closed walk that uses every edge exactly once needs every degree to be even._ Each time the walk passes through a vertex, it arrives on one edge and leaves on another. The start vertex is no exception, since the walk leaves it first and arrives back at the end. So the edges at each vertex are used in (in, out) pairs, and since every edge is used, the degree is even.
- _Every tree with $$n \ge 2$$ vertices has at least two leaves._ Take a longest path $$x_0, x_1, \dots, x_k$$. If $$x_0$$ had a neighbor other than $$x_1$$, either that neighbor is off the path, and the path could be extended, or it is on the path, and the tree would have a cycle. So $$x_0$$ has degree $$1$$, and so does $$x_k$$.

A leaf has odd degree, so a tree with an edge has no Euler tour. On the tree $$1 - 2$$, a walk from $$1$$ uses the only edge to reach $$2$$ and has no edge left to come back on.

**The doubled tree has one.** Two ways to see it.

- _By Euler's theorem._ After doubling, every vertex has in-degree equal to out-degree (both equal its old degree), and the graph is still connected. A connected directed graph with in-degree equal to out-degree everywhere has an Euler tour.
- _By construction._ `flatten` uses $$(v, c)$$ when it enters a child $$c$$ of $$v$$, and $$(c, v)$$ when it returns. Each tree edge is crossed in exactly these two moves, so each of the $$2(n-1)$$ directed edges is used exactly once, and the walk starts and ends at the root. $$\blacksquare$$

</details>

This is not the flattening used for subtree queries. That one records entry and exit times and writes each vertex once, so the subtree of $$v$$ is the contiguous range $$[\mathrm{tin}(v), \mathrm{tout}(v)]$$ and a subtree sum becomes a range sum (see [`EulerTour`](/library/eulertour/) in the library). The tour here writes $$v$$ again after _every_ child. It is the walk itself, and it is the walk that makes paths visible.

**Notation.** $$T[0..m-1]$$ is the tour, $$h(x)$$ is the depth of $$x$$, $$\operatorname{sub}(x)$$ is the subtree of $$x$$, and $$f(x)$$ and $$\ell(x)$$ are the first and last indices where $$x$$ appears in $$T$$. Write $$A[i] = h(T[i])$$.

> **Lemma 1 (the tour moves by ±1).** $$m = 2n - 1$$, and $$\lvert A[i+1] - A[i] \rvert = 1$$ for every $$i$$.

<details markdown="1">
<summary>Proof</summary>

The tour is an Euler tour of the doubled graph, so it makes one move per directed edge, $$2(n-1)$$ moves in all, and records $$2(n-1) + 1 = 2n - 1$$ vertices. Each move is a down edge $$(v, c)$$, from a vertex to one of its children, so the depth rises by $$1$$, or an up edge $$(c, v)$$, from a vertex to its parent, so the depth falls by $$1$$. $$\blacksquare$$

</details>

Everything later rests on this lemma. The depths along the tour go up and down one step at a time, never jumping and never staying flat.

> **Lemma 2 (a subtree is one contiguous run).** $$T[f(x)..\ell(x)]$$ contains exactly the occurrences of vertices in $$\operatorname{sub}(x)$$. Every entry in it has depth at least $$h(x)$$, and only $$x$$ itself has depth exactly $$h(x)$$.

<details markdown="1">
<summary>Proof</summary>

The call `flatten(x)` makes the first write of $$x$$ at $$f(x)$$ and the last at $$\ell(x)$$. Everything written between those two writes comes from the calls on descendants of $$x$$, which all run inside `flatten(x)`, and no call on a descendant runs outside it. Every descendant other than $$x$$ is strictly deeper than $$x$$. $$\blacksquare$$

</details>

> **Theorem.** Let $$w = \operatorname{lca}(u, v)$$, and take _any_ index $$i$$ with $$T[i] = u$$ and any $$j$$ with $$T[j] = v$$, with $$i \le j$$. Then $$w$$ appears in $$T[i..j]$$, and every other entry of $$T[i..j]$$ is strictly deeper than $$w$$.

<details markdown="1">
<summary>Proof</summary>

Both $$u$$ and $$v$$ are in $$\operatorname{sub}(w)$$, so by Lemma 2 both $$i$$ and $$j$$ lie in $$[f(w), \ell(w)]$$, and so does everything between them. By Lemma 2 again, every entry of $$T[i..j]$$ has depth at least $$h(w)$$, and only $$w$$ has depth exactly $$h(w)$$. It remains to show that $$w$$ actually appears in $$T[i..j]$$.

- If $$u = w$$ or $$v = w$$, then $$T[i]$$ or $$T[j]$$ is $$w$$.
- Otherwise $$u$$ and $$v$$ lie under two _different_ children $$c_1$$ and $$c_2$$ of $$w$$. If they were under the same child, that child would be a deeper common ancestor. By Lemma 2, $$i$$ lies in $$c_1$$'s run and $$j$$ lies in $$c_2$$'s run. The runs are disjoint and $$i \le j$$, so $$c_1$$'s run comes first. When `flatten(c1)` returns, `flatten(w)` writes $$w$$ at index $$\ell(c_1) + 1$$, which is before $$c_2$$'s run starts. So $$i \le \ell(c_1) < \ell(c_1) + 1 < f(c_2) \le j$$, and $$T[\ell(c_1) + 1] = w$$ is inside the range. $$\blacksquare$$

</details>

For example, $$\operatorname{lca}(4, 6)$$ scans $$T[2..8] = 4\,2\,5\,2\,1\,3\,6$$ with depths $$2\,1\,2\,1\,0\,1\,2$$. The shallowest entry is vertex $$1$$.

Three consequences are worth spelling out, because the code depends on each one.

- **One index per vertex is enough.** The theorem holds for any occurrence of $$u$$ and of $$v$$, so the code stores only $$f$$ (`first_visit`). For example, $$\operatorname{lca}(2, 6)$$ comes out as $$1$$ whether you start from 2's first index (1) or its last (5).
- **Ties don't matter.** Only $$w$$ reaches the minimum depth in $$T[i..j]$$. It may appear several times, but every index with that depth holds $$w$$, so a minimum-by-depth can break ties either way.
- **$$v$$ must be written again after each child.** Without that write, the $$w$$ between $$c_1$$ and $$c_2$$ in the proof does not exist. The tour becomes $$1\,2\,4\,5\,3\,6\,7$$, $$\operatorname{lca}(4, 6)$$ scans $$4\,5\,3\,6$$ and answers $$3$$, and Lemma 1's ±1 steps break too.

So

$$
\operatorname{lca}(u, v) = T\Big[\operatorname*{arg\,min}_{\min(f(u), f(v)) \,\le\, k \,\le\, \max(f(u), f(v))} A[k]\Big],
$$

a range-minimum query on $$A$$ of length $$m = 2n - 1$$. From here on the tree is gone, and we only need RMQ on an array whose neighbors differ by exactly $$1$$.

### Step 2: the first instinct, a sparse table

A sparse table stores, for every start $$i$$ and every $$k$$, the position of the minimum of the window $$[i, i + 2^k)$$:

$$
\mathrm{sp}_0[i] = i, \qquad \mathrm{sp}_k[i] = \operatorname{argmin}\big(\mathrm{sp}_{k-1}[i],\ \mathrm{sp}_{k-1}[i + 2^{k-1}]\big).
$$

A window of length $$2^k$$ is two windows of length $$2^{k-1}$$ side by side, so each entry takes one comparison.

To answer $$[l, r]$$, let $$k = \lfloor \log_2(r - l + 1) \rfloor$$ and compare $$\mathrm{sp}_k[l]$$ with $$\mathrm{sp}_k[r - 2^k + 1]$$.

The two windows lie inside $$[l, r]$$ and together cover it. They may overlap, and that is fine because min is _idempotent_: $$\min(x, x) = x$$, so counting an element twice changes nothing. A sum is not, which is why a sparse table answers range minimum in $$O(1)$$ but range sum needs disjoint pieces.

<details markdown="1">
<summary>Proof: the two windows cover [l, r]</summary>

From $$2^k \le r - l + 1$$, both windows $$[l, l + 2^k)$$ and $$[r - 2^k + 1, r]$$ lie inside $$[l, r]$$. From $$r - l + 1 < 2^{k+1}$$, the second window starts at $$r - 2^k + 1 \le l + 2^k$$, so there is no gap, and together they cover $$[l, r]$$. $$\blacksquare$$

</details>

```cpp
vii sp; // sp[k][i] = position of the min of A over [i, i + 2^k)
void build_plain(int m) {
    sp.assign(log_2[m] + 1, vi(m));
    REP(i, m) sp[0][i] = i;
    for (int k = 1; (1 << k) <= m; k++)
        for (int i = 0; i + (1 << k) <= m; i++)
            sp[k][i] = min_by_h(sp[k-1][i], sp[k-1][i + (1 << (k-1))]);
}

int lca_plain(int u, int v) {
    int l = first_visit[u], r = first_visit[v];
    if (l > r) swap(l, r);
    int k = log_2[r - l + 1];
    return euler_tour[min_by_h(sp[k][l], sp[k][r - (1 << k) + 1])];
}
```

So far this algorithm is LCA reduced to RMQ, and the queries are already $$O(1)$$. The cost is entirely in preprocessing: $$m(\lfloor \log_2 m \rfloor + 1)$$ entries, which is $$\Theta(m \log m) = \Theta(n \log n)$$. For $$n = 5 \cdot 10^5$$ that is $$20 \times 999{,}999 \approx 2 \cdot 10^7$$ entries.

Where does the $$\log$$ come from? Every one of the $$m$$ starting positions stores $$\log m$$ levels. The queries can't get faster, so the question is: **can we have fewer starting positions?**

### Step 3: blocks

Cut $$A$$ into blocks of $$b$$ consecutive entries. There are $$c = \lceil m / b \rceil$$ of them. Build the sparse table over the $$c$$ block minimums instead of over all $$m$$ entries.

A query $$[l, r]$$ with $$b_l = \lfloor l / b \rfloor$$ and $$b_r = \lfloor r / b \rfloor$$ is either inside one block ($$b_l = b_r$$), or it splits into three disjoint parts:

```
   block b_l         b_l + 1  ...  b_r - 1          block b_r
[ .  .  l  .  . ] [ . . . ] ... [ . . . ] [ .  .  r  .  . ]
        └suffix─┘ └─────── sparse table ────────┘ └─prefix┘
```

The minimum of $$[l, r]$$ is the smallest of the three parts' minimums. The middle part is whole blocks, so the sparse table over blocks answers it. That table has

$$
c\,(\lfloor \log_2 c \rfloor + 1) \approx \frac{m}{b}\,\log_2 m
$$

entries, and it is linear as soon as $$b$$ is on the order of $$\log m$$.

This is the move behind square root decomposition: handle whole blocks through a per-block summary, and the partial blocks at the ends separately. Square root decomposition picks $$b = \sqrt m$$ to balance two per-query scans, $$O(b)$$ inside the end blocks and $$O(m/b)$$ across the middle. Here both parts of a query must already be $$O(1)$$, so the thing being balanced is _preprocessing_, and that calls for a different factor.

That leaves the two partial blocks, and they also have to be $$O(1)$$. The obvious options are not linear:

- A table of all $$b^2$$ answers per block costs $$c \cdot b^2 \approx m b$$, which is $$\Theta(m \log m)$$ again.
- A sparse table inside each block costs $$c \cdot b \log b \approx m \log b$$, which is $$\Theta(m \log \log m)$$. Close, but not linear.

Both precompute something for every block. The question that unblocks it: **do different blocks really need different tables?**

### Step 4: up, down, up: a block is its mask

Lemma 1 says every step of the tour is $$+1$$ (one level deeper) or $$-1$$ (one level up). Take a block starting at $$s$$ and write its steps as $$\delta_j = A[s + j] - A[s + j - 1] \in \{+1, -1\}$$ for $$j = 1, \dots, b - 1$$. Then

$$
A[s + j] = A[s] + \underbrace{\delta_1 + \delta_2 + \cdots + \delta_j}_{D_j}.
$$

The block is a starting height plus a shape, and the shape is just $$b - 1$$ choices of up or down. Store it as a bitmask, with bit $$j - 1$$ set when step $$j$$ goes deeper:

```cpp
// precompute mask for each block
void precompute_block_mask(int m) {
    block_mask.assign(block_cnt, 0);
    REP(i, m) { // iterate euler tour
        int b = i / block_size, j = i % block_size;
        // turn on bit j-1 if height is increased
        if (j > 0 && height[euler_tour[i]] > height[euler_tour[i - 1]]) block_mask[b] |= 1 << (j - 1);
    }
}
```

For example, with $$b = 4$$, depths $$2\,3\,2\,1$$ have steps $$+\,-\,-$$, so the mask is `0b001`. Depths $$7\,8\,7\,6$$ have the same steps and the same mask. They are the same shape, shifted by $$5$$, and both have their minimum at offset $$3$$. Depths $$1\,2\,3\,2$$ have steps $$+\,+\,-$$ and mask `0b011`, with the minimum at offset $$0$$.

> **Lemma 3 (blocks with the same mask share their answers).** If two full blocks have the same mask, then for every $$0 \le l \le r < b$$ the in-block minimum of $$[l, r]$$ sits at the same offset in both, ties broken the same way.

<details markdown="1">
<summary>Proof</summary>

Let the blocks start at $$s$$ and $$s'$$. The same mask means the same steps, so the same partial sums $$D_j$$, and $$A[s + j] = A[s] + D_j$$, $$A[s' + j] = A[s'] + D_j$$. Every comparison the table-building loop makes has the form "is $$A[s + x] < A[s + y]$$?", which is $$A[s] + D_x < A[s] + D_y$$, which is $$D_x < D_y$$. The starting height cancels. So both blocks go through the same sequence of comparisons with the same outcomes, ties included, and store the same offsets. $$\blacksquare$$

</details>

The idea underneath is that $$\operatorname{argmin}$$ doesn't move when you add a constant to every entry. The ±1 property is what makes "the same shape up to a constant" something you can read off in $$b - 1$$ bits.

So `precompute_blocks` fills `blocks[mask][l][r]` once per mask, from the first block that has it, and skips every later block with the same mask:

```cpp
// precompute RMQ for each unique block
void precompute_blocks(int m) {
    int FULL = 1 << (block_size - 1);
    blocks.assign(FULL, {});

    REP(b, block_cnt) {
        int mask = block_mask[b];

        if (!blocks[mask].empty()) continue;        // this shape is already solved
        blocks[mask].assign(block_size, vi(block_size));

        int offset = b * block_size;
        REP(l, block_size) {
            blocks[mask][l][l] = l;
            FOR(r, l + 1, block_size - 1) {
                blocks[mask][l][r] = blocks[mask][l][r - 1];
                if (offset + r >= m) continue;       // short last block
                blocks[mask][l][r] = min_by_h(offset + blocks[mask][l][r], offset + r) - offset;
            }
        }
    }
}
```

There are at most $$2^{b-1}$$ masks, however many blocks there are. The question is no longer "how many blocks?" but "how many shapes?", and the answer doesn't grow with $$m$$ except through $$b$$.

<details markdown="1">
<summary>The short last block</summary>

If $$b$$ does not divide $$m$$, the last block has fewer than $$b$$ entries, and its missing steps stay $$0$$ in the mask, which reads as "down". Two cases:

- An earlier full block has the same mask. The two agree on every step the last block really has, and a query in the last block only uses offsets below $$m - \text{offset}$$, so by the same argument as Lemma 3 the answers agree on every range it can ask.
- No earlier block has that mask. Then the table is built from the last block itself, the guard `offset + r >= m` keeps it inside the tour, and since blocks are processed in order, no other block ever reads that table.

Queries never ask past $$m - 1$$, so either way the answers are right.

</details>

**This is the Method of Four Russians.** Steps 3 and 4 together are a technique named after Arlazarov, Dinic, Kronrod and Faradzhev, who used it in 1970 to compute the transitive closure of a graph, which comes down to multiplying Boolean matrices. The recipe: cut the input into blocks of about $$\log n$$, so small that only a few kinds of block can occur, precompute the answer for every kind once, and turn each block's question into a table lookup. In the matrix product, a block is $$k \approx \log n$$ rows, and its table holds the OR of every subset of them, $$2^k$$ entries indexed by $$k$$ bits of the other matrix. Here a block is $$b - 1$$ up-or-down steps, and the tables hold every in-block minimum, one table per mask. The recipe leaves one decision open, the block size.

### Choosing b: why ½ log m

Why $$b = \lfloor \tfrac{1}{2} \log_2 m \rfloor$$, and not something else? A part of me felt the whole construction is bottlenecked by this choice. It is, and seeing exactly how is the best way to see why the algorithm works at all.

The preprocessing, as a function of $$b$$, is roughly

$$
\underbrace{\frac{m}{b}\log_2 m}_{\text{sparse table over blocks}} \;+\; \underbrace{2^{b-1}\, b^2}_{\text{one table per mask}} \;+\; O(m).
$$

The first term falls as $$b$$ grows, and the second rises, exponentially.

- **$$b$$ constant.** The first term is $$\Theta(m \log m)$$. With $$b = 1$$ this is exactly the plain sparse table from Step 2.
- **$$b = \log_2 m$$.** The second term is $$\tfrac{m}{2}\log_2^2 m$$, worse than where we started.
- **$$b = \alpha \log_2 m$$ with $$0 < \alpha < 1$$.** The first term is $$m / \alpha$$, and the second is at most $$m^{\alpha} \cdot \alpha^2 \log_2^2 m / 2$$, which is $$o(m)$$. Linear.

So $$b$$ is squeezed from both sides. It must be at least a constant times $$\log m$$, or the sparse table is superlinear. It must be at most about $$\log_2 m - 2 \log_2 \log_2 m$$, or the mask tables are, because $$2^{b-1} b^2 \le Cm$$ means $$b + 2\log_2 b \le \log_2 m + O(1)$$. Any fixed $$\alpha \in (0, 1)$$ lands inside the window. $$\alpha = \tfrac12$$ is the usual choice because it makes the mask count a clean $$\sqrt m / 2$$.

Here are the exact counts for $$m = 999{,}999$$ ($$n = 5 \cdot 10^5$$), with $$c = \lceil m/b \rceil$$ blocks and $$\lfloor \log_2 c \rfloor + 1$$ levels:

| $$b$$           | blocks $$c$$ | sparse table entries | mask table entries | total      |
| --------------- | ------------ | -------------------- | ------------------ | ---------- |
| 1 (plain)       | 999,999      | 19,999,980           | 1                  | 19,999,981 |
| 4               | 250,000      | 4,500,000            | 128                | 4,500,128  |
| 8               | 125,000      | 2,125,000            | 8,192              | 2,133,192  |
| **9** (½ log m) | 111,111      | 1,888,887            | 20,736             | 1,909,623  |
| 12              | 83,334       | 1,416,678            | 294,912            | 1,711,590  |
| 14              | 71,429       | 1,214,293            | 1,605,632          | 2,819,925  |
| 16              | 62,500       | 1,000,000            | 8,388,608          | 9,388,608  |
| 19 (log m)      | 52,632       | 842,112              | 94,633,984         | 95,476,096 |

The valley is wide and flat. Anything from $$8$$ to $$12$$ is within about $$25\%$$ of the best total, and $$b = 9$$ keeps the mask tables at $$256 \times 81$$ entries, small enough to stay in cache. Past $$14$$ the masks take over, and at $$b = \lfloor \log_2 m \rfloor$$ the total is almost five times the plain sparse table.

So the real bottleneck isn't $$b$$. It's **how many shapes a block of size $$b$$ can have**. Call that $$N(b)$$: the number of block types such that a type determines every in-block answer. We need some $$b = \Omega(\log m)$$ with $$N(b)\, b^2 = O(m)$$.

- **±1 arrays, typed by mask:** $$N(b) = 2^{b-1}$$, so $$b = \tfrac12 \log_2 m$$ works.
- **Any array, typed by Cartesian tree** (which position is the minimum, then recursively on each side): $$N(b)$$ is the Catalan number $$C_b \le 4^b$$, so $$b = \tfrac14 \log_2 m$$ works.
- **Any array, typed by sorted order:** $$N(b) = b! \ge (b/e)^b$$. Then $$N(b) \le m$$ forces $$b \log_2(b/e) \le \log_2 m$$, so $$b = O(\log m / \log \log m)$$, which is below the window. The sparse table then costs $$\Omega(m \log \log m)$$. Typing by sorted order is too fine.

The window exists only if the number of shapes grows at most exponentially in $$b$$. The ±1 structure from Lemma 1 is what gives us that, and the bitmask is just the most direct way to write it down. That is what I mean by using a bitmask to constrain the combinatorial space.

### The complexity

Write $$S(m)$$ for the number of entries in the sparse table over blocks and $$M(m)$$ for the number in the mask tables, with $$b = \lfloor \tfrac12 \lfloor \log_2 m \rfloor \rfloor$$ as in the code.

> **Claim A.** $$S(m) = O(m)$$. In fact $$\limsup_{m \to \infty} S(m)/m \le 2$$.
>
> **Claim B.** $$M(m) = o(m)$$.
>
> **Theorem.** Preprocessing takes $$O(n)$$ time and memory, and each query takes $$O(1)$$.

At $$m = 999{,}999$$ ($$n = 5 \cdot 10^5$$), $$S = 1{,}888{,}887$$, about $$1.89\,m$$, and $$M = 256 \times 81 = 20{,}736$$. On a random tree that size, all $$256$$ masks show up. So the mask tables are asymptotically free, and the whole cost is the sparse table over blocks, which blocks of $$\tfrac12 \log_2 m$$ entries make linear.

<details markdown="1">
<summary>Proofs of Claims A and B, and the theorem</summary>

We use the limit forms of the definitions: $$f = O(g)$$ if $$\limsup_{m \to \infty} f(m)/g(m) < \infty$$, and $$f = o(g)$$ if $$\lim_{m \to \infty} f(m)/g(m) = 0$$.

**Setup.** Let $$L = \lfloor \log_2 m \rfloor$$ and $$b = \lfloor L / 2 \rfloor$$. (The code takes `max(1, ...)` so tiny trees still get $$b \ge 1$$. Asymptotics only care about large $$m$$.) Then

$$
\frac{\log_2 m}{2} - 1 \;<\; b \;\le\; \frac{\log_2 m}{2}.
$$

The right side holds because $$b \le L/2 \le (\log_2 m)/2$$. The left side holds because $$b \ge (L - 1)/2$$ and $$L > \log_2 m - 1$$.

**Claim A.** $$c = \lceil m/b \rceil \le m/b + 1$$ and $$\lfloor \log_2 c \rfloor + 1 \le \log_2 m + 1$$, so

$$
\frac{S(m)}{m} \le \Big(\frac{1}{b} + \frac{1}{m}\Big)(\log_2 m + 1)
< \frac{\log_2 m + 1}{\tfrac12 \log_2 m - 1} + \frac{\log_2 m + 1}{m}.
$$

Divide the top and bottom of the first fraction by $$\log_2 m$$: it is $$\dfrac{1 + 1/\log_2 m}{\tfrac12 - 1/\log_2 m} \to \dfrac{1}{1/2} = 2$$. The second term goes to $$0$$. So $$\limsup S(m)/m \le 2$$. Each entry takes one comparison, and the block minimums take one pass over $$A$$, so the time is $$O(m)$$ as well.

**Claim B.** There are at most $$2^{b-1}$$ masks, each with a $$b \times b$$ table, so

$$
M(m) \le 2^{b-1} b^2 \le 2^{\frac12 \log_2 m - 1} \cdot \frac{\log_2^2 m}{4} = \frac{\sqrt m \,\log_2^2 m}{8},
\qquad\text{so}\qquad
\frac{M(m)}{m} \le \frac{\log_2^2 m}{8\sqrt m}.
$$

Let $$t = \log_2 m$$, so $$\sqrt m = 2^{t/2} = e^{x}$$ with $$x = \tfrac{t \ln 2}{2}$$. Every term of $$e^x = \sum_k x^k / k!$$ is nonnegative for $$x \ge 0$$, so $$e^x \ge x^3 / 6$$, which gives $$\sqrt m \ge \dfrac{(t \ln 2)^3}{48}$$. Then

$$
\frac{M(m)}{m} \le \frac{t^2}{8} \cdot \frac{48}{(t \ln 2)^3} = \frac{6}{(\ln 2)^3\, t} \xrightarrow[\,m \to \infty\,]{} 0.
$$

At $$m = 999{,}999$$ the bound gives about $$49{,}700$$, against the actual $$20{,}736$$. Building them takes $$O(b^2)$$ per distinct mask, plus an $$O(1)$$ "already solved?" check per block, so $$O(c + M(m)) = O(m)$$.

**The theorem.** The tour takes $$O(n)$$, since each edge is walked twice. The log table, the block minimums and the masks are each one pass, $$O(m)$$. Adding Claims A and B,

$$
T(n) = O(n) + O(m) + S(m) + O(c + M(m)) = O(m) = O(n),
$$

because $$m = 2n - 1$$. Memory is the same sum. A query does at most two mask-table lookups, one sparse-table query (one `log_2` lookup and two table reads), and three comparisons, so it is $$O(1)$$. $$\blacksquare$$

The code builds `log_2` up to `2 * MAX_N` in `preprocess`, once for the whole run rather than per test case. That does not change the bound.

</details>

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
/*
    LCA with Farach-Colton and Bender: O(n) build, O(1) per query
    https://cp-algorithms.com/graph/lca_farachcoltonbender.html
*/

const int MAX_N = 5e5;

int n;
vii adj;

int block_size, block_cnt;
vi first_visit;
vi euler_tour;
vi height;
vi log_2;
vii st;
vector<vii> blocks;
vi block_mask;

void flatten(int v, int p, int h) {
    first_visit[v] = sz(euler_tour);
    euler_tour.pb(v);
    height[v] = h;
    for (int u : adj[v]) {
        if (u == p) continue;
        flatten(u, v, h + 1);
        euler_tour.pb(v);
    }
}

int min_by_h(int i, int j) {
    return height[euler_tour[i]] < height[euler_tour[j]] ? i : j;
}

// precompute all log values
void precompute_log(int m) {
    log_2.assign(m + 1, -1);
    FOR(i, 1, m) log_2[i] = log_2[i / 2] + 1;
}

// precompute minimum of each block and build sparse table
// st[b][j] = index of the min over blocks [b, b + 2^j)
void precompute_sparse_table(int m) {
    st.assign(block_cnt, vi(log_2[block_cnt] + 1));

    // st[b][0] = min of block b
    REP(i, m) {
        int b = i / block_size, j = i % block_size;
        if (j == 0) st[b][0] = i;
        else st[b][0] = min_by_h(st[b][0], i);
    }

    // st[b][j] = min of { blocks [b, b + 2^(j-1)), [b + 2^(j-1), b + 2^j) }
    FOR(j, 1, log_2[block_cnt]) {
        REP(b, block_cnt) {
            if (b + (1 << j) > block_cnt) continue;
            st[b][j] = min_by_h(st[b][j-1], st[b + (1 << (j-1))][j-1]);
        }
    }
}

// min over blocks [L, R]
int query_sparse_table(int L, int R) {
    int k = log_2[R - L + 1];
    return min_by_h(st[L][k], st[R - (1 << k) + 1][k]);
}

// precompute mask for each block
void precompute_block_mask(int m) {
    block_mask.assign(block_cnt, 0);
    REP(i, m) { // iterate euler tour
        int b = i / block_size, j = i % block_size;
        // turn on bit j-1 if height is increased
        if (j > 0 && height[euler_tour[i]] > height[euler_tour[i - 1]]) block_mask[b] |= 1 << (j - 1);
    }
}

// precompute RMQ for each unique block
void precompute_blocks(int m) {
    int FULL = 1 << (block_size - 1);
    blocks.assign(FULL, {});

    REP(b, block_cnt) {
        int mask = block_mask[b];

        if (!blocks[mask].empty()) continue;
        blocks[mask].assign(block_size, vi(block_size));

        int offset = b * block_size;
        REP(l, block_size) {
            blocks[mask][l][l] = l;
            FOR(r, l + 1, block_size - 1) {
                blocks[mask][l][r] = blocks[mask][l][r - 1];
                if (offset + r >= m) continue;
                blocks[mask][l][r] = min_by_h(offset + blocks[mask][l][r], offset + r) - offset;
            }
        }
    }
}

void precompute_lca(int root) {
    // get euler tour & indices of first occurrences
    first_visit.assign(n, -1);
    height.assign(n, 0);
    euler_tour.clear();
    euler_tour.reserve(2 * n);
    flatten(root, -1, 0);

    // decomposition
    int m = sz(euler_tour);
    block_size = max(1, log_2[m] / 2);
    block_cnt = (m + block_size - 1) / block_size;

    precompute_sparse_table(m);
    precompute_block_mask(m);
    precompute_blocks(m);
}

int lca_in_block(int b, int l, int r) {
    int offset = b * block_size;
    return offset + blocks[block_mask[b]][l][r];
}

int lca(int v, int u) {
    int l = first_visit[v];
    int r = first_visit[u];
    if (l > r) swap(l, r);
    int bl = l / block_size;
    int br = r / block_size;
    // both ends in one block
    if (bl == br) return euler_tour[lca_in_block(bl, l % block_size, r % block_size)];
    // suffix of l's block, prefix of r's block
    int suffix = lca_in_block(bl, l % block_size, block_size - 1);
    int prefix = lca_in_block(br, 0, r % block_size);
    int ans = min_by_h(suffix, prefix);
    // whole blocks in between
    if (bl + 1 < br) ans = min_by_h(ans, query_sparse_table(bl + 1, br - 1));
    return euler_tour[ans];
}

void preprocess() {
    // log values up to the longest euler tour, 2n - 1
    precompute_log(2 * MAX_N);
}

void solve() {
    // read tree
    int q; cin >> n >> q;
    adj.assign(n, {});
    REP(i, n-1) {
        int a, b; cin >> a >> b;
        a--; b--;
        adj[a].pb(b);
        adj[b].pb(a);
    }

    // precompute lca, rooted at vertex 1
    precompute_lca(0);

    // answer queries
    REP(i, q) {
        int u, v; cin >> u >> v;
        u--; v--;
        cout << lca(u, v) + 1 << '\n';
    }
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    cerr.tie(0);
    preprocess();
    int tt = 1;
    // cin >> tt;
    while (tt--) solve();
    return 0;
}
```

</details>

The same code as a reusable class, `FCB fcb(adj, root); fcb.lca(u, v);`, is [`FCB.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/trees/farach-colton_bender/FCB.h) in the notebook. I checked this version against a climb-one-level brute force on 3,000 random trees (random, path-like and caterpillar shapes, up to 3,000 vertices, random roots), 900,000 queries in all.

How the functions map to the argument:

| Function                     | Role                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| `flatten(v, p, h)`           | The Euler tour: fills `euler_tour`, `first_visit`, `height` (Step 1) |
| `min_by_h(i, j)`             | The tour index whose vertex is shallower                             |
| `precompute_log(m)`          | `log_2[x]` $$= \lfloor \log_2 x \rfloor$$                            |
| `precompute_sparse_table(m)` | Block minimums and the sparse table over blocks (Step 3, Claim A)    |
| `query_sparse_table(L, R)`   | Minimum over whole blocks $$[L, R]$$, two overlapping windows        |
| `precompute_block_mask(m)`   | One bit per step inside each block (Step 4)                          |
| `precompute_blocks(m)`       | In-block minimums, once per mask (Lemma 3, Claim B)                  |
| `lca_in_block(b, l, r)`      | In-block minimum, turned back into a tour index                      |
| `lca(v, u)`                  | One block, or suffix + whole blocks + prefix                         |

Pitfalls:

- **Store both directions of each edge.** Step 1 says why.
- **`log_2` must cover the tour**, $$2n - 1$$ entries, not $$n$$.
- **Reset between test cases** with `assign` and `clear`, not `push_back` or `resize`.
- **Deep recursion.** A path of $$5 \cdot 10^5$$ vertices recurses that deep. Locally, run `ulimit -s 65520` first.

### In practice

On my machine, with a random tree of $$5 \cdot 10^5$$ vertices and $$5 \cdot 10^5$$ queries at `-O2`, the build times are close (about 25 to 40 ms each), and the plain sparse table answers queries two to two and a half times as fast (7 to 10 ms against 16 to 18 ms). A block query touches the mask array, two mask tables and the block sparse table, all in different places, while the plain query reads two entries of one table.

Where Farach-Colton and Bender wins is memory: about $$1.9 \cdot 10^6$$ table entries against $$2 \cdot 10^7$$ (80 MB of `int`s). So in a contest, the plain Euler tour sparse table is the default, and binary lifting when you also need $$k$$-th ancestors. Reach for this one when memory is tight, or for the ideas, which go further than LCA.

### Three distances, halved: LeetCode 3553 {#lca-3553}

[LeetCode 3553 — Minimum Weighted Subgraph With the Required Paths II](https://leetcode.com/problems/minimum-weighted-subgraph-with-the-required-paths-ii/) gives a tree with $$n \le 10^5$$ vertices and edge weights $$1 \le w \le 10^4$$, and up to $$10^5$$ queries $$(s_1, s_2, t)$$ of three distinct vertices. For each query, find the minimum total weight of a subtree in which both $$s_1$$ and $$s_2$$ can reach $$t$$.

**The first instinct.** Paths in a tree are unique, so the subtree must contain $$P(s_1, t)$$ and $$P(s_2, t)$$, and their union is enough. That suggests $$d(s_1, t) + d(s_2, t)$$, but it counts the stretch the two paths share twice. They run together from $$t$$ until they split at the [meeting vertex](#meeting-vertex) $$c$$, so the answer is $$d(s_1, t) + d(s_2, t) - d(c, t)$$. That works, but it needs $$c$$, the deepest of the three pairwise LCAs. Is there a way to never find $$c$$ at all?

**Count each edge instead.** Delete an edge, and the tree falls into two parts. The three vertices split between them either 3–0 or 2–1.

- **3–0.** The edge is on none of the three pairwise paths, and the subtree doesn't need it.
- **2–1.** The edge is on exactly two of the three pairwise paths, the two whose ends it separates. The subtree needs it, since the lone vertex has no other way to the other two.

So the three pairwise distances count every needed edge exactly twice and every other edge zero times:

$$
\text{answer} = \frac{d(s_1, s_2) + d(s_2, t) + d(t, s_1)}{2}.
$$

This is the meeting-vertex lemma again, for edges instead of vertices: each edge is on $$0$$ or $$2$$ of the three paths, and there is no exception like $$c$$, because one edge can't split three vertices three ways. The formula is symmetric, so which vertex is the destination doesn't matter. The answer is the weight of the smallest subtree that joins all three. On the problem's first example, the query $$(2, 3, 4)$$ has distances $$8$$, $$9$$ and $$7$$, and half of $$24$$ is $$12$$.

**Distances from LCAs.** Root the tree at $$0$$ and let $$W(x)$$ be the weighted depth, the total weight from the root down to $$x$$. The path from $$u$$ to $$v$$ climbs to $$\operatorname{lca}(u, v)$$ and comes back down, so

$$
d(u, v) = W(u) + W(v) - 2\,W(\operatorname{lca}(u, v)).
$$

A query is three LCAs, $$O(1)$$ each, so the whole problem is $$O(n + q)$$. It runs in about 30 ms for $$n = q = 10^5$$. Binary lifting, at $$O((n + q) \log n)$$, passes too.

**Two depths, not one.** `flatten` records both: `weight` for the distances, and the plain `height` for the LCA. Could the LCA use the weighted depth instead? With weights of at least $$1$$, the weighted depth also strictly increases going down, so Lemma 2 and the theorem still hold, and a plain sparse table would find the LCA either way. The masks would not. Step 4 needs every step of the tour to be $$+1$$ or $$-1$$, and a weighted step is $$\pm w$$, so two blocks with the same up/down pattern could have their minimums in different places.

**Overflow.** The answer is at most the total edge weight, $$(n - 1) \cdot 10^4 < 10^9$$, so the sum of the three distances stays below $$2 \cdot 10^9 < 2^{31} - 1$$, and so does $$W(u) + W(v)$$. An `int` is enough, with about $$7\%$$ to spare. Heavier weights would need `long long`.

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const int MAX_N = 1e5, MAX_M = 1e5;

int n, m;

// adj matrix
vector<pii> Adj[MAX_N + 5];

// euler tour
vi euler;
vi first_visit;
vi weight;
vi height;

// decomposition
int block_sz, block_cnt;
vii sparse;
vector<vii> blocks;
vi block_mask;

// log2
vi lg2;

void precompute_log2() {
    lg2.assign(2 * n + 1, 0);
    lg2[0] = -1;
    FOR(i, 1, 2 * n) lg2[i] = lg2[i/2] + 1;
}

void flatten(int u, int p, int W, int H) {
    weight[u] = W;
    height[u] = H;
    first_visit[u] = sz(euler);
    euler.pb(u);
    for (auto& [v, w] : Adj[u]) {
        if (v == p) continue;
        flatten(v, u, W + w, H+1);
        euler.pb(u);
    }
}

int min_by_h(int i, int j) {
    return height[euler[i]] < height[euler[j]] ? i : j;
}

void precompute_sparse_table(int k) { // offset factored in
    sparse.assign(block_cnt, vi(lg2[block_cnt] + 1));
    // sparse[b][0] = min of block
    REP(i, k) {
        int b = i / block_sz, j = i % block_sz;
        if (j == 0) sparse[b][0] = i;
        else sparse[b][0] = min_by_h(sparse[b][0], i);
    }
    // sparse[b][j] = min of blocks[b..b+2^j-1] = min of blocks[b..b+2^(j-1)-1], blocks[b+2^(j-1)..b+2^j-1]
    FOR(j, 1, lg2[block_cnt]) {
        REP(b, block_cnt) {
            if (b + (1 << j) > block_cnt) continue;
            sparse[b][j] = min_by_h(sparse[b][j-1], sparse[b+(1<<(j-1))][j-1]);
        }
    }
}

void precompute_block_mask(int k) {
    block_mask.assign(block_cnt, 0);
    REP(i, k) {
        int b = i / block_sz, j = i % block_sz;
        if (j > 0 && min_by_h(i, i-1) == i-1) block_mask[b] |= (1 << (j-1));
    }
}

void precompute_blocks(int k) {
    int FULL = 1 << (block_sz-1);
    blocks.assign(FULL, {});

    REP(b, block_cnt) {
        int mask = block_mask[b];

        if (!blocks[mask].empty()) continue;
        blocks[mask].assign(block_sz, vi(block_sz));

        int offset = b * block_sz;
        REP(l, block_sz) {
            blocks[mask][l][l] = l;
            FOR(r, l+1, block_sz-1) {
                blocks[mask][l][r] = blocks[mask][l][r-1];
                if (offset + r >= k) continue;
                blocks[mask][l][r] = min_by_h(blocks[mask][l][r] + offset, r + offset) - offset;
            }
        }
    }
}

void precompute_lca() {
    // euler tour flatten tree
    euler.clear();
    first_visit.assign(n, -1);
    weight.assign(n, 0);
    height.assign(n, 0);
    flatten(0, -1, 0, 0);

    // decomposition
    int k = sz(euler);
    block_sz = max(1, lg2[k] / 2);
    block_cnt = (k + block_sz - 1) / block_sz;

    precompute_sparse_table(k);
    precompute_block_mask(k);
    precompute_blocks(k);
}

int lca_in_block(int b, int l, int r) {
    int offset = b * block_sz;
    return blocks[block_mask[b]][l][r] + offset;
}

int lca_between_blocks(int bl, int br) {
    int j = lg2[br - bl + 1];
    return min_by_h(sparse[bl][j], sparse[br - (1 << j) + 1][j]);
}

int lca(int u, int v) {
    int l = first_visit[u], r = first_visit[v];
    if (l > r) swap(l, r);
    int bl = l / block_sz, br = r / block_sz;

    // same block
    if (bl == br) return euler[lca_in_block(bl, l % block_sz, r % block_sz)];
    // suffix of l
    int suffix = lca_in_block(bl, l % block_sz, block_sz-1);
    // prefix of r
    int prefix = lca_in_block(br, 0, r % block_sz);

    int ans = min_by_h(suffix, prefix);
    // lca between blocks
    if (bl < br-1) ans = min_by_h(ans, lca_between_blocks(bl+1, br-1));

    return euler[ans];
}

int getWeight(int u, int v) {
    return weight[u] + weight[v] - 2 * weight[lca(u, v)];
}

int minTotalWeight(vi query) {
    int src1 = query[0], src2 = query[1], dest = query[2];
    int res = 0;
    res += getWeight(src1, src2);
    res += getWeight(src2, dest);
    res += getWeight(dest, src1);
    res >>= 1;
    return res;
}

class Solution {
public:
    vi minimumWeight(vii& edges, vii& queries) {
        n = sz(edges) + 1;
        m = sz(queries);
        REP(i, n) Adj[i].clear();

        for (auto& e : edges) {
            int u = e[0], v = e[1], w = e[2];
            // two-way edge
            Adj[u].pb({v, w});
            Adj[v].pb({u, w});
        }

        precompute_log2();
        precompute_lca();

        vi ans(m);
        REP(i, m) ans[i] = minTotalWeight(queries[i]);
        return ans;
    }
};
```

</details>

### Decomposing the queries: Xenia and Tree

Step 3 cut the array into blocks. [Codeforces 342E — Xenia and Tree](https://codeforces.com/problemset/problem/342/E) needs the same move cut along _time_, and it is a problem where an $$O(1)$$ LCA pays for itself.

A tree has $$n \le 10^5$$ vertices. Vertex $$1$$ is red and the rest are blue. Then come $$m \le 10^5$$ operations:

- `1 v`: paint $$v$$ red.
- `2 v`: print the distance from $$v$$ to the nearest red vertex.

**Two first instincts, failing in opposite directions.**

- _Keep every answer ready._ After each paint, run a BFS from all the red vertices at once and store each vertex's distance. An ask is $$O(1)$$, but a paint is $$O(n)$$, and $$10^5$$ paints cost $$10^{10}$$.
- _Keep only the list of reds._ An ask takes the minimum of $$d(u, v) = h(u) + h(v) - 2h(\operatorname{lca}(u, v))$$ over every red $$u$$. A paint is $$O(1)$$, but an ask scans every red so far, and $$5 \cdot 10^4$$ paints followed by $$5 \cdot 10^4$$ asks cost $$2.5 \cdot 10^9$$ LCA queries.

The first makes every paint pay for the asks, and the second makes every ask pay for the paints. The question that unblocks it: **does the stored distance have to be up to date after every paint?**

It doesn't. Let it fall a few paints behind, and let each ask make up the difference.

**The invariant.** Split the red vertices into the **committed** ones, $$R$$, already written into an array `dist` so that $$\mathrm{dist}[v] = d(v, R)$$, and the **uncommitted** ones, $$C$$ (`changed`), painted since the last commit. The nearest red vertex is in $$R$$ or in $$C$$, so

$$
d(v, R \cup C) = \min\Big(\mathrm{dist}[v],\ \min_{c \in C} d(v, c)\Big).
$$

- A paint is a write. It appends to $$C$$, and when $$C$$ holds $$Q$$ vertices, one BFS commits them to `dist` and $$C$$ starts over empty.
- An ask is a read. It starts from the committed `dist[v]` and lowers it by one distance per uncommitted vertex, each one LCA away.

It reads like a database: writes go to a short log first, a read checks the committed state and then the log, and the log is committed in batches. An LSM tree's [memtable](/blog/databases/#skip-list) works the same way.

At the start $$R = \{1\}$$. Vertex $$1$$ is the root, so `dist` is just the depth.

**Choosing $$Q$$.** An ask sees fewer than $$Q$$ vertices in $$C$$, so it costs $$O(Q)$$. A commit happens once every $$Q$$ paints, so at most $$m / Q$$ times, at $$O(n)$$ each. In all,

$$
mQ + \frac{nm}{Q} \;=\; m\Big(Q + \frac{n}{Q}\Big),
$$

and the two terms meet at $$Q = \sqrt n$$, for $$O(m \sqrt n)$$. The $$m$$ factors out, so the best $$Q$$ depends only on $$n$$, and the code sets `query_block = sqrt(n)` as soon as it has read $$n$$. A fixed constant would be tuned for one tree size only. With $$n = m = 10^5$$, $$Q = 316$$ and the total is about $$6.3 \cdot 10^7$$ steps. As with $$b$$, the valley is flat: $$Q = \sqrt n / 1.6$$ or $$1.6 \sqrt n$$ costs $$11\%$$ more, and $$\sqrt n / 3$$ or $$3 \sqrt n$$ costs $$67\%$$ more.

**The same move as Step 3, along time.** In Step 3 the blocks were runs of positions. Whole blocks were answered from a summary built in advance, the sparse table, and the two partial blocks were handled separately. Here the blocks are runs of paints. Every complete run is already summarized in `dist`, and the one incomplete run, $$C$$, is scanned by brute force. What is balanced differs. In Step 3 both parts of a query had to be $$O(1)$$, so $$b$$ balanced two preprocessing costs and came out as $$\tfrac12 \log_2 m$$. Here an ask may cost $$O(Q)$$, so $$Q$$ balances the scan against the commits and comes out as the familiar $$\sqrt n$$.

**Why the $$O(1)$$ LCA matters here.** The scan is really $$mQ$$ LCA queries, $$3 \cdot 10^7$$ of them. If one LCA costs $$t$$, the total is $$mQt + nm/Q$$, which is smallest at $$Q = \sqrt{n / t}$$, with value $$2m\sqrt{nt}$$. Binary lifting has $$t \approx \log_2 n \approx 17$$, which moves $$Q$$ down to about $$77$$ and the total up to about $$2.6 \cdot 10^8$$, a factor of $$\sqrt{17} \approx 4$$. An $$O(1)$$ LCA, the plain sparse table or this one, keeps the scan cheap enough for $$Q$$ to sit at $$\sqrt n$$. At $$n = 10^5$$ the plain table has only about $$3.6 \cdot 10^6$$ entries, so either one fits.

**The commit.** `dist` is already right for $$R$$, and only the vertices that $$C$$ brings closer change. So a commit doesn't redo a BFS from every red vertex. It starts a BFS from $$C$$ alone and steps into a neighbor only when that makes the neighbor closer. With `lca` and `height` from the implementation above, the rest of the solution is:

```cpp
// query decomposition
int query_block;
vi changed; // reds not yet committed
vi dist;

void commit() {
    queue<int> q;
    for (int u : changed) {
        if (dist[u] == 0) continue; // already red
        dist[u] = 0;
        q.push(u);
    }
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] > dist[u] + 1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    changed.clear();
}

void paint(int v) {
    changed.pb(v);
    if (sz(changed) >= query_block) commit();
}

int getDist(int u, int v) {
    return height[u] + height[v] - 2 * height[lca(u, v)];
}

void getMinDistRed(int v) {
    int res = dist[v];
    for (int u : changed) res = min(res, getDist(u, v));
    cout << res << '\n';
}

// in solve(), after reading the tree:
//     query_block = max(1, (int)sqrt(n));
//     precompute_lca(0);
//     dist = height; // vertex 1 is the root
```

The search stops wherever the old red vertices are at least as close, so a commit touches only the region that $$C$$ actually moves. It is still $$O(n)$$ in the worst case, and that is all the bound needs.

> **Lemma 4 (the commit).** After `commit`, $$\mathrm{dist}[v] = \min\big(d(v, R),\ d(v, C)\big)$$ for every $$v$$, and each vertex enters the queue at most once.

<details markdown="1">
<summary>Proof</summary>

Write $$\mathrm{old}(v) = d(v, R)$$, the value of `dist[v]` before the commit.

_`dist` never drops below the target._ A value written by the commit is $$0$$ on a vertex of $$C$$, or $$\mathrm{dist}[u] + 1$$ for a neighbor $$u$$ taken from the queue. By induction, every value in the queue is the length of a walk from $$C$$, so every value written is at least $$d(v, C)$$, and values only ever go down from $$\mathrm{old}(v)$$.

_`dist` reaches the target._ If $$d(v, C) \ge \mathrm{old}(v)$$ there is nothing to show. Otherwise take a shortest path $$x_0 \in C, x_1, \dots, x_k = v$$, so $$k = d(v, C) < \mathrm{old}(v)$$. Each $$x_i$$ is at distance exactly $$i$$ from $$C$$, or $$v$$ would be closer than $$k$$. And $$\mathrm{old}(x_i) \ge \mathrm{old}(v) - (k - i) > i$$, because the distance to $$R$$ changes by at most $$1$$ per edge. So the commit may lower every $$x_i$$, and by induction each $$x_i$$ enters the queue with value $$i$$. For $$x_0$$: $$\mathrm{old}(x_0) > 0$$, so the guard does not skip it. For $$x_i$$: when $$x_{i-1}$$ leaves the queue with value $$i - 1$$, either $$\mathrm{dist}[x_i] > i$$ and the commit sets it to $$i$$, or $$\mathrm{dist}[x_i] \le i < \mathrm{old}(x_i)$$, so the commit lowered it earlier, to at least $$d(x_i, C) = i$$, so to exactly $$i$$. So $$\mathrm{dist}[v] = k$$.

_Each vertex enters at most once._ As in any BFS, every value pushed is one more than a value popped, and every source is pushed at $$0$$, so values leave the queue in nondecreasing order. A vertex is pushed only when its value drops. After its first push, at $$p + 1$$ from a vertex popped at $$p$$, any later candidate comes from a vertex popped later, at some $$p' \ge p$$, and $$p' + 1$$ is no drop. A source is pushed once too: after it, its value is $$0$$ and the guard skips its repeats. So a commit is $$O(n)$$. $$\blacksquare$$

</details>

The guard on the first line of `commit` is not cosmetic. Without it, a vertex painted many times in one batch is pushed once per paint, and each push scans its whole neighbor list. On a star whose center is painted $$10^5$$ times, each commit scans $$\sqrt n \times 10^5 \approx 3 \cdot 10^7$$ edges. That input takes 4.8 s without the guard and 0.2 s with it.

The full solution is [`342E.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/examples/trees/farach-colton_bender/342E.cpp). I checked it against a brute-force BFS on 400 random trees. On a path where every ask sees $$315$$ pending reds, about $$3 \cdot 10^7$$ LCA queries, it runs in about 0.8 s.

### Where it goes next

- **Any RMQ in $$O(n)$$ and $$O(1)$$.** Build the Cartesian tree of an arbitrary array (the minimum at the root, recursively on both sides; one pass with a stack). The minimum of $$[l, r]$$ is the LCA of $$l$$ and $$r$$ in that tree, and LCA is ±1 RMQ by Step 1. So RMQ reduces to LCA, which reduces to ±1 RMQ. That round trip is the main result of Bender and Farach-Colton's paper.
- **Level ancestor.** The same authors later gave a simple $$O(n)$$ / $$O(1)$$ level ancestor structure, which is the problem binary lifting answers in $$O(\log n)$$.

> **The pattern worth naming.** When a table indexed by position is too big, cut the input into blocks of size $$\Theta(\log n)$$. Summarize each block for the coarse level, and precompute the fine answers once per block _type_ rather than once per block. It works exactly when the number of types grows at most exponentially in the block size, so the thing to look for is structure, like ±1 steps or a Cartesian tree, that makes the types few. This table-per-type idea is the Method of Four Russians.

## From the Notebook {#notebook}

Implementations from my [competitive programming notebook](https://github.com/lamng3/competitive-programming-notebook), tagged with their [USACO Guide](https://usaco.guide/) level where they have one.

- **Graph search** (silver). [`BFS.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/bfs/BFS.py): Multi-source BFS on a graph or a grid, and 0-1 BFS. [`DFS.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/dfs/DFS.py): Components, flood fill, and a rooted tree's parent, depth, and size, with explicit stacks. [`Dijkstra.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/shortest_path/Dijkstra.py): Dijkstra with path recovery. [`TopoSort.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/topological_sort/TopoSort.py): Kahn's algorithm.
- **Disjoint set union** (gold). [`DSU.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/graphs/dsu/DSU.h): Parent and size, with path compression. [`DSU.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/dsu/DSU.py): The same structure in Python. [`323.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/examples/graphs/dsu/323.cpp): A worked DSU problem.
- **Euler tour** (gold). [`EulerTour.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/trees/euler_tour/EulerTour.h): Entry and exit times on a tree. [`euler_tour/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/euler_tour): Solved Euler-tour problems. [`EulerTour.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/trees/euler_tour/EulerTour.py): The same tour in Python, with an explicit stack.
- **LCA in O(1)** (advanced). [`FCB.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/trees/farach-colton_bender/FCB.h): Farach-Colton and Bender as a class. [`README.md`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/trees/farach-colton_bender/README.md): The proofs in short. [`fcb.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/examples/trees/farach-colton_bender/fcb.cpp): The same code as a full solution. [`342E.cpp`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/examples/trees/farach-colton_bender/342E.cpp): Xenia and Tree, with the paints committed in batches of $$\sqrt n$$.
- **Binary lifting** (platinum). [`binary_lifting/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/binary_lifting): Binary lifting solutions.
- **Small to large** (platinum). [`small_to_large_merging/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/small_to_large_merging): Small-to-large merging solutions.
- **DSU rollback** (advanced). [`DSURollback.h`](https://github.com/lamng3/competitive-programming-notebook/blob/main/notebook/graphs/dsu/DSURollback.h): Disjoint set union that can undo unions. [`dsu_rollback/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/dsu_rollback): A solved rollback problem. [`DSURollback.py`](https://github.com/lamng3/competitive-programming-notebook/blob/main/python/graphs/dsu/DSURollback.py): The same structure in Python.
- **Strongly connected components** (advanced). [`kosaraju/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/kosaraju): Kosaraju solutions.
- **Eulerian path** (advanced). [`eulerian_path/`](https://github.com/lamng3/competitive-programming-notebook/blob/main/contests/leetcode/solve/eulerian_path): Eulerian-path solutions.

## Practice {#practice}

**Topological Order, One Entry at a Time**

- [LeetCode 3481 — Apply Substitutions](https://leetcode.com/problems/apply-substitutions/)
- [LeetCode 207 — Course Schedule](https://leetcode.com/problems/course-schedule/)
- [LeetCode 210 — Course Schedule II](https://leetcode.com/problems/course-schedule-ii/)
- [LeetCode 269 — Alien Dictionary](https://leetcode.com/problems/alien-dictionary/)
- [LeetCode 1136 — Parallel Courses](https://leetcode.com/problems/parallel-courses/)
- [LeetCode 1096 — Brace Expansion II](https://leetcode.com/problems/brace-expansion-ii/)

**Counting on Trees: The Meeting Vertex**

- [Codeforces 2241E](https://codeforces.com/contest/2241/problem/E)
- [Codeforces 161D — Distance in Tree](https://codeforces.com/problemset/problem/161/D)
- [LeetCode 3067 — Count Pairs of Connectable Servers in a Weighted Tree Network](https://leetcode.com/problems/count-pairs-of-connectable-servers-in-a-weighted-tree-network/)

**The Coloring Orients the Tree**

- [LeetCode 4085 — Find Root of a Colored Tree](https://leetcode.com/problems/find-root-of-a-colored-tree/)

**LCA in O(1): Farach-Colton and Bender**

- [CSES 1688 — Company Queries II](https://cses.fi/problemset/task/1688)
- [CSES 1135 — Distance Queries](https://cses.fi/problemset/task/1135)
- [Library Checker — Lowest Common Ancestor](https://judge.yosupo.jp/problem/lca)
- [Library Checker — Static RMQ](https://judge.yosupo.jp/problem/staticrmq)
- [LeetCode 3553 — Minimum Weighted Subgraph With the Required Paths II](https://leetcode.com/problems/minimum-weighted-subgraph-with-the-required-paths-ii/)
- [Codeforces 342E — Xenia and Tree](https://codeforces.com/problemset/problem/342/E)
- [LeetCode 1483 — Kth Ancestor of a Tree Node](https://leetcode.com/problems/kth-ancestor-of-a-tree-node/) (level ancestor, by binary lifting)

## Further reading {#further-reading}

**Counting on Trees: The Meeting Vertex**

- [Codeforces 2241E editorial](https://codeforces.com/blog/entry/154698) — the meeting-vertex proof in full.

**LCA in O(1): Farach-Colton and Bender**

- [cp-algorithms — Farach-Colton and Bender](https://cp-algorithms.com/graph/lca_farachcoltonbender.html), the implementation this one follows.
- [cp-algorithms — Sparse Table](https://cp-algorithms.com/data_structures/sparse-table.html).
- [cp-algorithms — Sqrt Decomposition](https://cp-algorithms.com/data_structures/sqrt_decomposition.html), the same block idea on arrays, and on queries with Mo's algorithm.
- M. A. Bender and M. Farach-Colton, _The LCA Problem Revisited_, LATIN 2000. The RMQ to LCA to ±1 RMQ round trip.
- M. A. Bender and M. Farach-Colton, _The Level Ancestor Problem Simplified_, LATIN 2002.
- [Method of Four Russians](https://en.wikipedia.org/wiki/Method_of_Four_Russians) on Wikipedia, and the original: V. L. Arlazarov, E. A. Dinic, M. A. Kronrod and I. A. Faradzhev, _On Economical Construction of the Transitive Closure of an Oriented Graph_, Soviet Math. Doklady, 1970.
