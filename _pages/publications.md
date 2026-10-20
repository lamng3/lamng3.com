---
layout: default
title: Publications
permalink: /publications/
description: Papers, a thesis, and a book on ontologies, knowledge graphs, language models, and database systems, each with its own page and PDF.
---

<section class="library-intro">
  <h2>Papers</h2>
  <p>Papers, a thesis, and a book. Open one for its TL;DR and PDF.</p>
</section>

<ol class="entries pubs pub-index">
  {% for pub in site.data.publications %}
    {% unless pub.kind == 'book' %}
      <li>
        <a class="ptitle" href="{{ '/publications/' | append: pub.slug | append: '/' | relative_url }}">{{ pub.title }}</a>
        <span class="authors">{{ pub.authors }}.</span>
        <span class="venue">{{ pub.venue }}</span>, {{ pub.year }}.
      </li>
    {% endunless %}
  {% endfor %}
</ol>

<h2>Book</h2>

<ul class="entries pubs pub-index">
  {% for pub in site.data.publications %}
    {% if pub.kind == 'book' %}
      <li>
        <a class="ptitle" href="{{ '/publications/' | append: pub.slug | append: '/' | relative_url }}">{{ pub.title }}</a>
        <span class="venue">{{ pub.venue }}</span>.
      </li>
    {% endif %}
  {% endfor %}
</ul>
