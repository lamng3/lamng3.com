// Shared by scan.cpp (yours) and harness.cpp (the tests and the timer).
#pragma once

#include <parlay/parallel.h>
#include <parlay/primitives.h>
#include <parlay/sequence.h>

#include <cstddef>

using T = long long;

// Leave TODO() in a function you haven't written yet; the harness reports it
// as not written instead of failing.
struct NotWritten {};
#define TODO() throw NotWritten()

// Inclusive prefix sums: out[i] = in[0] + in[1] + ... + in[i].
// Each must work for every n, including 0 and sizes that are not powers of 2.
void scan_hillis_steele(const T* in, T* out, T* tmp, size_t n);
void scan_blelloch(const T* in, T* out, size_t n);
void scan_blocked(const T* in, T* out, size_t n);
