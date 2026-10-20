---
layout: default
title: Projects
permalink: /projects/
description: Open-source projects by Lam Nguyen, from database engines and ontology tools to machine learning in the browser.
---

<section class="projects-intro">
  <h2>Open source</h2>
  <p>I build in the open to learn a topic all the way down: a database engine to understand <em>recovery</em>, a reasoner to understand <em>description logics</em>, a framework port to understand <em>training</em>.</p>
  <p>You'll see that I particularly like databases, knowledge graphs, language agents, and machine learning systems. If something here is useful to you, I'd love to <a href="mailto:lamng3.work@gmail.com">hear about it</a>.</p>
</section>

<div class="band">
  <div class="band-inner">
    <h2>Table of contents</h2>
    <ol class="toc-columns">
      {% assign by_title = site.data.projects | sort_natural: 'title' %}
      {% for p in by_title %}
        <li><a href="#{{ p.slug }}">{{ p.title }}</a></li>
      {% endfor %}
    </ol>
  </div>
</div>

<div class="sortbar" role="group" aria-label="Sort projects">
  <button type="button" data-sort="date" aria-pressed="true">
    <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4" /></svg>by date
  </button>
  <button type="button" data-sort="stars" aria-pressed="false">
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>by stars
  </button>
</div>

<div class="project-list" id="project-list">
  {% for p in site.data.projects %}
    <article class="project" id="{{ p.slug }}" data-date="{{ p.date }}" data-stars="{{ p.stars | default: 0 }}">
      <div class="project-text">
        <h3><a href="#{{ p.slug }}">{{ p.title }}</a> <time datetime="{{ p.date }}">{{ p.date | date: '%B %Y' }}</time></h3>
        <p class="chips">
          {% if p.repo %}<a class="chip" href="https://github.com/{{ p.repo }}" title="GitHub stars"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>{{ p.stars | default: 0 }}</a>{% endif %}
          {% for lang in p.languages %}<span class="chip">{{ lang }}</span>{% endfor %}
          <span class="chip">{{ p.category }}</span>
        </p>
        <p class="project-lead">{{ p.lead }}</p>
        {% for para in p.body %}
          {{ para | markdownify }}
        {% endfor %}
        <p class="project-links">
          <strong>Links:</strong>
          {% for link in p.links %}
            {%- assign href = link.url -%}
            {%- unless href contains '://' -%}{%- assign href = href | relative_url -%}{%- endunless -%}
            <a href="{{ href }}">{{ link.label }}</a>{% unless forloop.last %}, {% endunless %}
          {% endfor %}
        </p>
      </div>
      {% if p.image %}
        <a class="project-image" href="{{ p.links[0].url | relative_url }}" tabindex="-1" aria-hidden="true">
          <img src="{{ '/assets/img/projects/' | append: p.image | relative_url }}" alt="" loading="lazy" width="960" height="600" />
        </a>
      {% endif %}
    </article>
  {% endfor %}
</div>
