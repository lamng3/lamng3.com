CXXFLAGS = -O3 -std=c++17 -pthread -Wall -Iparlaylib/include
LG ?= 26
THREADS ?= 1 2 4 8 12

scan: scan.cpp harness.cpp harness.h | parlaylib
	$(CXX) $(CXXFLAGS) -o $@ scan.cpp harness.cpp

# ParlayLib is header-only. It is cloned here the first time and not committed.
parlaylib:
	git clone --depth 1 https://github.com/cmuparlay/parlaylib.git

test: scan
	@./scan test

bench: scan
	@echo method,threads,n,ms,Gelem/s,speedup
	@for p in $(THREADS); do PARLAY_NUM_THREADS=$$p ./scan bench $(LG); done

clean:
	rm -f scan

.PHONY: test bench clean
