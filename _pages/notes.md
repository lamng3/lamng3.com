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
      <p class="title"><a href="{{ pdf }}">{{ note.title }}</a></p>
      <p class="desc">Following <a href="{{ note.course_url }}">{{ note.course }}</a>. {{ note.blurb }}</p>
      <p class="links-inline">
        Updated {{ note.updated | date: "%B %-d, %Y" }} · <a href="{{ pdf }}">PDF</a>
        {%- if note.practice %} · <a href="https://github.com/lamng3/lamng3.com/tree/main/{{ note.practice }}">Practice code</a>{% endif %}
      </p>
    </li>
  {% endfor %}
</ul>
