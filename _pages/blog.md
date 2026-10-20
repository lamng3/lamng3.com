---
layout: default
permalink: /blog/
title: Blog
description: Study notes on algorithms, data structures, and the systems built on them, and where they turn up again in agentic memory.
---

<section class="library-intro">
  <h2>Study notes</h2>
  <p>Notes on algorithms, data structures, and the systems built on them, and where they turn up again in agentic memory. One page per topic, written derivation-first. The code lives in the <a href="{{ '/library/' | relative_url }}">library</a>.</p>
</section>

<div class="search-wrap">
  <button class="search-field" type="button" data-search-open aria-label="Search the blog">
    <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="M15.5 15.5 21 21" /></svg>
    <span class="search-field-text">Search techniques, problems, keywords…</span>
    <kbd class="search-shortcut">⌘K</kbd>
  </button>
</div>

<p class="recent">
  {% assign days = site.data.recent | group_by: "date" | reverse %}
  {% for day in days %}
    <span class="recent-line">
      <time datetime="{{ day.name }}">{{ day.name | date: "%b %-d" }}</time>
      {% for item in day.items %}
        <a href="{{ item.url | relative_url }}">{{ item.title }}</a>{% unless forloop.last %}<span class="sep">, </span>{% endunless %}
      {% endfor %}
    </span>
  {% endfor %}
</p>

<ul class="library-grid topic-grid">
  {% for topic in site.data.topics %}
    {% assign topic_url = '/blog/' | append: topic.slug | append: '/' %}
    {% assign topic_page = site.pages | where: 'url', topic_url | first %}
    <li class="tpl-card">
      <a href="{{ topic_url | relative_url }}">
        <span class="tpl-cat">{% assign n = topic.sections | size %}{% if n == 0 %}problem list{% else %}{{ n }} technique{% if n != 1 %}s{% endif %}{% endif %} · <time datetime="{{ topic_page.last_updated | date: '%Y-%m-%d' }}">{{ topic_page.last_updated | date: "%b %-d, %Y" }}</time></span>
        <span class="tpl-title">{{ topic.title }}</span>
        <span class="tpl-files"><code>{{ topic.slug }}</code></span>
        <span class="tpl-view">Read</span>
      </a>
    </li>
  {% endfor %}
</ul>
