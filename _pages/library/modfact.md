---
layout: template
title: "Factorials and Binomials mod p"
description: "Factorials and Binomials mod p in C++ and Python, from my competitive programming notebook."
permalink: /library/modfact/
slug: modfact
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
#include <bits/stdc++.h>
using namespace std;

using ll = long long;
const int MOD = 1e9+7;

ll binpow(ll a, ll b) {
    a %= MOD;
    ll res = 1;
    while (b) {
        if (b % 2) res = (res * a) % MOD;
        a = (a * a) % MOD;
        b >>= 1;
    }
    return res;
}

ll modInverse(ll a) {
    return binpow(a, MOD-2);
}

struct ModFact {
    int n;
    vector<ll> fac, inv;

    ModFact(int _n) : n(_n) {
        fac.resize(n+1);
        inv.resize(n+1);
        fac[0] = 1;
        for (int i = 1; i <= n; i++) fac[i] = (fac[i-1] * i) % MOD;
        // inv[n] = (1 * 2 * ... * n) ^ (-1)
        // inv[n-1] = inv[n] * n
        inv[n] = modInverse(fac[n]);
        for (int i = n; i >= 1; i--) inv[i-1] = (inv[i] * i) % MOD;
    }

    ll nCk(int n, int k) {
        if (n < k || n < 0 || k < 0) return 0;
        return fac[n] * inv[k] % MOD * inv[n-k] % MOD;
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
MOD = 10**9 + 7


# pow(a, b, MOD) is binpow; pow(a, -1, MOD) is the inverse (Python 3.8+)
def modInverse(a: int) -> int:
    return pow(a, MOD - 2, MOD) # Fermat: a^(p-2) = a^(-1) mod p


class ModFact:
    def __init__(self, n: int):
        self.n = n
        self.fac = [1] * (n + 1)
        for i in range(1, n + 1): self.fac[i] = self.fac[i - 1] * i % MOD
        # inv[n] = (n!)^(-1), then inv[i-1] = inv[i] * i
        self.inv = [1] * (n + 1)
        self.inv[n] = modInverse(self.fac[n])
        for i in range(n, 0, -1): self.inv[i - 1] = self.inv[i] * i % MOD

    def nCk(self, n: int, k: int) -> int:
        if n < k or n < 0 or k < 0: return 0
        return self.fac[n] * self.inv[k] % MOD * self.inv[n - k] % MOD
```
{% endraw %}

</div>
