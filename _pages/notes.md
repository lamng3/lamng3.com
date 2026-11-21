---
layout: default
title: Notes
permalink: /notes/
description: "Study notes, written up in LaTeX as I learn: one PDF per course or subject, one chapter per lecture, with practice code alongside."
---

<section class="library-intro">
  <h2>Study notes</h2>
  <p>Notes from courses I am following, written up in LaTeX so that I can come back to them. Each one grows a chapter at a time as I go.</p>
</section>

<ul class="entries">
  {% for note in site.data.notes %}
    {%- assign pdf = '/assets/notes/' | append: note.slug | append: '.pdf' | relative_url -%}
    <li>
      <a class="ptitle" href="{{ '/notes/' | append: note.slug | append: '/' | relative_url }}">{{ note.title }}</a>
      · <a href="{{ pdf }}">PDF</a>
      {%- if note.practice_url %} · <a href="{{ note.practice_url }}">Practice code</a>{% endif %}
    </li>
  {% endfor %}
</ul>
