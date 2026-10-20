---
layout: template
title: "Modular Inverse"
description: "Modular Inverse in C++ and Python, from my competitive programming notebook."
permalink: /library/modinv/
slug: modinv
---

<div class="tpl-pane" data-lang="C++" markdown="1">

{% raw %}
```cpp
#pragma once
using namespace std;

using ll = long long;
const int MOD = 1e9+7;

struct ModInv {
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
        /*
            Fermat's little theorem: 
                a^(p-1) mod p = 1 if (a, p) = 1
            Multiply LHS and RHS by a^(-1)
                => a^(p-2) mod p = a^(-1)
        */
        return binpow(a, MOD-2);
    }
};
```
{% endraw %}

</div>

<div class="tpl-pane" data-lang="Python" markdown="1">

{% raw %}
```python
MOD = 10**9 + 7


# the loop behind pow(a, b, MOD)
def binpow(a: int, b: int) -> int:
    a %= MOD
    res = 1
    while b:
        if b & 1: res = res * a % MOD
        a = a * a % MOD
        b >>= 1
    return res


# Fermat's little theorem: a^(p-1) = 1 mod p for p prime and gcd(a, p) = 1,
# so a^(p-2) = a^(-1). In one call: pow(a, -1, MOD)
def modInverse(a: int) -> int:
    return binpow(a, MOD - 2)
```
{% endraw %}

</div>
