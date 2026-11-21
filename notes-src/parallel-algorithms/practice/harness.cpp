// Tests and times the scans in scan.cpp. Nothing here needs changing.
//
//   ./scan test           check every scan on sizes from 0 to 2^20
//   ./scan bench 26       time every scan that passes, at n = 2^26
//
// Benchmark output is CSV: method, threads, n, median ms, billions of
// elements per second, and speedup over the sequential loop.

#include "harness.h"

#include <algorithm>
#include <chrono>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <functional>
#include <string>
#include <vector>

#ifdef __APPLE__
#include <pthread/qos.h>
#endif

namespace {

// The baseline every parallel version is measured against.
void scan_sequential(const T* in, T* out, size_t n) {
  T s = 0;
  for (size_t i = 0; i < n; i++) out[i] = s += in[i];
}

// ParlayLib's scan, the library baseline. Scans in place, so the benchmark
// copies the input first, outside the timer.
void scan_parlay(parlay::sequence<T>& a) { parlay::scan_inclusive_inplace(a); }

struct Method {
  const char* name;
  std::function<void(const T*, T*, T*, size_t)> run;  // in, out, tmp, n
};

std::vector<Method> methods() {
  return {
      {"hillis-steele", [](const T* in, T* out, T* tmp, size_t n) { scan_hillis_steele(in, out, tmp, n); }},
      {"blelloch", [](const T* in, T* out, T*, size_t n) { scan_blelloch(in, out, n); }},
      {"blocked", [](const T* in, T* out, T*, size_t n) { scan_blocked(in, out, n); }},
  };
}

parlay::sequence<T> random_input(size_t n, size_t seed) {
  return parlay::tabulate(n, [&](size_t i) { return T(parlay::hash64(i + seed * n) % 101) - 50; });
}

// Runs one method on one input. Returns "" on success, or what went wrong.
std::string check(const Method& m, size_t n, size_t seed) {
  auto in = random_input(n, seed);
  parlay::sequence<T> expect(n), out(n, T(-7)), tmp(n, T(-7));
  scan_sequential(in.data(), expect.data(), n);
  m.run(in.data(), out.data(), tmp.data(), n);
  for (size_t i = 0; i < n; i++)
    if (out[i] != expect[i])
      return "n = " + std::to_string(n) + ": out[" + std::to_string(i) + "] is " + std::to_string(out[i]) +
             ", expected " + std::to_string(expect[i]);
  return "";
}

const std::vector<size_t> test_sizes = {0, 1, 2, 3, 4, 5, 7, 8, 9, 16, 17, 100, 1000, 1023, 1024, 4097, 65536, 100003, 1 << 20};

int test() {
  int failed = 0;
  for (auto& m : methods()) {
    std::string problem;
    try {
      for (size_t n : test_sizes) {
        for (size_t seed = 0; seed < 3 && problem.empty(); seed++) problem = check(m, n, seed);
        if (!problem.empty()) break;
      }
    } catch (NotWritten&) {
      std::printf("%-14s not written yet\n", m.name);
      continue;
    }
    if (problem.empty()) {
      std::printf("%-14s pass\n", m.name);
    } else {
      std::printf("%-14s FAIL  %s\n", m.name, problem.c_str());
      failed++;
    }
  }
  return failed ? 1 : 0;
}

// Median of 7 timed runs, after 2 untimed warm-up runs that fault in the
// memory and let the clock speed settle. setup runs before each run, untimed.
double median_ms(const std::function<void()>& run, const std::function<void()>& setup) {
  std::vector<double> t;
  for (int r = 0; r < 9; r++) {
    setup();
    auto start = std::chrono::steady_clock::now();
    run();
    auto stop = std::chrono::steady_clock::now();
    if (r >= 2) t.push_back(std::chrono::duration<double, std::milli>(stop - start).count());
  }
  std::sort(t.begin(), t.end());
  return t[t.size() / 2];
}

int bench(int lg) {
  size_t n = size_t(1) << lg;
  size_t p = parlay::num_workers();
  auto in = random_input(n, 1);
  parlay::sequence<T> expect(n), out(n), tmp(n);
  scan_sequential(in.data(), expect.data(), n);

  auto nothing = [] {};
  double base = median_ms([&] { scan_sequential(in.data(), out.data(), n); }, nothing);
  auto line = [&](const char* name, double ms) {
    std::printf("%s,%zu,%zu,%.2f,%.3f,%.2f\n", name, p, n, ms, n / ms / 1e6, base / ms);
    std::fflush(stdout);
  };
  line("sequential", base);
  line("parlay", median_ms([&] { scan_parlay(out); }, [&] { parlay::copy(in, out); }));

  for (auto& m : methods()) {
    try {
      m.run(in.data(), out.data(), tmp.data(), n);
    } catch (NotWritten&) {
      continue;
    }
    if (out != expect) {
      std::printf("%s,%zu,%zu,wrong answer\n", m.name, p, n);
      continue;
    }
    line(m.name, median_ms([&] { m.run(in.data(), out.data(), tmp.data(), n); }, nothing));
  }
  return 0;
}

}  // namespace

int main(int argc, char** argv) {
#ifdef __APPLE__
  // macOS can't pin threads to cores. This asks it to prefer the performance
  // cores over the efficiency cores, before ParlayLib starts its workers.
  pthread_set_qos_class_self_np(QOS_CLASS_USER_INTERACTIVE, 0);
#endif
  if (argc > 1 && std::strcmp(argv[1], "test") == 0) return test();
  if (argc > 1 && std::strcmp(argv[1], "bench") == 0) return bench(argc > 2 ? std::atoi(argv[2]) : 26);
  std::printf("usage: %s test | bench [lg n]\n", argv[0]);
  return 2;
}
