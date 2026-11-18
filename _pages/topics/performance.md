---
layout: post
title: "Performance Optimization"
description: "Making correct code faster: measure where the time goes, change one thing at a time, and credit each speedup to the change that caused it."
permalink: /blog/performance/
last_updated: 2026-11-18
author: Lam Nguyen
toc:
  sidebar: right
---

Making correct code faster. The rule on this page: measure where the time goes, change one thing at a time, and credit each speedup to the change that actually caused it. A faster submission after two changes says nothing about which one helped.

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

## Lambdas as Callbacks {#lambda-callbacks}

In his CppCon 2017 talk [When a Microsecond Is an Eternity: High Performance Trading Systems in C++](https://www.youtube.com/watch?v=NH1Tta7purM), Carl Cook has a slide called "Lambda functions are fast and convenient" with one rule on it: _if you know at compile time which function is to be executed, then prefer lambdas._

```cpp
template <typename T>
void SendMessage(T&& lambda) {
    Msg msg = PrepareMessage();
    lambda(msg);
    send(msg);
}

SendMessage([&](auto& msg) {
    msg.instrument = x;
    msg.price = z;
});
```

`SendMessage` owns the fixed steps, preparing and sending. The caller fills in the step in the middle. The question is what that flexibility costs.

### Why a lambda is free

Every lambda expression has its own unnamed type. Passed as `T&&`, it makes the compiler build a separate copy of `SendMessage` for that one type, and inside that copy `lambda(msg)` can only mean one function. So the compiler can inline it, and the result is the same code as writing the body there by hand.

The other two ways to pass behavior give every callable of a signature the _same_ type:

- A **function pointer** `void (*f)(Msg&)` is an address. `f(msg)` jumps to wherever it points, which may only be known at runtime.
- A **`std::function<void(Msg&)>`** hides the callable behind type erasure. The call goes through an indirection, and a large capture may live on the heap.

When the target is a constant in the same file, the compiler can sometimes see through both. The template with a lambda guarantees it.

Inlining saves more than the call. Once the body is inline, the compiler optimizes it together with the loop around it. Summing $$f(x) = 3x + 1$$ over $$2^{20}$$ ints, with the pointer and the `std::function` chosen at runtime so the compiler can't see their target:

| Callback          | ns per element |
| ----------------- | -------------- |
| template + lambda | 0.074          |
| `std::function`   | 0.890          |
| function pointer  | 0.866          |

That is a factor of about $$12$$, and most of it is not the call. The lambda loop is vectorized: it uses SIMD instructions (`movi.4s`), four ints per register. The other two loops make an indirect call (`blr`) for every element, and a loop with an opaque call in it cannot be vectorized.

### A smaller version: LeetCode 359

[LeetCode 359 — Logger Rate Limiter](https://leetcode.com/problems/logger-rate-limiter/) streams messages with non-decreasing timestamps, at most $$10^4$$ calls. A message is printed only if the same message was not printed in the last $$10$$ seconds. The same shape fits: a generic `processEvent` decides whether an event goes through, and the caller says what happens when it does.

```cpp
// if you know at compile time which function is to be executed, then prefer lambdas
template <typename Callback>
bool processEvent(int ts, int next_ts, Callback&& onAccept) {
    if (ts < next_ts) return false;
    onAccept(ts);
    return true;
}

class Logger {
private:
    unordered_map<string, int> ntime;

public:
    Logger() {}

    bool shouldPrintMessage(int ts, string msg) {
        int& next_ts = ntime[msg];
        return processEvent(ts, next_ts, [&](int ts) {
            next_ts = ts + 10;
        });
    }
};
```

`ntime[msg]` returns a reference to the message's slot and inserts $$0$$ if the message is new. Timestamps are at least $$0$$, so $$0$$ already means "never printed", with no special case. The lambda captures that reference and writes the next allowed time through it, so the map is searched once per call.

### Where the time goes

Changing `map` to `unordered_map` took this from 17 ms to 15 ms on LeetCode. Two things are in play, the lambda and the map, so measure each. Below: $$10^4$$ calls over $$1000$$ distinct messages of length $$1$$ to $$30$$, median of $$15$$ runs, Apple clang 15 at `-O2` on an M2 Pro.

| Version                                        | ns per call |
| ---------------------------------------------- | ----------- |
| `map`, lambda                                  | 105         |
| `unordered_map`, lambda                        | 45          |
| `unordered_map`, body written inline           | 43          |
| `unordered_map`, `std::function` or fn pointer | 44–49       |
| `unordered_map`, `find` then `[]`              | 52          |
| `unordered_map`, `const string&`               | 33          |

- **The map is the speedup.** `map` is a red-black tree. A lookup walks about $$\log_2 1000 \approx 10$$ nodes, and each step is a string comparison and a jump to another node in memory. `unordered_map` hashes the string once and looks in one bucket. That is $$2.3\times$$ per call, and with $$10^6$$ calls over $$10^4$$ messages it grows to $$159$$ against $$50$$ ns, as the tree gets deeper and stops fitting in cache.
- **The lambda is free, and that's all.** Lambda, inline body, `std::function` and function pointer all cost the same, within noise. The lookup costs about $$45$$ ns and the call about $$1$$, so how the call is made doesn't show. Here the lambda buys structure at no cost, not speed.
- **The next cost is the copy.** `string msg` copies the message on every call, and `const string&` saves about $$12$$ ns. LeetCode's signature takes the string by value. Changing it is worth trying, as long as the judge's code still compiles against it.
- **One lookup, not two.** `find` and then `ntime[msg] = ...` hashes the string twice. The reference from `ntime[msg]` hashes it once.

The whole run of $$10^4$$ calls takes about $$1$$ ms with `map` and $$0.45$$ ms with `unordered_map` here. Most of LeetCode's 15 ms is the judge, not the logger, and the same code can come back a few ms apart on two submissions. So the 2 ms points the right way, and the measurement says which change earned it.

### The takeaway

- When the function is known at compile time, pass it as a template parameter and hand it a lambda. It costs nothing, and inlining lets the compiler optimize the body together with its loop.
- Before tuning how a function is called, find what dominates the call. In this logger the hash lookup does, so the data structure decides the speed.
- An order to check things in: the data structure (`map` to `unordered_map`), then copies (by value to `const&`), then repeated work (two lookups to one), and only then call overhead.

## Practice {#practice}

**Lambdas as Callbacks**

- [LeetCode 359 — Logger Rate Limiter](https://leetcode.com/problems/logger-rate-limiter/)

## Further reading {#further-reading}

**Lambdas as Callbacks**

- Carl Cook, [When a Microsecond Is an Eternity: High Performance Trading Systems in C++](https://www.youtube.com/watch?v=NH1Tta7purM), CppCon 2017. The slide this section starts from.
