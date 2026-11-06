---
layout: default
title: Resume
permalink: /resume/
description: Lam Nguyen's academic resume, with education, publications, research and industry experience, teaching, awards, and services.
---

<section id="education" class="resume">
  <h2>Education</h2>

  <div class="degree">
    <div class="degree-head"><h3>Case Western Reserve University</h3><span>2024 — 2025</span></div>
    <p class="byline">M.S. in Computer Science</p>
    <p class="degree-note">Thesis: <a href="https://etd.ohiolink.edu/acprod/odb_etd/ws/send_file/send?accession=case1751987504689716&amp;disposition=inline">Ontology Matching with Knowledge Retrieval and Efficient Large Language Models</a>, advised by <a href="https://yinghwu.github.io">Yinghui&nbsp;Wu</a>.</p>
  </div>
  <div class="degree">
    <div class="degree-head"><h3>Case Western Reserve University</h3><span>2020 — 2024</span></div>
    <p class="byline">B.S. in Computer Science</p>
    <p class="degree-note">Graduated cum laude.</p>
  </div>

  <h4>Selected coursework:</h4>
  <ul>
    <li><strong>Databases and systems:</strong> Advanced Database Systems, High Performance Data and Computing, Data Science Systems, Database Systems, Operating Systems, Computer Networks I</li>
    <li><strong>AI and machine learning:</strong> Large Language Models, Machine Learning, Artificial Intelligence, Data Mining, Applied Data Science Research, Data Science Models and Prediction</li>
    <li><strong>Mathematics and theory:</strong> Algorithms, Discrete Mathematics, Probability, Theoretical Statistics I, Linear Algebra, Elementary Number Theory</li>
  </ul>
</section>

<section id="publications" class="resume">
  <h2>Publications</h2>
  <ul>
    {% for pub in site.data.publications %}
      {% unless pub.kind == 'book' %}
        <li>
          {{ pub.authors }}. <a href="{{ '/publications/' | append: pub.slug | append: '/' | relative_url }}">{{ pub.title }}</a>. {{ pub.venue }}, {{ pub.year }}.
        </li>
      {% endunless %}
    {% endfor %}
  </ul>
</section>

<section id="talks" class="resume">
  <h2>Talks</h2>
  <ul>
    <li>KROMA: Ontology Matching with Knowledge Retrieval and Large Language Models. Research track talk, ISWC 2025, Nara, Japan, November 2025.</li>
  </ul>
</section>

<section id="research" class="resume">
  <h2>Research experience</h2>

  <div class="job">
    <h3>Data Science Researcher at the Center for Materials Data Science</h3>
    <p class="resume-meta">2026 – Present</p>
    <ul>
      <li>Semantic data infrastructure for LLM agents: a query engine for ontologies, a transactional memory layer for agents, and memory-augmented agents that build and maintain ontologies.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Affiliate Researcher at the Center for Materials Data Science</h3>
    <p class="resume-meta">2025 – 2026, with Yinghui Wu and Roger H. French</p>
    <ul>
      <li>Joining isolated scientific data and metadata into one semantic layer, with ontology integration under budgeted language-model inference.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Graduate Student Researcher at the Center for Materials Data Science</h3>
    <p class="resume-meta">2024 – 2025, advised by Yinghui Wu and Roger H. French</p>
    <ul>
      <li>Knowledge-graph retrieval for concept enrichment, entity matching, and graph maintenance.</li>
    </ul>
  </div>
</section>

<section id="industry" class="resume">
  <h2>Industry experience</h2>

  <div class="job">
    <h3>Software Engineer at Microsoft</h3>
    <p class="resume-meta">2025 – 2026</p>
    <ul>
      <li>Agentic Security: risky-file clustering and schema-constrained retrieval for natural language to KQL in Security Copilot.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Microsoft</h3>
    <p class="resume-meta">2024</p>
    <ul>
      <li>Security Copilot: an agentic workflow for sensitive-data detection across 1M+ private documents.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Amazon</h3>
    <p class="resume-meta">2023</p>
    <ul>
      <li>Alexa Voice AI: ranking inference for voice shopping, and a dashboard benchmarking LLMs on human feedback.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Microsoft</h3>
    <p class="resume-meta">2023</p>
    <ul>
      <li>Microsoft Security: a tiered archive for 110M+ monthly agent logs that keeps critical signals hot.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Microsoft</h3>
    <p class="resume-meta">2022</p>
    <ul>
      <li>Azure Data: disk provisioning and dynamic VM scaling for processing partitioned audit logs.</li>
    </ul>
  </div>
</section>

<section id="teaching" class="resume">
  <h2>Teaching</h2>
  <ul>
    <li>Teaching Assistant, Introduction to Machine Learning (CSDS 340), with Xiaotian Han, Spring 2025</li>
    <li>Teaching Assistant, Introduction to Algorithms (CSDS 310), with Mehmet Koyuturk, Fall 2022</li>
  </ul>
</section>

<section id="awards" class="resume">
  <h2>Awards</h2>
  <ul>
    <li>Honorable Mention, <a href="https://icpc.global/ICPCID/6R4PCMCBJSSW">ICPC East Central North America</a> Regional Contest, 2020–2023</li>
    <li>Top 1% in <a href="https://leetcode.com/u/lamng3/">LeetCode</a> contests, 1,000+ problems solved</li>
    <li>Gold Medal, Hanoi Open Mathematics Competition, Senior Division</li>
    <li>Silver Medal, Singapore Mathematical Olympiad</li>
    <li>6th Place, Vietnam's Brainiest Kid, national academic game show broadcast by VTV</li>
  </ul>
</section>

<section id="services" class="resume">
  <h2>Services</h2>
  <ul>
    <li>Co-reviewer, IEEE International Conference on Big Data (BigData), 2024</li>
  </ul>
</section>

<section id="extracurriculars" class="resume">
  <h2>Extracurriculars</h2>
  <ul>
    <li>Founding Member, CWRU Competitive Programming Club, 2023</li>
    <li>Vice President, IEEE Hacker Society, 2022</li>
  </ul>
</section>
