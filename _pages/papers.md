---
layout: default
title: Paper notes
permalink: /papers/
description: "Notes on the papers I read: the sticky notes I write while reading, the key ideas once I finish, and a map that links papers through the ideas they share."
---

<section class="library-intro">
  <h2>Paper notes</h2>
  <p>Notes on the papers I read: the sticky notes I write while reading, then the key ideas once I finish. The <a href="{{ '/papers/map/' | relative_url }}">map</a> links papers through the ideas they share.</p>
</section>

{% assign papers = site.papers | sort: 'updated' | reverse %}
{% assign all_ideas = '' | split: '' %}
{% for p in papers %}{% assign all_ideas = all_ideas | concat: p.ideas %}{% endfor %}
{% assign all_ideas = all_ideas | uniq | sort_natural %}

{% if papers.size > 0 %}

<div class="library-tools">
  <input type="search" id="library-filter" placeholder="Filter: title, author, idea…" aria-label="Filter the paper notes" autocomplete="off" />
  {% if all_ideas.size > 0 %}
  <div class="library-cats" role="group" aria-label="Idea">
    <button type="button" data-cat="" aria-pressed="true">All</button>
    {% for idea in all_ideas %}<button type="button" data-cat="{{ idea | downcase | escape }}" aria-pressed="false">{{ idea }}</button>{% endfor %}
  </div>
  {% endif %}
</div>

<ul class="library-grid" id="library-grid">
  {% for p in papers %}
    <li class="tpl-card" data-cat="{% for i in p.ideas %}|{{ i | downcase | escape }}{% endfor %}|" data-text="{{ p.title | downcase | escape }} {{ p.authors | downcase | escape }} {{ p.venue | downcase | escape }} {{ p.ideas | join: ' ' | downcase | escape }}">
      <a href="{{ p.url | relative_url }}">
        <span class="tpl-cat">{{ p.venue }}{% if p.venue and p.year %}, {% endif %}{{ p.year }}{% if p.stickies.size > 0 %} · {{ p.stickies.size }} note{% if p.stickies.size != 1 %}s{% endif %}{% endif %}</span>
        <span class="tpl-title">{{ p.title }}</span>
        <span class="tpl-files">{% for i in p.ideas limit: 4 %}<code>{{ i }}</code>{% endfor %}</span>
        <span class="tpl-view">Read</span>
      </a>
    </li>
  {% endfor %}
</ul>
<p class="library-empty" id="library-empty" hidden>Nothing matches. Try another word.</p>

{% else %}

<p class="library-empty">No notes yet.</p>

{% endif %}
