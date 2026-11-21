// Practice: inclusive prefix sums, three ways. Replace each TODO() with your
// own code, then run `make test` and `make bench`.
//
// Tools from ParlayLib (https://github.com/cmuparlay/parlaylib):
//   parlay::parallel_for(lo, hi, [&](size_t i) { ... });       a parallel loop
//   parlay::parallel_for(lo, hi, f, 1);                          one task per iteration
//   parlay::par_do([&] { ... }, [&] { ... });                    run two things in parallel
// Every function below has to give the same answer as the sequential loop
// in harness.cpp, for every n.

#include "harness.h"

// 1. Hillis and Steele. Rounds d = 1, 2, 4, ...: in each round, every element
//    adds the element d places to its left. A round must read only the values
//    from the round before; that is what tmp is for.
//    Aim: O(n log n) work, O(log n) rounds.
void scan_hillis_steele(const T* in, T* out, T* tmp, size_t n) {
  TODO();
}

// 2. Blelloch. An up-sweep and a down-sweep over a balanced binary tree whose
//    leaves are the elements: up, each node learns the sum of its leaves;
//    down, each node learns the sum of everything to the left of its leaves.
//    Either recursion with par_do or loops over the levels of a tree laid out
//    in the array works.
//    Aim: O(n) work, O(log n) depth.
void scan_blelloch(const T* in, T* out, size_t n) {
  TODO();
}

// 3. Blocked. Split the array into blocks of a few thousand elements and let
//    each block run a plain sequential loop. Two passes over the blocks, with
//    a small step in between.
//    Aim: O(n) work, and as few passes over memory as you can manage.
void scan_blocked(const T* in, T* out, size_t n) {
  TODO();
}
