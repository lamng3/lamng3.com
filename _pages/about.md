---
layout: default
title: Lam Nguyen
permalink: /
description: >-
  Lam Nguyen, researcher. AI for scientific discovery, agentic retrieval, and database internals.
---

<header>
  <h1>Lam Nguyen</h1>
  <p class="affiliation">Researcher, AI for Scientific Discovery</p>
  <nav class="links" aria-label="Profiles">
    <a href="https://github.com/lamng3">GitHub</a>
    <a href="https://scholar.google.com/citations?user=ws80Q0IAAAAJ">Scholar</a>
    <a href="https://leetcode.com/u/lamng3/">LeetCode</a>
  </nav>
</header>

<section id="about">
  <p><strong>I play with agentic retrieval and database internals.</strong></p>
  <p>I am a researcher working on AI for scientific discovery. I build the semantic data layer for LLMs: ontologies and knowledge graphs that give agents the right context, from the right source, at a bounded cost. I design algorithms and systems through the lens of databases, so retrieval stays context-aware, cache-aware, and trustworthy as the knowledge underneath it evolves.</p>
  <p>I hold an M.S. in Computer Science from <a href="https://case.edu">Case Western Reserve University</a>, advised by <a href="https://yinghwu.github.io">Dr. Yinghui Wu</a>, with a <a href="https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=case1751987504689716&amp;disposition=inline">thesis</a> on ontology matching with knowledge retrieval and efficient language models.</p>
  <p><strong>Research interests</strong></p>
  <ul class="interests">
    <li><strong>Retrieval &amp; Context Engineering</strong>: vector retrieval, reranking, tool use, model routing, and caching <span class="projects">(<a href="https://github.com/lamng3/agentic-ontologist">Agentic Ontologist</a>, <a href="https://arxiv.org/abs/2507.14032">Kroma</a>)</span>.</li>
    <li><strong>Database Systems</strong>: indexing, query optimization, MVCC, recovery, and provenance <span class="projects">(<a href="https://github.com/lamng3/OntoDB">OntoDB</a>)</span>.</li>
    <li><strong>Natural Language Interfaces to Databases</strong>: text-to-SPARQL as planning over a typed query algebra <span class="projects">(<a href="https://github.com/lamng3/hermes">Hermes</a>)</span>.</li>
    <li><strong>Reliable &amp; Secure Retrieval</strong>: query-driven ontology assessment and adversarial robustness <span class="projects">(<a href="https://github.com/cwru-sdle/OntoCheck">OntoCheck</a>, <a href="https://github.com/lamng3/aegis">Aegis</a>)</span>.</li>
  </ul>
  <p>Before this I trained competitive programming, reaching the top 1% in <a href="https://leetcode.com/u/lamng3/">LeetCode contests</a>, and I still find data structures and algorithms a useful lens for thinking about agentic memory.</p>
  <p>Prior to that, I trained competitive math, earning gold and silver medals at the Hanoi Mathematical Olympiad and the Singapore Mathematical Olympiad.</p>
  <p>I founded <a href="https://lamng3.github.io/leetmath/">LeetMath</a>, a platform for AI-guided math training and automated grading.</p>
  <p>Reaching me is O(log log log n), practically a constant. Please feel free to reach out at lamng3.work [at] gmail [dot] com if you'd like to talk about any of the above.</p>
</section>

<section id="experiences">
  <h2>Experiences</h2>
  <ul class="post-list">
    <li><span><strong>Center for Materials Data Science</strong> · Researcher, AI for Scientific Discovery</span><time>2026</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer, Agentic Security</span><time>2025</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, Security Copilot</span><time>2024</time></li>
    <li><span><strong>Amazon</strong> · Software Engineer Intern, Alexa Voice AI</span><time>2023</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, Microsoft Security</span><time>2023</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, Azure Data</span><time>2022</time></li>
  </ul>
</section>

<section id="publications">
  <h2>Selected Publications</h2>
  <ol class="entries pubs">
    {% for pub in site.data.publications %}
      {% if pub.selected %}
        <li>
          <span class="authors">{{ pub.authors }}.</span>
          <a class="ptitle" href="{{ '/publications/' | append: pub.slug | append: '/' | relative_url }}">{{ pub.title }}.</a>
          {% if pub.status == 'published' %}<span class="venue">{{ pub.venue }}</span>, {{ pub.year }}.{% endif %}
          {% if pub.pdf %}{%- assign pdf_url = pub.pdf -%}{%- unless pdf_url contains '://' -%}{%- assign pdf_url = pdf_url | relative_url -%}{%- endunless -%}<a href="{{ pdf_url }}">[PDF]</a>{% endif %}
          {% for link in pub.links %}{% if link.label == 'Code' %}<a href="{{ link.url }}">[Code]</a>{% endif %}{% endfor %}
        </li>
      {% endif %}
    {% endfor %}
  </ol>
  <p class="links-inline"><a href="{{ '/publications/' | relative_url }}">All publications</a></p>
</section>

<section id="open-source">
  <h2>Open Source</h2>
  <ul class="entries">
    <li>
      <p class="title"><a href="https://github.com/lamng3/OntoDB">OntoDB</a><span class="meta">: A database management system for ontologies: RDF storage, SPARQL queries, and crash recovery with a write-ahead log</span></p>
      <p class="links-inline"><a href="https://github.com/lamng3/OntoDB">Repository</a> · <a href="https://lamng3.github.io/ontodb-docs/">Manual</a> · <a href="{{ '/publications/ontodb-book/' | relative_url }}">Book</a> · <a href="{{ '/blog/databases/#database-engine' | relative_url }}">Walkthrough</a></p>
    </li>
  </ul>
</section>

<section id="service">
  <h2>Service</h2>
  <p>Reviewing: Co-reviewer, IEEE BigData 2024.</p>
</section>
