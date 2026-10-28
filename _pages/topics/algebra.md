---
layout: post
title: "Algebra"
description: "Contest problems where the code is one line and the work is a derivation. Cauchy–Schwarz and AM-GM turn an optimization into a lower bound you can reach, and telescoping turns a sum of powers into a closed form."
permalink: /blog/algebra/
last_updated: 2026-10-27
author: Lam Nguyen
toc:
  sidebar: right
---

Contest problems where the code is one line and the work is a derivation. Cauchy–Schwarz and AM-GM turn an optimization into a lower bound you can reach, and telescoping turns a sum of powers into a closed form.

These are the same tools olympiad students learn for proofs. I practice them on [LeetMath](/leetmath/), and each section below ends with a few LeetMath problems that use the same step.

<details markdown="1">
<summary>C++ template used by every implementation on this page</summary>

Each implementation below starts after this header. A snippet that needs a different modulus defines its own `MOD` in place of this one.

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

## Cauchy–Schwarz and AM-GM {#cauchy-schwarz}

[Kattis — Stardust Curry](https://open.kattis.com/problems/stardustcurry) (2026 ICPC North America Qualifier). There are $$n$$ breaks, and break $$i$$ lasts $$t_i$$ seconds. You must do exactly $$p$$ pushups in total, split across the breaks however you like, fractions allowed. Doing $$x$$ pushups in a break of $$t$$ seconds costs $$x^2 / t$$ stress. Minimize the total stress.

In symbols: choose $$x_1, \dots, x_n \ge 0$$ with

$$
\sum_{i=1}^n x_i = p, \qquad \text{to minimize} \qquad \sum_{i=1}^n \frac{x_i^2}{t_i}.
$$

For $$t = (1, 2, 3, 4)$$ and $$p = 100$$ the answer is $$1000$$.

### First instinct: put it all in the longest break

A long break makes each pushup cheap, so the greedy move is to do all $$p$$ pushups in the longest break, at cost $$p^2 / t_{\max}$$. For the sample that is $$100^2 / 4 = 2500$$, well above $$1000$$.

The square is what breaks it. Moving one pushup out of a busy break saves about $$2x/t$$, its marginal cost there, and adding it to an empty break costs almost nothing. So the optimum spreads the work over every break. The question is how much goes where.

The calculus answer is Lagrange multipliers: at the optimum, every break has the same marginal cost,

$$
\frac{2x_i}{t_i} = \lambda \quad \text{for all } i, \qquad \text{so} \qquad x_i \propto t_i.
$$

That gives the right split, but it takes a theorem about when a critical point is a minimum. A cleaner question avoids that:

> The total $$\sum x_i = p$$ is fixed. Is there a lower bound on $$\sum x_i^2 / t_i$$ that depends only on $$p$$ and the $$t_i$$?

If such a bound exists and some split reaches it, that split is optimal, with no calculus.

### The inequality

Cauchy–Schwarz says that for real $$a_i, b_i$$,

$$
\left( \sum a_i^2 \right) \left( \sum b_i^2 \right) \ge \left( \sum a_i b_i \right)^2,
$$

with equality exactly when the vectors $$a$$ and $$b$$ are parallel. (In Vietnam it is taught as Bunhiacopxki's inequality, after Bunyakovsky, who proved the integral version.)

The proof is one discriminant. For every real $$s$$,

$$
0 \le \sum (a_i s - b_i)^2 = \left(\sum a_i^2\right) s^2 - 2\left(\sum a_i b_i\right) s + \sum b_i^2.
$$

A quadratic in $$s$$ that never goes negative has at most one real root, so its discriminant is $$\le 0$$, and that is the inequality. Equality means a double root $$s$$, where every term $$a_i s - b_i$$ is $$0$$, so $$b = s\,a$$.

### Choosing the vectors

We want $$x_i^2 / t_i$$ on one side and $$\sum x_i$$ on the other. Split each $$x_i$$ as

$$
x_i = \frac{x_i}{\sqrt{t_i}} \cdot \sqrt{t_i},
$$

and take $$a_i = x_i / \sqrt{t_i}$$, $$b_i = \sqrt{t_i}$$. Then $$\sum a_i^2$$ is the stress, $$\sum b_i^2 = \sum t_i$$, and $$\sum a_i b_i = \sum x_i = p$$:

$$
\left( \sum \frac{x_i^2}{t_i} \right) \left( \sum t_i \right) \ge \left( \sum x_i \right)^2 = p^2.
$$

Writing $$T = \sum t_i$$,

$$
\boxed{\;\sum \frac{x_i^2}{t_i} \ge \frac{p^2}{T}.\;}
$$

This form, $$\sum u_i^2 / v_i \ge (\sum u_i)^2 / \sum v_i$$, is common enough to have its own names: Engel form, Titu's lemma, or Sedrakyan's inequality.

### Can the bound be reached?

A lower bound is only the answer if some split meets it. Equality needs $$a \parallel b$$, that is, $$x_i / \sqrt{t_i} = c \sqrt{t_i}$$, or

$$
x_i = c\, t_i.
$$

Summing gives $$c = p / T$$, so $$x_i = p\, t_i / T$$. Every $$x_i$$ is nonnegative, so this split is allowed, and the minimum is exactly $$p^2 / T$$. It is the same split Lagrange gave: each break works at the same pace $$x_i / t_i = p / T$$.

Checking the samples: $$T = 10$$ and $$p = 100$$ give $$10000 / 10 = 1000$$, and $$T = 3$$, $$p = 1$$ give $$1/3$$.

The answer depends on the breaks only through their sum. Ten one-second breaks are as good as one ten-second break.

### The same bound from AM-GM

AM-GM for two nonnegative numbers, $$u + v \ge 2\sqrt{uv}$$, is just $$(\sqrt u - \sqrt v)^2 \ge 0$$. It gives the bound too, with one free parameter $$\lambda > 0$$:

$$
\frac{x_i^2}{t_i} + \lambda^2 t_i \ge 2\sqrt{\frac{x_i^2}{t_i} \cdot \lambda^2 t_i} = 2 \lambda x_i.
$$

Sum over $$i$$:

$$
\sum \frac{x_i^2}{t_i} \ge 2\lambda p - \lambda^2 T.
$$

This holds for every $$\lambda$$, so take the best one. The right side is a downward parabola in $$\lambda$$, largest at $$\lambda = p / T$$, where it equals $$p^2 / T$$. Equality in each AM-GM needs $$x_i^2 / t_i = \lambda^2 t_i$$, that is, $$x_i = \lambda t_i$$, the same split again.

The $$\lambda$$ is the Lagrange multiplier in disguise, up to a factor of 2. Picking it so that every AM-GM is tight at once is the usual trick for olympiad inequalities: guess the equality case first, then choose the weights to match it.

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
/*
    we have: sigma xi = p
    we want to minimize: sigma xi^2/ti
    by cauchy schwarz, we have:
        (sigma xi^2/ti) * (sigma ti) >= (sigma (xi / sqrt(ti) * sqrt(ti)))^2
    <=> (sigma xi^2/ti) * (sigma ti) >= (sigma xi)^2 = p^2
    therefore, sigma xi^2/ti >= p^2 / (sigma ti)
*/
void solve() {
    ll n, p; cin >> n >> p;
    ll sigmat = 0;
    REP(i, n) {
        int t; cin >> t;
        sigmat += t;
    }
    long double ans = (long double)(p * p) / (long double)sigmat;
    cout << fixed << setprecision(10) << ans << '\n';
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

The only care is in the types. $$p \le 10^9$$, so $$p^2 \le 10^{18}$$ fits in `long long` (up to about $$9.2 \cdot 10^{18}$$), and $$T \le 10^5 \cdot 10^9 = 10^{14}$$ fits too. Divide in `long double` at the end.

### On LeetMath

- [An Engel-form minimum](/leetmath/p/vn-in-engel-36): minimize $$\frac1a + \frac4b + \frac9c$$ when $$a + b + c = 1$$. The same inequality with numerators $$1, 2, 3$$.
- [The product (x + y)(1/x + 4/y)](/leetmath/p/vn-in-cs-product): Cauchy–Schwarz with the vectors written out.
- [(a+b)(b+c)(c+a) ≥ 8abc](/leetmath/p/alg-amgm-product): three AM-GMs multiplied together.
- [e^x ≥ 1+x implies AM-GM](/leetmath/p/an-exp-implies-amgm): a proof of AM-GM for $$n$$ numbers from one tangent line.

## Sums of Powers {#sums-of-powers}

[Kattis — The n Days of Christmas](https://open.kattis.com/problems/thendaysofchristmas2). The song's gifts pile up: on day $$d$$ your true love gives $$1 + 2 + \dots + d$$ gifts, one partridge, two doves, and so on up to $$d$$ of the newest gift. How many gifts have you received after $$n$$ days, modulo $$998244353$$? Here $$n$$ goes up to $$10^{18}$$.

For $$n = 1, 2, 3$$ the answers are $$1, 4, 10$$.

### First instinct: add them up

Day $$d$$ brings the triangular number $$T_d = d(d+1)/2$$, so the answer is $$\sum_{d=1}^n T_d$$. A loop is fine for $$n \le 10^7$$, and the subtasks go to $$10^{18}$$. We need a closed form, and since $$T_d$$ is a quadratic in $$d$$, the closed form needs $$\sum d^2$$.

### Counting by gift instead of by day

Before reaching for $$\sum d^2$$, regroup. Write the days as rows:

$$
1 \;+\; (1 + 2) \;+\; (1 + 2 + 3) \;+\; \cdots \;+\; (1 + 2 + \cdots + n).
$$

Read it by column instead. The term $$k$$ shows up on every day from $$k$$ to $$n$$, which is $$n + 1 - k$$ days. So

$$
\text{answer} = \sum_{k=1}^n k\,(n + 1 - k) = (n+1) \sum_{k=1}^n k \;-\; \sum_{k=1}^n k^2.
$$

The first sum is $$n(n+1)/2$$. The second is the one we have to earn.

### Deriving the sum of squares

The question that unblocks it: which expression changes by exactly $$k^2$$ (plus things we already know) from one $$k$$ to the next? A cube does:

$$
(k+1)^3 - k^3 = 3k^2 + 3k + 1.
$$

Sum both sides for $$k = 1, \dots, n$$. The left side telescopes to $$(n+1)^3 - 1$$. Writing $$S = \sum k^2$$,

$$
(n+1)^3 - 1 = 3S + 3 \cdot \frac{n(n+1)}{2} + n.
$$

Solve for $$S$$. The left side is $$n^3 + 3n^2 + 3n$$, so

$$
3S = n^3 + 3n^2 + 3n - \frac{3n^2 + 3n}{2} - n = \frac{2n^3 + 3n^2 + n}{2} = \frac{n(n+1)(2n+1)}{2},
$$

$$
\boxed{\;\sum_{k=1}^n k^2 = \frac{n(n+1)(2n+1)}{6}.\;}
$$

The same move works for every power: $$(k+1)^{m+1} - k^{m+1}$$ starts with $$(m+1)k^m$$, and every lower power is already known. So $$\sum k^m$$ is always a polynomial in $$n$$ of degree $$m + 1$$ (Faulhaber's formula).

### Putting it together

$$
\begin{aligned}
\text{answer} &= \frac{(n+1)^2 n}{2} - \frac{n(n+1)(2n+1)}{6} \\
&= \frac{n(n+1)}{6} \big( 3(n+1) - (2n+1) \big) \\
&= \frac{n(n+1)(n+2)}{6}.
\end{aligned}
$$

Check: $$n = 3$$ gives $$3 \cdot 4 \cdot 5 / 6 = 10$$.

### Why it came out so clean

A product of three consecutive integers over $$3!$$ is a binomial coefficient:

$$
\frac{n(n+1)(n+2)}{6} = \binom{n+2}{3}.
$$

That suggests a counting proof, and there is one. Name each gift by a triple: it arrived on day $$d$$, as part of line $$j$$ of that day's verse (the $$j$$-th kind of gift, which comes $$j$$ at a time), and it is copy $$c$$ of those $$j$$. The triples are exactly

$$
1 \le c \le j \le d \le n.
$$

That chain mixes nothing but $$\le$$, the situation the [shift in Stars and Bars](/blog/combinatorics/#stars-and-bars) was made for. Shift the $$i$$-th term by $$i - 1$$:

$$
1 \le c < j + 1 < d + 2 \le n + 2.
$$

Now it is three distinct numbers from $$\{1, \dots, n+2\}$$, and the shift is invertible, so the gift count is $$\binom{n+2}{3}$$ with no algebra at all. Summing the days one at a time is the hockey-stick identity, $$\sum_{d} \binom{d+1}{2} = \binom{n+2}{3}$$.

### Dividing by 6 mod a prime

With $$n$$ up to $$10^{18}$$, the product $$n(n+1)(n+2)$$ is around $$10^{54}$$, too big even for `__int128`. So reduce first: replace $$n$$ by $$n \bmod p$$, and $$n + 1$$, $$n + 2$$ by their residues. Each is below $$10^9$$, so every product of two fits in `long long` before the next reduction.

Once the factors are reduced, dividing by $$6$$ no longer means integer division. Since $$p = 998244353$$ is prime and does not divide $$6$$, Fermat's little theorem gives the inverse, $$6^{-1} \equiv 6^{p-2} \pmod p$$, and we multiply by it.

(The other route is to divide before reducing: one of the three factors is a multiple of $$3$$ and one is even, so divide those out exactly while the numbers are still at most $$10^{18} + 2$$, then reduce. The inverse is less fiddly.)

### Implementation

<details markdown="1">
<summary>C++ implementation</summary>

```cpp
const int MOD = 998244353;

/*
1 + (1+2) + (1+2+3) + .. + (1+2+..+n)
1 appears n times
2 appear n-1 times
3 appears n-2 times
...
n appears 1 time

x appears n+1-x times
f(x) = x * (n+1-x) = (n+1) * x - x^2
sum f(x) with x = 1..n:
    (n+1) * (n+1) * n / 2 - (1^2 + 2^2 + .. + n^2)
    = (n+1) ^ 2 * n / 2 - n * (n+1) * (2n+1) / 6
    = n * (n+1) * 1/6 * (3n+3 - 2n - 1)
    = n * (n+1) * 1/6 * (n+2)
*/
ll modpow(ll a, ll b) {
    ll r = 1;
    while (b) {
        if (b&1) r = (r * a) % MOD;
        a = (a * a) % MOD;
        b >>= 1;
    }
    return r;
}

ll modinv(ll a) {
    return modpow(a, MOD-2);
}

void solve() {
    ll n; cin >> n;
    n %= MOD;
    ll ans = 1;
    ans = (ans * n) % MOD;
    ans = (ans * ((n+1) % MOD)) % MOD;
    ans = (ans * ((n+2) % MOD)) % MOD;
    ans = (ans * modinv(6)) % MOD;
    cout << ans << '\n';
}

int main() {
    ios::sync_with_stdio(0);
    cin.tie(0);
    solve();
    return 0;
}
```

</details>

### On LeetMath

- [Square triangular numbers](/leetmath/p/nt-square-triangular): when is $$T_n = n(n+1)/2$$ a perfect square?
- [A telescoping sum via partial fractions](/leetmath/p/ib-alg-telescoping): the telescoping step from the derivation above, on fractions instead of cubes.

## Practice {#practice}

**Cauchy–Schwarz and AM-GM**

- [Kattis — Stardust Curry](https://open.kattis.com/problems/stardustcurry)

**Sums of Powers**

- [Kattis — The n Days of Christmas](https://open.kattis.com/problems/thendaysofchristmas2)
- [CSES — Sum of Divisors](https://cses.fi/problemset/task/1082)
