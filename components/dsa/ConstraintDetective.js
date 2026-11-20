import { useState } from 'react';
import { CONSTRAINT_BANDS, CONSTRAINT_SCENARIOS, STRUCTURE_CLUES } from '../../lib/dsaConstraintGuide.mjs';
import styles from '../../styles/DsaGuide.module.css';

function ClueTable({ label, headers, rows }) {
  return <div className={styles.tableWrap} role="region" aria-label={label} tabIndex={0}><table className={styles.table}><caption>{label}</caption><thead><tr>{headers.map(header => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{rows.map(([clue, candidate, caveat]) => <tr key={clue}><th scope="row">{clue}</th><td>{candidate}</td><td>{caveat}</td></tr>)}</tbody></table></div>;
}

export default function ConstraintDetective() {
  const [scenarioId, setScenarioId] = useState(CONSTRAINT_SCENARIOS[0].id);
  const scenario = CONSTRAINT_SCENARIOS.find(item => item.id === scenarioId);
  return <section className={styles.constraintGuide} aria-labelledby="constraint-detective-title" style={{ minWidth: 0, padding: 16, border: '1px solid #62778d', borderRadius: 8, display: 'grid', gap: 16, color: 'var(--jd-text, #dbeafe)', background: 'var(--jd-surface, #101c30)', lineHeight: 1.65 }}>
    <div><h2 id="constraint-detective-title">Constraint Detective: choose a DS from the clues</h2><p>A data structure (DS) organizes information for operations such as lookup or removing the smallest item. An algorithm is the sequence of steps using that information. Constraints narrow your candidates; they do not uniquely identify a solution.</p></div>
    <ol><li><strong>Read the contract:</strong> input shape, output, maximum sizes, duplicates, negatives, sortedness, mutation, time and memory limits.</li><li><strong>Estimate affordable work:</strong> count operations across all test cases. For a grid use rows × columns; for a graph include both vertices and edges; for DP count states × transition cost.</li><li><strong>Name the repeated operation:</strong> lookup, minimum, last-in-first-out, range aggregation, or exploring neighbors. Pick structures that make it cheap.</li><li><strong>Prove and challenge:</strong> state the invariant, try to break it, compare alternatives, then code and test.</li></ol>
    <h3>Input size → complexity shortlist</h3>
    <p>These are illustrative planning heuristics, not LeetCode time-limit guarantees. O(n²) means work grows roughly with the square of n; O(n log n) grows more slowly. Constants, language, allocation, output size and the total input across test cases matter. A logarithm counts repeated reductions, such as halving a search space.</p>
    <ClueTable label="Constraint complexity shortlist" headers={['Maximum size', 'Candidate work', 'Why / caution']} rows={CONSTRAINT_BANDS} />
    <h3>Problem clues → candidate structures and patterns</h3>
    <ClueTable label="Data structure clue map" headers={['Required behavior', 'Consider', 'Assumption to verify']} rows={STRUCTURE_CLUES} />
    <p><strong>Memory and numeric clues:</strong> a small alphabet can use a count array, but Unicode may require code-point keys. A Java int[100000000] needs about 400 MB of element storage before headers; boxed maps cost more per entry. n=100,000 with values up to 10⁹ can produce sums of 10¹⁴, so widen arithmetic before calculating. Sorted input supports binary search only when the search predicate lets you safely discard a region.</p>
    <h3>Worked LeetCode-style decisions</h3>
    <label htmlFor="constraint-scenario">Choose a constraint scenario</label>
    <select id="constraint-scenario" value={scenarioId} onChange={event => setScenarioId(event.target.value)} style={{ width: '100%', minWidth: 0, padding: 10, color: 'var(--jd-text, #dbeafe)', background: 'var(--jd-surface-sunken, #17263d)' }}>{CONSTRAINT_SCENARIOS.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select>
    <article key={scenario.id} aria-label="Worked constraint decision">
      <h4>{scenario.title}</h4><p>{scenario.prompt}</p><p><strong>Candidate:</strong> {scenario.choice}</p>
      <p><strong>How it works:</strong> {scenario.mechanism}</p><p><strong>Dry run:</strong> {scenario.example}</p><p><strong>Trade-offs:</strong> {scenario.cost}</p><p><strong>Misleading clue:</strong> {scenario.trap}</p>
      <p><strong>Verify it:</strong> {scenario.verify}</p><h4>Answer you can say aloud</h4><p>{scenario.spoken}</p>
      <details><summary>Interviewer follow-up and explained answer</summary><p>{scenario.followup}</p></details>
    </article>
    <details><summary>Deep dive: why the same size can need different structures</summary><p>At n=100,000, duplicate detection suggests a set; repeatedly removing the minimum suggests a heap; unweighted shortest paths suggest a queue with visited tracking. The size constrains work, while the operations determine useful storage. BFS explores by edge count, so it gives shortest paths only for unweighted or equal-cost edges. In a graph, a visited set avoids repeatedly expanding cycles. A heap alone does not solve arbitrary negative-weight shortest paths.</p><p>Before committing, compare your optimized method with brute force on many small deterministic cases. Include empty input if permitted, one element, duplicates, all-negative values, no answer, and maximum arithmetic bounds. A successful sample is evidence for that sample, not a correctness proof.</p></details>
    <p>Primary references: <a href="https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html">Java 21 HashMap guarantees</a> (fast basic operations assume good hash dispersion); <a href="https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/PriorityQueue.html">Java 21 PriorityQueue costs and ordering</a>; <a href="https://cp-algorithms.com/graph/breadth-first-search.html">BFS algorithm and shortest-path scope</a>. Scenarios are conceptual walkthroughs, not benchmark results or a submitted LeetCode solution.</p>
  </section>;
}
