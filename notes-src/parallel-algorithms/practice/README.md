# Practice: parallel scans

Write the parallel algorithms yourself, check them, and time them on your own machine. The code you write goes in `scan.cpp`. `harness.cpp` checks every answer against a plain sequential loop and times your code against that loop and against ParlayLib's own scan.

## Setup

You need a C++17 compiler and `make`. On a Mac, the Xcode command line tools have both (`xcode-select --install`). ParlayLib, the library the course uses, is cloned into this folder the first time you build, and git ignores it.

```sh
cd notes-src/parallel-algorithms/practice
make test    # build, then check every scan on sizes from 0 to 2^20
make bench   # time every scan that passes, at n = 2^26, on 1, 2, 4, 8, and 12 threads
```

`make bench LG=22 THREADS="1 8"` changes the size and the thread counts, and `PARLAY_NUM_THREADS=8 ./scan bench 26` runs once on 8 threads. The benchmark prints CSV: method, threads, n, median milliseconds, billions of elements per second, and speedup over the sequential loop.

## Exercises

Each function in `scan.cpp` starts as `TODO()`, which the harness reports as not written yet. Each one has to match the sequential loop for every n, including 0 and sizes that are not powers of 2.

1. **Hillis and Steele.** Before timing it, count its additions and compare with the loop's.
2. **Blelloch.** Is it faster than the loop? If not, count how many times it reads and writes the whole array.
3. **Blocked.** Try block sizes from 2^8 to 2^20, and explain what goes wrong at each end.
4. **The limit.** Turn your best time into bytes moved per second and compare it with the machine's memory bandwidth. What limits a scan, and how many cores does it take to reach that limit?
5. **Smaller elements.** Change `T` to `int` in `harness.h`. Which versions speed up, and why by that much?
6. **Filter.** Use your blocked scan to keep the multiples of 3, packed in order, and compare it with `parlay::filter`.

## Benchmarking well

- Check the answer on every run. The harness does.
- Warm up, then take the median of several runs. The harness runs each method 9 times and reports the median of the last 7.
- Compare against the best sequential code, not against your parallel code on one thread. A version that is 3× faster than itself on one thread can be barely faster than the plain loop.
- Vary the thread count and the size, and write down the machine, compiler, and flags with the numbers.
- Turn times into bandwidth, bytes read and written per second, and compare with the machine's peak. Near the peak, more cores can't help, and only fewer passes over memory can.
- On a laptop, plug it in and close other programs. macOS doesn't let a program choose the core a thread runs on, so expect noise, especially once the performance cores are all busy.

## Numbers to beat

On an Apple M2 Pro (8 performance and 4 efficiency cores, 16 GB, Apple clang 15, `-O3`), at n = 2^26, which is 512 MiB per array:

- the sequential loop takes about 25 ms;
- ParlayLib's scan takes about 38 ms on 1 thread and 11 to 13 ms on 4 to 12 threads.

## Going further

- [ParlayLib's examples](https://github.com/cmuparlay/parlaylib/tree/master/examples): dozens of parallel algorithms written with ParlayLib. Read one after writing your own version.
- [PBBS](https://cmuparlay.github.io/pbbsbench/), the Problem Based Benchmark Suite: problems with inputs and checkers, from sorting to graph algorithms.
- [Stanford CS149, Assignment 1](https://github.com/stanford-cs149/asst1): threads and SIMD on a CPU. Check its README for what it needs.
- MIT 6.172, _Performance Engineering of Software Systems_, on MIT OpenCourseWare: lectures and assignments on making code fast, parallel code included.
- [Compiler Explorer](https://godbolt.org): the assembly a loop compiles to, for example whether it was vectorized.
- A Linux machine with many cores, such as a cloud instance rented by the hour: there `taskset` or `numactl` can pin threads to cores, and `perf stat` counts cache misses.

Results, and what they show, go into the notes in `../main.tex`.
