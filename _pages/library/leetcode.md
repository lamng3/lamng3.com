---
layout: template
title: "LeetCode Template"
description: "LeetCode Template in C++ and Python, from my competitive programming notebook."
permalink: /library/leetcode/
slug: leetcode
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
// g++ -std=c++17 -DLOCAL template.cpp -o solution
#include <bits/stdc++.h>
using namespace std;

#pragma region Debug
#ifdef LOCAL
template<typename T, typename U>
ostream& operator<<(ostream& os, const pair<T,U>& p) {
    return os << "(" << p.first << ", " << p.second << ")";
}
template<typename T>
ostream& operator<<(ostream& os, const vector<T>& v) {
    os << "[";
    for (int i = 0; i < (int)v.size(); i++) os << (i ? ", " : "") << v[i];
    return os << "]";
}
template<typename T>
ostream& operator<<(ostream& os, const set<T>& s) {
    os << "{";
    int i = 0;
    for (auto& x : s) os << (i++ ? ", " : "") << x;
    return os << "}";
}
template<typename K, typename V>
ostream& operator<<(ostream& os, const map<K,V>& m) {
    os << "{";
    int i = 0;
    for (auto& [k, v] : m) os << (i++ ? ", " : "") << k << ": " << v;
    return os << "}";
}
template<typename T>
ostream& operator<<(ostream& os, queue<T> q) {
    os << "[";
    bool first = true;
    while (!q.empty()) {
        if (!first) os << ", ";
        os << q.front();
        q.pop();
        first = false;
    }
    return os << "]";
}
void _dbg() { cerr << endl; }
template<typename T, typename... A>
void _dbg(T t, A... a) { cerr << " " << t; if constexpr(sizeof...(a)) cerr << ","; _dbg(a...); }
#define dbg(...) cerr << "\033[35m[" << #__VA_ARGS__ << "]\033[0m:", _dbg(__VA_ARGS__)
#else
#define dbg(...)
#endif
#pragma endregion

using ll = long long;
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

class Solution {
// LeetCode method function
// void solve() {}
public:

};

#if !defined(CPTEST) && (defined(LOCAL) || defined(ONLINE_JUDGE))
void preprocess() {
    
}

// cout << Solution().solve() << '\n';
void solve() {
    
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    preprocess();
    int tt = 1;
    // cin >> tt;
    while (tt--) solve();
    return 0;
}
#endif
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
from bisect import bisect_left, bisect_right
from collections import Counter, defaultdict, deque
from functools import cache
from heapq import heapify, heappop, heappush
from itertools import accumulate, combinations, permutations, product
from math import comb, gcd, inf, isqrt, lcm
import sys

sys.setrecursionlimit(1 << 20) # a DFS 10^5 deep would hit the default of 1000

INF = 10**9 + 7
MOD = 10**9 + 7

dr = [1, -1, 0, 0]
dc = [0, 0, 1, -1]


class Solution:
    # LeetCode method function
    pass
```
{% endraw %}

</div>
