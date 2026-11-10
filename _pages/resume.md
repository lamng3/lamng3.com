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

  <h4>Graduate-level technical coursework:</h4>
  <ul>
    <li>Large Language Models (CSDS 600)</li>
    <li>High Performance Data and Computing (CSDS 438)</li>
    <li>Data Mining (CSDS 435)</li>
    <li>Advanced Database Systems (CSDS 433)</li>
    <li>Applied Data Science Research (DSCI 452)</li>
    <li>Data Science Models and Prediction (DSCI 453)</li>
  </ul>

  <h4>Undergraduate technical coursework:</h4>
  <ul>
    <li>Algorithms (CSDS 310)</li>
    <li>Machine Learning (CSDS 340)</li>
    <li>Artificial Intelligence (CSDS 391)</li>
    <li>Database Systems (CSDS 341)</li>
    <li>Data Science Systems (CSDS 312)</li>
    <li>Data Engineering (CSDS 351)</li>
    <li>Structured and Unstructured Data (CSDS 234)</li>
    <li>Data Privacy (CSDS 356)</li>
    <li>Operating Systems (CSDS 338)</li>
    <li>Computer Networks I (CSDS 325)</li>
    <li>Logic Design and Computer Organization (CSDS 281)</li>
    <li>Software Engineering (CSDS 393)</li>
    <li>Software Craftsmanship (CSDS 293)</li>
    <li>Data Structures (CSDS 233)</li>
    <li>Functional Programming in Java (CSDS 245)</li>
    <li>Full Stack Web Development (CSDS 221)</li>
    <li>Senior Project in Computer Science (CSDS 395)</li>
    <li>Introduction to Data Science and Engineering for Majors (CSDS 133)</li>
    <li>Introduction to Programming in Java (CSDS 132)</li>
    <li>Introduction to C/C++ Programming (CSDS 297)</li>
    <li>Introduction to Computer Game Design (CSDS 290)</li>
    <li>Elementary Number Theory (MATH 303)</li>
    <li>Linear Algebra (MATH 307)</li>
    <li>Discrete Mathematics (MATH 304)</li>
    <li>Probability (MATH 380)</li>
    <li>Theoretical Statistics I (STAT 345)</li>
    <li>Calculus for Science and Engineering III (MATH 223)</li>
    <li>Computational Economics (ECON 380)</li>
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
    <h3>AI Research Scientist at the Center for Materials Data Science</h3>
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
      <li>Risky-file clustering and schema-constrained retrieval for natural language to KQL.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Microsoft</h3>
    <p class="resume-meta">2024</p>
    <ul>
      <li>An agentic workflow for sensitive-data detection across 1M+ private documents.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Amazon</h3>
    <p class="resume-meta">2023</p>
    <ul>
      <li>Ranking inference for voice shopping, and a dashboard benchmarking LLMs on human feedback.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Microsoft</h3>
    <p class="resume-meta">2023</p>
    <ul>
      <li>A tiered archive for 110M+ monthly agent logs that keeps critical signals hot.</li>
    </ul>
  </div>

  <div class="job">
    <h3>Software Engineer Intern at Microsoft</h3>
    <p class="resume-meta">2022</p>
    <ul>
      <li>Disk provisioning and dynamic VM scaling for processing partitioned audit logs.</li>
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
