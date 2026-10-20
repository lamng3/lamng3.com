---
layout: default
title: Library
permalink: /library/
description: C++ and Python implementations of algorithms and data structures from my competitive programming notebook, with contest templates.
---

<section class="library-intro">
  <h2>Welcome!</h2>
  <p>Here you will find the C++ and Python implementations of algorithms and data structures I use for competitive programming and interviews, plus my contest templates. They come from my <a href="https://github.com/lamng3/competitive-programming-notebook">notebook</a>, where each one has unit tests, and the <a href="{{ '/blog/' | relative_url }}">blog</a> explains many of the ideas behind them.</p>
</section>

<div class="library-tools">
  <input type="search" id="library-filter" placeholder="Filter: segment tree, dsu, hash…" aria-label="Filter the library" autocomplete="off" />
  <div class="library-cats" role="group" aria-label="Category">
    <button type="button" data-cat="" aria-pressed="true">All</button>
    {% assign cats = site.data.library | map: 'category' | uniq %}
    {% for c in cats %}<button type="button" data-cat="{{ c }}" aria-pressed="false">{{ c }}</button>{% endfor %}
  </div>
</div>

<ul class="library-grid" id="library-grid">
  {% for t in site.data.library %}
    <li class="tpl-card" data-cat="{{ t.category }}" data-text="{{ t.title | downcase }} {{ t.topic }} {{ t.category | downcase }} {% for f in t.files %}{{ f.name | downcase }} {% endfor %}">
      <a href="{{ '/library/' | append: t.slug | append: '/' | relative_url }}">
        <span class="tpl-cat">{{ t.category }}{% if t.topic != '' %} · {{ t.topic }}{% endif %}</span>
        <span class="tpl-title">{{ t.title }}</span>
        <span class="tpl-files">{% for f in t.files %}<code>{{ f.name }}</code>{% endfor %}</span>
        <span class="tpl-view">View</span>
      </a>
    </li>
  {% endfor %}
</ul>
<p class="library-empty" id="library-empty" hidden>Nothing matches. Try another word.</p>
