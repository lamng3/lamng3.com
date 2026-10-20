---
layout: template
title: "OI Template (file I/O)"
description: "OI Template (file I/O) in C++, from my competitive programming notebook."
permalink: /library/oi/
slug: oi
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#include <bits/stdc++.h>
using namespace std;

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

const int INF = 1e9 + 7;
const int MOD = 1e9 + 7;

mt19937_64 rng(chrono::steady_clock::now().time_since_epoch().count());

namespace Sub1 {
    bool istask() {
        return true;
    }
    void execute() {
        
    }
}

namespace Full {
    void run() {
        
    }
}

void preprocess() {
    
}

void solve() {
    if (Sub1::istask()) { Sub1::execute(); return; }
    Full::run();
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
```
{% endraw %}

</div>
