---
layout: default
title: Lam Nguyen
permalink: /
description: >-
  Lam Nguyen, researcher. AI for scientific discovery, agentic retrieval, and database internals.
---

<p class="tagline">
  <span class="joiner">is a </span>researcher<span class="joiner">,</span><br />
  engineer<span class="joiner">, and</span><br />
  competitive programmer<span class="joiner">.</span>
</p>

<section id="about" class="intro">
  <p>I work on AI for scientific discovery at Case Western Reserve University's Center for Materials Data Science, and previously built agentic security at <a href="https://www.microsoft.com">Microsoft</a>.</p>
  <p>I build the <em>semantic data layer</em> for language models: ontologies and knowledge graphs that give agents the right context, from the right source, at a bounded cost. I design these systems through the lens of <em>databases</em>, so retrieval stays context-aware, cache-aware, and trustworthy as the knowledge underneath it evolves.</p>
  <ul class="interests">
    <li><strong>Retrieval and context engineering</strong>: vector retrieval, reranking, tool use, model routing, and caching.</li>
    <li><strong>Database systems</strong>: indexing, query optimization, MVCC, recovery, and provenance.</li>
    <li><strong>Natural language interfaces to databases</strong>: text-to-SPARQL as planning over a typed query algebra.</li>
    <li><strong>Reliable and secure retrieval</strong>: query-driven ontology assessment and adversarial robustness.</li>
  </ul>
  <p>Lately I have been bringing Keras to the browser with <a href="https://lamng3.com/keras-js/">keras-js</a>, and competition math practice to the web with <a href="https://lamng3.com/leetmath/">LeetMath</a>.</p>
</section>

<section id="work">
  <p class="list-label">Notable work:</p>
  <ul class="notable">
    {% for p in site.data.projects %}
      {% if p.notable %}
        {%- assign href = p.links[0].url -%}
        {%- unless href contains '://' -%}{%- assign href = href | relative_url -%}{%- endunless -%}
        <li>
          <a class="notable-name" href="{{ href }}">{{ p.title }}<span class="arrow" aria-hidden="true">↗</span></a>
          <div>
            <p class="notable-blurb">{{ p.blurb }}</p>
            {% if p.stat %}<p class="notable-stat">{{ p.stat }}</p>{% endif %}
          </div>
        </li>
      {% endif %}
    {% endfor %}
  </ul>
  <p class="more"><a href="{{ '/projects/' | relative_url }}">All projects</a> · <a href="{{ '/library/' | relative_url }}">Code library</a></p>
</section>

<section id="background" class="intro">
  <p>Previously, I interned at Microsoft (Security Copilot, Microsoft Security, Azure Data) and Amazon (Alexa Voice AI). Before that, I trained competitive programming, with honorable mentions at the <a href="https://icpc.global/ICPCID/6R4PCMCBJSSW">ICPC East Central North America</a> regional and a place in the top 1% of <a href="https://leetcode.com/u/lamng3/">LeetCode contests</a>, and I still find data structures a useful lens for thinking about agentic memory. Before that, I trained competitive math, earning gold at the Hanoi Open Mathematics Competition and silver at the Singapore Mathematical Olympiad.</p>
  <p>I hold a B.S. and an M.S. in Computer Science from <a href="https://case.edu">Case Western Reserve University</a>, where I was advised by <a href="https://yinghwu.github.io">Yinghui Wu</a>, wrote my <a href="https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=case1751987504689716&amp;disposition=inline">thesis</a> on ontology matching with knowledge retrieval and efficient language models, and was a teaching assistant for machine learning and algorithms.</p>
  <p>Reaching me is O(log log log n), practically a constant. Write to me if you'd like to talk about any of this.</p>
</section>

<section id="experience">
  <h2>Experience</h2>
  <ul class="timeline">
    <li><span><strong>Center for Materials Data Science</strong> · Researcher, AI for Scientific Discovery</span><time>2026</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer, Agentic Security</span><time>2025</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, Security Copilot</span><time>2024</time></li>
    <li><span><strong>Amazon</strong> · Software Engineer Intern, Alexa Voice AI</span><time>2023</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, Microsoft Security</span><time>2023</time></li>
    <li><span><strong>Microsoft</strong> · Software Engineer Intern, Azure Data</span><time>2022</time></li>
  </ul>
</section>

<section id="education">
  <h2>Education</h2>
  <ul class="timeline">
    <li><span><strong>Case Western Reserve University</strong> · M.S. Computer Science, advised by Yinghui Wu</span><time>2025</time></li>
    <li><span><strong>Case Western Reserve University</strong> · B.S. Computer Science, cum laude</span><time>2024</time></li>
  </ul>
  <dl class="coursework">
    <dt>Databases and systems</dt>
    <dd>Advanced Database Systems · Data Science Systems · High Performance Computing · Operating Systems · Computer Networks</dd>
    <dt>AI and machine learning</dt>
    <dd>Machine Learning · Large Language Models · Statistical Learning · Data Mining · Artificial Intelligence · Data Science · Applied Data Science Research</dd>
    <dt>Mathematics</dt>
    <dd>Number Theory · Cryptography · Discrete Mathematics · Probability · Theoretical Statistics · Multivariable Calculus · Linear Algebra · Computational Economics</dd>
    <dt>Teaching</dt>
    <dd>Introduction to Machine Learning (Spring 2025) · Introduction to Algorithms (Fall 2022)</dd>
  </dl>
</section>

<section id="publications">
  <h2>Selected publications</h2>
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
  <p class="more"><a href="{{ '/publications/' | relative_url }}">All publications</a></p>
</section>

<section id="service">
  <h2>Service</h2>
  <p>Co-reviewer, IEEE BigData 2024. Founding member of the CWRU Competitive Programming Club, and vice president of the IEEE Hacker Society.</p>
</section>
