---
layout: post
title: "Stacks"
description: "A stack remembers unfinished work and hands back the most recent piece first. That makes it the natural machine for rewriting a sequence: when deletions always end in the same word, one left-to-right pass finds it."
permalink: /blog/stacks/
last_updated: 2026-11-07
author: Lam Nguyen
toc:
  sidebar: right
---

A stack remembers unfinished work and hands back the most recent piece first. That makes it the natural machine for rewriting a sequence: when deletions always end in the same word, one left-to-right pass finds it.

## Cancellation Stack {#cancellation-stack}

[LeetCode 4103 — Remove Elements by Type and Color](https://leetcode.com/problems/remove-elements-by-type-and-color/). Each element has a type and a color. In one operation, you may remove exactly `groupSize[t]` consecutive elements if they all have type $$t$$ and the same color, and the remaining elements close up. Can you remove everything? Here $$n \le 10^5$$.

I like this problem because one stack does two jobs at once. It counts consecutive items, and it matches brackets. The two jobs look different, but they are one idea, and the reason they work takes a short theorem.

### The first instinct

Simulate it: find a removable group, delete it, and look again. Each deletion can create a new group by bringing two separated pieces together, so the search has to restart, and with up to $$n/2$$ removals that is $$O(n^2)$$.

Speed is the smaller worry. The bigger one is that the simulation keeps making choices. Several groups may be removable at once, and a run longer than the group size can be cut in several places. If a bad choice could strand elements, we would need search or a range DP, and neither fits $$n = 10^5$$.

So the question that unblocks the problem is: **does the order of removals matter at all?**

### The order does not matter

Only the pair (type, color) affects the rules, so call each pair a letter. A letter $$x$$ has a group size $$g_x$$, and the array is a word with one kind of rewrite:

$$
x^{g_x} \to \varepsilon.
$$

Call a word **irreducible** if no rule applies to it, which means it has no run of $$g_x$$ or more copies of any letter $$x$$.

**Claim.** Every word reaches exactly one irreducible word, whatever order the removals take.

First look at a single step. Suppose two different removals are possible in a word $$w$$, giving $$u$$ and $$v$$.

- **They don't overlap.** Each is still possible after the other, and doing both in either order gives the same word. So $$u$$ and $$v$$ have a common descendant.
- **They overlap.** Every position in a group holds the same letter, so a shared position means both groups use the same letter $$x$$ and lie in the same maximal run $$x^r$$. Either one turns that run into $$x^{r - g_x}$$, so $$u = v$$.

Now induct on the length of $$w$$. Take any two first moves, giving $$u$$ and $$v$$. If $$u = v$$, the rest of the argument applies to one word. Otherwise they share a descendant $$z$$. Both are shorter than $$w$$, so each has a unique irreducible result, and both results must equal the one reached through $$z$$. Whichever first move we take, we end at the same word. $$\blacksquare$$

This is Newman's lemma, specialized to our rules: a rewriting system that terminates and is locally confluent has unique normal forms. Write $$\mathrm{nf}(w)$$ for the irreducible word that $$w$$ reaches.

The claim settles the worry about choices. The answer is true exactly when $$\mathrm{nf}(w) = \varepsilon$$, and since every order gives the same result, we may use whichever order is cheapest to run. The cheapest is left to right, deleting a group as soon as it is complete.

### The stack is the normal form of the prefix

Uniqueness also gives $$\mathrm{nf}(wx) = \mathrm{nf}(\mathrm{nf}(w)\,x)$$, since reducing $$w$$ first is just one possible order. So we only need to keep $$\mathrm{nf}$$ of the prefix and update it with one letter at a time.

Store that word run-length encoded, as (letter, count) entries. The invariant is:

- neighboring entries have different letters, and
- each count $$c$$ satisfies $$1 \le c < g_x$$.

That is precisely the statement that the word is irreducible. Appending a letter can only affect the last run, which gives three cases:

1. The top entry has a different letter, or the stack is empty. Push $$(x, 1)$$.
2. The top entry has the same letter and its count stays below $$g_x$$. Increment it.
3. The count reaches $$g_x$$. Pop the entry.

After a pop, the invariant still holds, because the entries below were untouched. Nothing merges at that moment. If the next letter matches the new top, case 2 picks it up.

```cpp
bool canRemoveAll(vector<int>& types, vector<int>& colors, vector<int>& groupSize) {
    vector<array<int, 3>> st;  // (type, color, count of the run)
    for (int i = 0; i < (int)types.size(); i++) {
        int t = types[i], c = colors[i], g = groupSize[t];
        if (g == 1) continue;  // x -> empty: x is the identity
        if (!st.empty() && st.back()[0] == t && st.back()[1] == c) {
            if (++st.back()[2] == g) st.pop_back();  // the run closes
        } else {
            st.push_back({t, c, 1});  // a new run opens, burying the old one
        }
    }
    return st.empty();
}
```

Each element does $$O(1)$$ work, so this takes $$O(n)$$ time and $$O(n)$$ space. The `g == 1` line is required by this code, not just a shortcut: the pop check only runs on an increment, so a pushed $$(x, 1)$$ with $$g_x = 1$$ would never leave the stack.

### One stack, two jobs

Take $$g_A = 3$$, $$g_B = 2$$, and the word `A A B B A`:

| Read  | Stack         | What happens                     |
| ----- | ------------- | -------------------------------- |
| `A A` | `(A,2)`       | The `A` run is open              |
| `B`   | `(A,2) (B,1)` | The `A` run is suspended         |
| `B`   | `(A,2)`       | `B` completes and pops           |
| `A`   | empty         | The `A` count resumes, reaches 3 |

The third `A` is not next to the first two in the input. It still continues their count, because everything between them has vanished.

This is the idea I want to remember. **A buried entry is not finished, only suspended.** The count on the top entry is the counting job. The entries underneath, waiting to resume, are the bracket job. A run is a bracket with $$g_x$$ parts, and whatever sits between the parts must vanish by itself. As a grammar, the words that vanish are

$$
S \to \varepsilon \ \mid\ x\, S\, x\, S \cdots x\, S \quad (g_x \text{ copies of } x).
$$

The stack is the parser for this grammar, and the count says how far through the production each open entry has gotten. Ordinary brackets are the case with two parts, an opener and a closer that happen to be spelled differently. Storing the count is what keeps this fast: with one entry per copy, checking for a complete group would look at $$g_x$$ entries each time.

### The stack is a prefix sum

There is a cleaner way to see what the stack holds. The rules say $$x^{g_x} = e$$, which is the relation of a cyclic group, so read the word as a product in the free product

$$
G = \mathbb{Z}_{g_1} * \mathbb{Z}_{g_2} * \cdots
$$

with one factor per letter. Letters with $$g_x = 1$$ generate the trivial group, which explains the `continue` above. Our irreducible words are the reduced words of $$G$$, so two words are equal in $$G$$ exactly when they have the same normal form. The question "can everything be removed?" becomes the word problem: is this product the identity?

Let $$P_i$$ be the product of the first $$i$$ letters, which is the stack after $$i$$ steps. Every letter has an inverse $$x^{g_x - 1}$$, so the subarray from $$l$$ to $$r$$ equals $$P_{l-1}^{-1} P_r$$, and therefore

$$
a[l..r] \text{ vanishes} \iff P_{l-1} = P_r.
$$

This is the same identity that finds zero-sum subarrays with prefix sums. **The stack is a prefix sum for a non-commutative group**, and comparing stack states plays the role of comparing prefix sums.

[Codeforces 1223F — Stack Exterminable Arrays](https://codeforces.com/problemset/problem/1223/F) asks for exactly this count, with $$g = 2$$ for every value. Stacks are too big to compare directly, so give each state an id: a node in a trie, where a push moves to a child and a pop moves to the parent. The answer counts pairs of prefixes on the same node.

```cpp
long long countVanishing(const vector<int>& a) {
    vector<int> parent = {0}, letter = {-1}, freq = {1};
    vector<map<int, int>> child(1);
    long long ans = 0;
    int cur = 0;
    for (int x : a) {
        if (letter[cur] == x) {
            cur = parent[cur];  // pop
        } else {
            if (!child[cur].count(x)) {  // push
                int id = parent.size();
                child[cur][x] = id;
                parent.push_back(cur), letter.push_back(x), freq.push_back(0);
                child.emplace_back();
            }
            cur = child[cur][x];
        }
        ans += freq[cur]++;
    }
    return ans;
}
```

### Follow-up: counting valid intervals

[LeetCode 4104 — Count Valid Substrings II](https://leetcode.com/problems/count-valid-substrings-ii/). Given a string of `a`, `b`, and `c`, count the substrings that do **not** contain `abc` as a subsequence. Again $$n \le 10^5$$.

There are no removals here and no stack, but the move is the same. Keep a small summary of the prefix, update it one letter at a time, and count intervals by their right end, as the vanishing-subarray count above does.

**Fix the right end.** There are $$O(n^2)$$ substrings, too many to check one by one. What unblocks it is monotonicity: if $$s[j..i]$$ contains `abc`, so does every longer substring $$s[j'..i]$$ with $$j' < j$$. So for a fixed end $$i$$, the invalid starts are exactly $$0, \dots, L_i$$, where $$L_i$$ is the latest start whose substring contains `abc` ($$-1$$ if there is none), and

$$
\text{answer} = \sum_{i} (i - L_i).
$$

**How far has each start gotten?** $$L_i$$ cannot be updated by itself, because whether a new `c` completes `abc` depends on where the latest `ab` starts. So track one latest start per stage of the pattern. Let $$p = $$ `abc`, and let $$L_k(i)$$ be the largest $$j$$ such that the first $$k$$ letters of $$p$$ are a subsequence of $$s[j..i]$$. The empty pattern fits in the empty substring, so $$L_0(i - 1) = i$$.

A best match for the first $$k$$ letters either uses $$s[i]$$ as its last letter or doesn't:

- If it doesn't, the best start is $$L_k(i - 1)$$.
- If it does, then $$s[i] = p_k$$ and the first $$k - 1$$ letters fit in $$s[j..i-1]$$, so the best start is $$L_{k-1}(i - 1)$$.

A shorter pattern needs less room, so $$L_{k-1} \ge L_k$$ always, and when $$s[i]$$ matches, the second option wins:

$$
L_k(i) =
\begin{cases}
L_{k-1}(i - 1) & \text{if } s[i] = p_k, \\
L_k(i - 1) & \text{otherwise.}
\end{cases}
$$

The letters of `abc` are distinct, so each step changes exactly one stage:

```cpp
long long countValidSubstrings(string s) {
    // latest start j such that s[j..i] contains "a", "ab", "abc" as a subsequence
    int last_a = -1, last_ab = -1, last_abc = -1;
    long long ans = 0;
    for (int i = 0; i < (int)s.size(); i++) {
        if (s[i] == 'a') last_a = i;
        else if (s[i] == 'b') last_ab = last_a;   // b extends the latest a
        else last_abc = last_ab;                  // c extends the latest ab
        ans += i - last_abc;                      // starts last_abc+1 .. i are valid
    }
    return ans;
}
```

The chain $$L_1 \ge L_2 \ge L_3$$ plays the role the stack played before. Each stage records how far a partial match has gotten, just as each count recorded how far a run had gotten through its production. When a `c` arrives, the `ab` stage hands its start to the `abc` stage, much as a closing letter ends a run.

For a pattern with repeated letters, one letter can advance several stages at once. Update $$k$$ from $$m$$ down to $$1$$, so that each stage reads the previous step's value, the same order as a 0/1 knapsack. That costs $$O(nm)$$ for a pattern of length $$m$$.

### Where the stack stops working

The whole argument rested on one fact: overlapping removals give the same word. That is the first thing to check on a new problem. Write down the rules and look for two matches that can overlap.

- **No overlaps, so the stack works.** In [LeetCode 2696](https://leetcode.com/problems/minimum-string-length-after-removing-substrings/), the patterns `AB` and `CD` cannot overlap. In [LeetCode 3703](https://leetcode.com/problems/remove-k-balanced-substrings/), a pattern of $$k$$ opening brackets and then $$k$$ closing ones has no proper prefix equal to a suffix, so it cannot overlap itself.
- **Overlaps that disagree.** In [LeetCode 1910](https://leetcode.com/problems/remove-all-occurrences-of-a-substring/), removing `aba` from `ababa` leaves `ba` or `ab`, depending on which match goes first. The result depends on the order, so the statement has to fix one, and it does: leftmost first.
- **The order changes the objective.** [Codeforces 1312E](https://codeforces.com/problemset/problem/1312/E) merges `a a` into `a+1`, so `a a a` can become `(a+1) a` or `a (a+1)`, and these are different words. [Codeforces 607B](https://codeforces.com/problemset/problem/607/B) removes any palindrome, and [LeetCode 546](https://leetcode.com/problems/remove-boxes/) scores each removal by its size. There we want the best order, which calls for a [range DP](/blog/dynamic-programming/#range-dp).
- **The question counts the orders.** [CSES Empty String](https://cses.fi/problemset/task/1080) uses our rule with $$g = 2$$, so the final word is always the same. But it asks how many removal sequences reach it, and uniqueness of the result says nothing about that count. That one is a range DP too.

### The takeaway

1. **Before searching over orders, ask whether order matters.** If terminating rules agree on every overlap, every order ends at the same word, and the choices were never real.
2. **Keep the normal form of the prefix.** Run-length encoding gives $$O(1)$$ updates, and a buried entry resumes when what sits above it vanishes.
3. **Equal stack states mean a vanishing subarray.** Anything prefix sums do for zero-sum subarrays, stack states can do for cancellation.
4. **To count intervals, fix the right end.** When validity is monotone in the start, the valid starts for each end form a suffix. Track where it begins with one value per stage of partial progress.

## Practice {#practice}

**Cancellation Stack**

- [LeetCode 20 — Valid Parentheses](https://leetcode.com/problems/valid-parentheses/)
- [LeetCode 1047 — Remove All Adjacent Duplicates In String](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/)
- [Codeforces 81A — Plug-in](https://codeforces.com/problemset/problem/81/A)
- [LeetCode 1209 — Remove All Adjacent Duplicates in String II](https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string-ii/) (the closest match, with one fixed $$k$$)
- [LeetCode 2696 — Minimum String Length After Removing Substrings](https://leetcode.com/problems/minimum-string-length-after-removing-substrings/)
- [LeetCode 1003 — Check If Word Is Valid After Substitutions](https://leetcode.com/problems/check-if-word-is-valid-after-substitutions/)
- [LeetCode 3703 — Remove K-Balanced Substrings](https://leetcode.com/problems/remove-k-balanced-substrings/) (counting and brackets together)
- [LeetCode 2197 — Replace Non-Coprime Numbers in Array](https://leetcode.com/problems/replace-non-coprime-numbers-in-array/) (merges instead of deleting)
- [Codeforces 1092D1 — Great Vova Wall (Version 1)](https://codeforces.com/problemset/problem/1092/D1) and [D2](https://codeforces.com/problemset/problem/1092/D2)
- [Codeforces 878B — Teams Formation](https://codeforces.com/problemset/problem/878/B) (reduce once, then reason about repeated copies)
- [Codeforces 1223F — Stack Exterminable Arrays](https://codeforces.com/problemset/problem/1223/F) (equal stack states)

**Counting Intervals**

- [LeetCode 4104 — Count Valid Substrings II](https://leetcode.com/problems/count-valid-substrings-ii/)
- [LeetCode 1358 — Number of Substrings Containing All Three Characters](https://leetcode.com/problems/number-of-substrings-containing-all-three-characters/)
- [LeetCode 115 — Distinct Subsequences](https://leetcode.com/problems/distinct-subsequences/) (a DP over the stages of the pattern)

**Brackets**

- [Codeforces 5C — Longest Regular Bracket Sequence](https://codeforces.com/problemset/problem/5/C)
- [Codeforces 223A — Bracket Sequence](https://codeforces.com/problemset/problem/223/A)
- [CSES — Bracket Sequences I](https://cses.fi/problemset/task/2064)
- [CSES — Bracket Sequences II](https://cses.fi/problemset/task/2187)

**Where the Stack Stops Working**

- [LeetCode 1910 — Remove All Occurrences of a Substring](https://leetcode.com/problems/remove-all-occurrences-of-a-substring/)
- [CSES — Empty String](https://cses.fi/problemset/task/1080)
- [Codeforces 607B — Zuma](https://codeforces.com/problemset/problem/607/B)
- [Codeforces 1312E — Array Shrinking](https://codeforces.com/problemset/problem/1312/E)
- [LeetCode 546 — Remove Boxes](https://leetcode.com/problems/remove-boxes/)
- [LeetCode 488 — Zuma Game](https://leetcode.com/problems/zuma-game/)
