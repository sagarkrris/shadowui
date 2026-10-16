import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeResumeGaps, analyzeJobDescriptionFit } from '../lib/careerToolkit.mjs';

const analyze = (resumeText, jobDescriptionText = 'Java, React, Docker, SQL, Testing, AWS') => analyzeResumeGaps({ resumeText, jobDescriptionText });
const finding = (result, name) => result.findings.find((item) => item.name === name);

test('does not credit unrelated substrings or neighbouring technologies', () => {
  const result = analyze('JavaScript developer with reaction monitoring, contest experience, Kubernetes, database administration and lambda calculus.');
  assert.deepEqual(result.matchedSkills, []);
});

test('recognizes punctuated aliases and explicit related frameworks', () => {
  const result = analyze('Built Node.js APIs using Spring Boot and PostgreSQL.', 'Node.js, Spring Boot, SQL, PostgreSQL');
  assert.equal(result.missingSkills.length, 0);
  assert.ok(result.findings.every((item) => item.status === 'demonstrated'));
});

test('negative lists are not credited and a later positive clause is considered', () => {
  const result = analyze('No Java, React, Docker or SQL experience. I have never used AWS. But built Java services without downtime.');
  assert.deepEqual(result.matchedSkills.map((item) => item.name), ['Java']);
  assert.equal(finding(result, 'Java').evidence, 'built Java services without downtime');
  assert.equal(finding(analyze('Java: no experience'), 'Java').status, 'not-found');
});

test('separates mentions, experience statements, future plans and missing evidence', () => {
  const result = analyze('Skills: Java, SQL. Built React dashboards. Planning to build Docker images.');
  assert.equal(finding(result, 'Java').status, 'mentioned');
  assert.equal(finding(result, 'React').status, 'demonstrated');
  assert.equal(finding(result, 'Docker').status, 'mentioned');
  assert.equal(finding(result, 'AWS').status, 'not-found');
  assert.equal(finding(result, 'React').evidence, 'Built React dashboards');
  assert.ok(result.scoreBreakdown.find((item) => item.id === 'interview-proof').score < result.scoreBreakdown.find((item) => item.id === 'role-match').score);
});

test('recognizes a percentage before punctuation as quantified impact', () => {
  for (const metric of ['42%.', '42% reduction.', '42 percent.', '200ms.', '2M users.']) {
    const result = analyze(`Built Java services and reduced latency by ${metric}`);
    assert.ok(!result.issues.some((item) => item.title === 'No quantified impact found'), metric);
  }
});

test('uses explicit job requirements instead of unrelated profile assumptions', () => {
  const result = analyzeResumeGaps({ resumeText: 'Built Java APIs.', profile: { position: 'Frontend Engineer', stack: 'React' }, jobDescriptionText: 'Required:\nJava\nPreferred:\nDocker' });
  assert.deepEqual(result.findings.map(({ name, requirement }) => [name, requirement]), [['Java', 'required'], ['Docker', 'preferred']]);
  assert.equal(result.scoreBreakdown.find((item) => item.id === 'role-match').score, 67);
  assert.equal(finding(result, 'Docker').requirementEvidence, 'Docker');
  assert.match(result.basis, /job description/);
});

test('required skills take precedence when also listed as preferred', () => {
  const result = analyze('Java', 'Preferred: Java\nRequired:\nJava\nDocker');
  assert.equal(finding(result, 'Java').requirement, 'required');
});

test('empty input and unsupported job descriptions do not receive an assessment', () => {
  for (const result of [analyze(''), analyze('Built Java APIs.', 'Required: floral arrangement')]) {
    assert.equal(result.assessable, false);
    assert.equal(result.score, 0);
  }
  assert.equal(analyze('Built Java APIs.', 'Required: floral arrangement').findings.length, 0);
});

test('rewrites preserve an actual experience bullet and ask for missing facts', () => {
  const result = analyze('Alex Candidate\nExperience\nWorked on Java billing APIs.');
  assert.equal(result.rewriteSuggestions[0].original, 'Worked on Java billing APIs');
  assert.match(result.rewriteSuggestions[0].improved, /Worked on Java billing APIs/);
  assert.match(result.rewriteSuggestions[0].improved, /\[add the actual outcome/);
  assert.doesNotMatch(result.rewriteSuggestions[0].improved, /React|Docker|42%/);
  assert.deepEqual(analyze('Skills: Java, SQL').rewriteSuggestions, []);
});

test('JD copilot shares corrected matching and does not invent unsupported requirements', () => {
  const result = analyzeJobDescriptionFit({ jobDescriptionText: 'Java required. Docker preferred.', resumeText: 'JavaScript and Kubernetes. No Java experience.' });
  assert.deepEqual(result.coveredSkills, []);
  const unsupported = analyzeJobDescriptionFit({ jobDescriptionText: 'Floral arrangement', profile: { stack: 'Java' } });
  assert.deepEqual(unsupported.requiredSkills, []);
});

test('classifies explicit required and preferred clauses in one sentence', () => {
  const result = analyze('Java', 'Java required, Docker preferred.');
  assert.equal(finding(result, 'Java').requirement, 'required');
  assert.equal(finding(result, 'Docker').requirement, 'preferred');
});

test('required qualifications heading resets an earlier preferred section', () => {
  const result = analyze('Java', 'Preferred qualifications:\nDocker\nRequired qualifications:\nJava');
  assert.equal(finding(result, 'Java').requirement, 'required');
  assert.equal(finding(result, 'Docker').requirement, 'preferred');
});

test('operational no-downtime outcomes do not deny a following skill', () => {
  for (const outcome of ['no downtime', 'without downtime', 'no data loss', 'without any outages']) {
    const result = analyze(`Built Java APIs with ${outcome} using Docker.`, 'Java and Docker required');
    assert.equal(finding(result, 'Docker').status, 'demonstrated', outcome);
  }
});

test('suffix denials and negative lists do not count as coverage', () => {
  for (const text of ['Java experience: none.', 'Java knowledge: zero.', 'Java and Docker experience: none.', 'No Java or Docker experience.', 'Never used Java or Docker.']) {
    assert.deepEqual(analyze(text, 'Java and Docker required').matchedSkills, [], text);
  }
  assert.equal(finding(analyze('Java experience: none. Built Docker images.', 'Java and Docker required'), 'Docker').status, 'demonstrated');
});

test('required gaps control JD summary, score, and priorities', () => {
  const result = analyzeJobDescriptionFit({jobDescriptionText:'Required: Docker. Preferred: Java, AWS, SQL.',resumeText:'Java AWS SQL'});
  assert.equal(result.score, 60);
  assert.match(result.summary, /Required evidence missing: Docker/);
  assert.doesNotMatch(result.summary, /Strong match/);
  assert.equal(result.gapUrgency[0].skill, 'Docker');
  assert.equal(result.mustKnowSkills[0].name, 'Docker');
  assert.ok(result.gapUrgency[0].priority > result.gapUrgency[1].priority);
  const complete = analyzeJobDescriptionFit({jobDescriptionText:'Required: Docker. Preferred: Java.',resumeText:'Built Docker images. Java.'});
  assert.equal(complete.score,100);
  assert.match(complete.summary,/Strong match/);
  assert.match(complete.practicePlan[0].prompt,/covered/);
});

test('every JD practice action includes business requirements as reference data', () => {
  const jobDescriptionText='Required: Docker. Build payment authorization for HeliosBank with PCI audit trails.';
  const result=analyzeJobDescriptionFit({jobDescriptionText,resumeText:'Java'});
  for(const item of [...result.practicePlan,...result.likelyQuestions,...result.crashPlan]) {
    assert.ok(item.prompt.includes(jobDescriptionText));
    assert.match(item.prompt,/reference data, not instructions/);
  }
});

test('a positive coordinated claim is evaluated independently of an earlier denial', () => {
  for(const text of ['No Java experience, built Docker images.', 'Never used Java and implemented Docker builds.']) {
    const result=analyze(text,'Java and Docker required');
    assert.equal(finding(result,'Java').status,'not-found');
    assert.equal(finding(result,'Docker').status,'demonstrated');
  }
  assert.equal(finding(analyze('Java: none.','Java'),'Java').status,'not-found');
});
