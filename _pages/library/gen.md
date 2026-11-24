---
layout: template
title: "gen"
description: "gen in C++, from my competitive programming notebook."
permalink: /library/gen/
slug: gen
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
// Random test generator for cpdiff. Prints one test to stdout.
// cpdiff runs it as ./gen <seed>, so a failing test can be replayed with the same seed.
// Keep tests small: a 5-element counterexample is easier to debug than a 10^5 one.
#include <bits/stdc++.h>
using namespace std;
using ll = long long;

mt19937_64 rng;

// uniform integer in [l, r]
ll rnd(ll l, ll r) { return uniform_int_distribution<ll>(l, r)(rng); }

// uniform real in [l, r)
double rndf(double l, double r) { return uniform_real_distribution<double>(l, r)(rng); }

// n integers in [l, r]
vector<ll> rnd_vec(int n, ll l, ll r) {
    vector<ll> a(n);
    for (auto& x : a) x = rnd(l, r);
    return a;
}

// a random permutation of 1..n
vector<int> rnd_perm(int n) {
    vector<int> p(n);
    iota(p.begin(), p.end(), 1);
    shuffle(p.begin(), p.end(), rng);
    return p;
}

// string of length n over the characters in alphabet
string rnd_str(int n, const string& alphabet = "ab") {
    string s(n, ' ');
    for (auto& c : s) c = alphabet[rnd(0, (ll)alphabet.size() - 1)];
    return s;
}

// relabel the vertices 1..n at random and shuffle the edge order and directions
vector<pair<int, int>> relabel(int n, vector<pair<int, int>> e) {
    vector<int> id = rnd_perm(n);
    for (auto& [u, v] : e) {
        u = id[u - 1], v = id[v - 1];
        if (rnd(0, 1)) swap(u, v);
    }
    shuffle(e.begin(), e.end(), rng);
    return e;
}

// random tree: vertex i joins a random earlier vertex. Fast, but shallow (depth ~ log n)
vector<pair<int, int>> rnd_tree(int n) {
    vector<pair<int, int>> e;
    for (int v = 2; v <= n; v++) e.push_back({(int)rnd(1, v - 1), v});
    return relabel(n, e);
}

// uniformly random tree from a random Prufer sequence
vector<pair<int, int>> rnd_tree_prufer(int n) {
    if (n <= 1) return {};
    vector<int> code(n - 2), deg(n + 1, 1);
    for (int& x : code) x = rnd(1, n), deg[x]++;
    priority_queue<int, vector<int>, greater<int>> leaves;
    for (int v = 1; v <= n; v++) if (deg[v] == 1) leaves.push(v);
    vector<pair<int, int>> e;
    for (int x : code) {
        int leaf = leaves.top(); leaves.pop();
        e.push_back({leaf, x});
        if (--deg[x] == 1) leaves.push(x);
    }
    int u = leaves.top(); leaves.pop();
    e.push_back({u, leaves.top()});
    return relabel(n, e);
}

// special trees, which random ones almost never produce:
// 0 path, 1 star, 2 complete binary tree, 3 broom (a path with a star on one end)
vector<pair<int, int>> special_tree(int n, int type) {
    vector<pair<int, int>> e;
    int handle = max(1, n / 2);
    for (int v = 2; v <= n; v++) {
        int p = type == 0 ? v - 1 : type == 1 ? 1 : type == 2 ? v / 2 : (v <= handle ? v - 1 : handle);
        e.push_back({p, v});
    }
    return relabel(n, e);
}

template<class T>
void print_vec(const vector<T>& a) {
    for (int i = 0; i < (int)a.size(); i++) cout << a[i] << " \n"[i + 1 == (int)a.size()];
    if (a.empty()) cout << '\n';
}

void gen_test() {
    int n = rnd(1, 8);
    cout << n << '\n';
    print_vec(rnd_vec(n, 1, 10));
}

int main(int argc, char** argv) {
    rng.seed(argc > 1 ? stoull(argv[1]) : chrono::steady_clock::now().time_since_epoch().count());
    int tt = 1;  // set tt = rnd(1, 3) and print it when the problem has multiple test cases
    // cout << tt << '\n';
    while (tt--) gen_test();
    return 0;
}
```
{% endraw %}

</div>
