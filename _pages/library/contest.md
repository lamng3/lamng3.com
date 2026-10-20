---
layout: template
title: "Contest Template"
description: "Contest Template in C++, from my competitive programming notebook."
permalink: /library/contest/
slug: contest
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#include <bits/stdc++.h>
using namespace std;

#ifdef LOCAL
template<class T, class U>
ostream& operator<<(ostream& os, const pair<T, U>& p) {
    return os << "(" << p.first << ", " << p.second << ")";
}
template<class T, class = void>
struct is_iterable : false_type {};
template<class T>
struct is_iterable<T, void_t<decltype(begin(declval<T&>())), decltype(end(declval<T&>()))>> : true_type {};
template<class T, enable_if_t<is_iterable<T>::value && !is_convertible_v<T, string_view>, int> = 0>
ostream& operator<<(ostream& os, const T& a) {
    os << "[";
    bool first = true;
    for (const auto& x : a) {
        if (!first) os << ", ";
        first = false;
        os << x;
    }
    return os << "]";
}
template<class T, class... A>
void _dbg(const T& t, const A&... a) {
    cerr << " " << t;
    if constexpr (sizeof...(a)) {
        cerr << ",";
        _dbg(a...);
    } else cerr << endl;
}
#define dbg(...) (cerr << "[" << #__VA_ARGS__ << "]:", _dbg(__VA_ARGS__))
#else
#define dbg(...)
#endif

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
// const int MOD = 998244353; // 1e9+7
const int MOD = 1e9+7;

mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());

void preprocess() {
    
}

void solve() {
    
}

int main() {
    // freopen("name.in", "r", stdin);
    // freopen("name.out", "w", stdout);
    ios::sync_with_stdio(0);
    cin.tie(0);
    cerr.tie(0);
    preprocess();
    int tt = 1;
    cin >> tt;
    while (tt--) solve();
    return 0;
}
```
{% endraw %}

</div>
