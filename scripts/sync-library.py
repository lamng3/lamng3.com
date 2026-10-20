#!/usr/bin/env python3
"""Build the code library (/library/) from the competitive programming notebook.

Reads ../competitive-programming (github.com/lamng3/competitive-programming-notebook):
C++ snippets in notebook/, Python ones in python/, contest templates in templates/.
A C++ and a Python file with the same name in the same folder become one entry
with two tabs. Writes _data/library.yml (the index) and one page per entry in
_pages/library/. Run from anywhere, then commit the output:

    python3 scripts/sync-library.py
"""
from pathlib import Path
import re
import shutil

SITE = Path(__file__).resolve().parent.parent
SRC = SITE.parent / "competitive-programming"
REPO = "https://github.com/lamng3/competitive-programming-notebook/blob/main"

# Names that title-casing gets wrong.
TITLES = {
    "srd": "Square Root Decomposition",
    "mo": "Mo's Algorithm",
    "csr": "Compressed Sparse Row",
    "dsu": "Disjoint Set Union",
    "dsurollback": "DSU with Rollback",
    "modfact": "Factorials and Binomials mod p",
    "modinv": "Modular Inverse",
    "bfs": "Breadth-First Search",
    "dfs": "Depth-First Search",
    "toposort": "Topological Sort",
    "dijkstra": "Dijkstra's Algorithm",
    "digitdp": "Digit DP",
    "rollinghash": "Rolling Hash",
    "lru": "LRU Cache",
    "lru-2q": "2Q Cache",
    "lfu": "LFU Cache",
    "fifo": "FIFO Cache",
    "eviction_cache": "Eviction Cache Interface",
    "hash": "Hash Function Factory",
    "skiplist": "Skip List",
    "bloomfilter": "Bloom Filter",
    "countminsketch": "Count-Min Sketch",
    "cuckoofilter": "Cuckoo Filter",
    "quadtree": "Quadtree",
    "filesystem": "File System Trie",
    "contest": "Contest Template",
    "minimal": "Minimal Template",
    "oi": "OI Template (file I/O)",
    "leetcode": "LeetCode Template",
    "template": "Python Contest Template",
}

CATEGORIES = {
    "templates": "Templates",
    "arrays": "Arrays",
    "searching": "Searching",
    "data_structures": "Data Structures",
    "dynamic_programming": "Dynamic Programming",
    "graphs": "Graphs",
    "trees": "Trees",
    "strings": "Strings",
    "math": "Math",
    "databases": "Databases",
    "utils": "Utilities",
}

# Folder names shown under the title.
TOPICS = {
    "1d_range_query": "range queries",
    "rurq": "range update, range query",
    "compress": "compression",
    "data_structures": "storage structures",
    "eviction": "cache eviction",
    "modular_arithmetic": "modular arithmetic",
    "shortest_path": "shortest paths",
    "topological_sort": "topological order",
    "rolling_hash": "hashing",
    "euler_tour": "Euler tour",
    "digit_dp": "digit DP",
    "monotonic_stack": "monotonic stack",
    "prefix_sums": "prefix sums",
    "sliding_window": "sliding window",
    "binary_search": "binary search",
    "dsu": "union-find",
}

LANGS = {".h": ("cpp", "C++"), ".cpp": ("cpp", "C++"), ".py": ("python", "Python")}


def title_of(stem: str) -> str:
    key = stem.lower()
    if key in TITLES:
        return TITLES[key]
    return re.sub(r"(?<=[a-z])(?=[A-Z])", " ", stem).replace("_", " ")


def collect():
    entries = {}
    files = [p for p in (SRC / "notebook").rglob("*.h")]
    files += [p for p in (SRC / "python").rglob("*.py") if "tests" not in p.parts and p.name != "__init__.py"]
    files += list((SRC / "templates").glob("*.cpp"))
    for path in sorted(files):
        rel = path.relative_to(SRC)
        root, *dirs = rel.parts[:-1]
        if root == "templates" or not dirs:
            category, folder = "templates", []
        else:
            category, folder = dirs[0], dirs[1:]
        if category == "utils" and path.stem.lower() == "hash":
            continue
        stem = path.stem.lower()
        if folder[-1:] == ["utils"]:
            folder = folder[:-1]
        key = "/".join([category, *folder, stem])
        e = entries.setdefault(
            key,
            {
                "slug": re.sub(r"[^a-z0-9]+", "-", stem.replace("2q", "two-q")).strip("-"),
                "title": title_of(path.stem),
                "category": CATEGORIES.get(category, category.title()),
                "topic": TOPICS.get(folder[-1], folder[-1].replace("_", " ")) if folder else "",
                "files": [],
            },
        )
        lang, label = LANGS[path.suffix]
        e["files"].append({"lang": lang, "label": label, "name": path.name, "path": str(rel), "code": path.read_text()})
    for e in entries.values():
        e["files"].sort(key=lambda f: f["lang"] != "cpp")
    order = list(CATEGORIES.values())
    return sorted(entries.values(), key=lambda e: (order.index(e["category"]) if e["category"] in order else 99, e["title"]))


def yaml_str(s: str) -> str:
    return '"' + s.replace("\\", "\\\\").replace('"', '\\"') + '"'


def main():
    entries = collect()
    slugs = [e["slug"] for e in entries]
    dupes = {s for s in slugs if slugs.count(s) > 1}
    for e in entries:
        if e["slug"] in dupes:
            e["slug"] = f"{re.sub(r'[^a-z0-9]+', '-', e['category'].lower())}-{e['slug']}"

    lines = ["# Generated by scripts/sync-library.py from the competitive-programming notebook. Do not edit."]
    for e in entries:
        lines += [
            f"- slug: {e['slug']}",
            f"  title: {yaml_str(e['title'])}",
            f"  category: {yaml_str(e['category'])}",
            f"  topic: {yaml_str(e['topic'])}",
            "  files:",
        ]
        for f in e["files"]:
            lines.append(f"    - {{ label: {f['label']}, name: {yaml_str(f['name'])}, url: {yaml_str(REPO + '/' + f['path'])} }}")
    (SITE / "_data/library.yml").write_text("\n".join(lines) + "\n")

    out = SITE / "_pages/library"
    shutil.rmtree(out, ignore_errors=True)
    out.mkdir(parents=True)
    for e in entries:
        langs = " and ".join(f["label"] for f in e["files"])
        page = [
            "---",
            "layout: template",
            f"title: {yaml_str(e['title'])}",
            f"description: {yaml_str(e['title'] + ' in ' + langs + ', from my competitive programming notebook.')}",
            f"permalink: /library/{e['slug']}/",
            f"slug: {e['slug']}",
            "---",
            "",
        ]
        for f in e["files"]:
            fence = "~~~~" if "```" in f["code"] else "```"
            page += [
                f'<div class="tpl-pane" data-lang="{f["label"]}" markdown="1">',
                "",
                "{% raw %}",
                f"{fence}{f['lang']}",
                f["code"].rstrip("\n"),
                fence,
                "{% endraw %}",
                "",
                "</div>",
                "",
            ]
        (out / f"{e['slug']}.md").write_text("\n".join(page))
    print(f"{len(entries)} entries, {sum(len(e['files']) for e in entries)} files -> _data/library.yml, _pages/library/")


if __name__ == "__main__":
    main()
