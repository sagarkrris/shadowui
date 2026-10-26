import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { COMPREHENSION_STARTER, COMPREHENSION_REFERENCE } from '../../lib/codeComprehension.mjs';
import styles from '../../styles/Reader.module.css';
import ComprehensionExercises from '../../components/interview-guide/ComprehensionExercises';
import CourseSketch from '../../components/course/CourseSketch';

export default function CodeComprehension() {
  return <ReaderLayout title="Code comprehension interview preparation" description="Prepare to read unfamiliar code, trace behavior, debug boundary cases and verify AI suggestions, with eight detailed Java exercises, a cache walkthrough and a mock interview plan.">
    <nav className={styles.guideBreadcrumb}><Link href="/senior-java-interview">Senior Java interview guide</Link> / Code comprehension</nav>
    <article className={styles.guideArticle}>
      <p className={styles.eyebrow}>INTERVIEW FORMATS · REVIEWED 26 OCTOBER 2026</p>
      <h1>Code comprehension interview preparation</h1>
      <p className={styles.lead}>Explain what unfamiliar code does, demonstrate where it fails, and defend a small, verified improvement. Code comprehension means building an accurate mental model of existing code before changing it.</p>
      <p>For Java candidates, the same approach applies to controllers, services, repositories and tests. Start with eight Java 17 questions below, ordered from beginner to applied service reasoning. Each has a full walkthrough and a visual flow. A separate JavaScript cache exercise shows how the same method transfers to another language. All exercises are original practice material, not Google interview questions.</p>
      <nav aria-label="Code comprehension sections"><ul>
        <li><a href="#reported-format">Google’s reported format</a></li>
        <li><a href="#reading-method">How to read an unfamiliar codebase</a></li>
        <li><a href="#java-comprehension-title">Eight Java questions with detailed answers</a></li>
        <li><a href="#exercise">Worked debugging exercise</a> — optional JavaScript cache example</li>
        <li><a href="#ai-verification">Verify an AI suggestion</a></li>
        <li><a href="#mock-round">Run a practice round</a></li>
      </ul></nav>

      <h2 id="reported-format">What is known about Google’s round?</h2>
      <p>Business Insider’s <a href="https://www.businessinsider.com/google-job-interview-software-engineers-ai-assistant-coding-2026-5">7 May report</a> described a Google-confirmed pilot: selected US junior and mid-level candidates read, debug and optimize existing code with Gemini; interviewers assess prompting and output validation. Its <a href="https://www.businessinsider.com/google-interview-process-ai-gemini-coding-comprehension-software-engineer-2026-10">20 October update</a> said the formats had expanded, but Google still called them pilots.</p>
      <p>These reports do not establish a universal interview loop, a fixed codebase size or duration, or permission to use AI in every round. Confirm the role, location, language, time, available tests and permitted tools with your recruiter. Keep preparing algorithms and system design for the rounds in your own invitation.</p>

      <h2 id="reading-method">How do I understand code I have never seen?</h2>
      <p>You do not need to understand every line immediately. First answer three questions: what comes in, what should come out, and what can change along the way? The <strong>contract</strong> is the rule the function must obey. An <strong>invariant</strong> is a rule that must remain true, such as “do not return an expired value.” Your <strong>mental model</strong> is a plain-language explanation that lets you predict the next step.</p>
      <p>For example, a method that adds [2, 3, 4] should return 9. Write the current position and total after each iteration. If the code tries to read a fourth element, you can explain the failure before knowing any advanced algorithms. Question 1 walks through exactly this example.</p>
      <ol>
        <li><strong>Orient:</strong> read the task and tests, locate the entry point and follow one request through its collaborators. For a web service, follow the controller (receives the request), service (applies business rules) and repository (reads or writes stored data). Note where failures are handled and where a group of database changes is committed together.</li>
        <li><strong>Trace:</strong> write down each branch, collection lookup and state change for one ordinary input. Separate what the code actually does from what its names imply.</li>
        <li><strong>Challenge:</strong> try empty input, missing values, duplicates, order changes and exact boundaries. For shared mutable state, identify the owner and concurrent operations.</li>
        <li><strong>Prove:</strong> reduce a suspected defect to the smallest input with expected versus actual results. A hypothesis becomes evidence when the trace or test demonstrates it.</li>
        <li><strong>Change and verify:</strong> make one focused fix, rerun the failing case and neighboring cases, then explain compatibility and performance costs. Optimize after correctness and measurement.</li>
      </ol>
      <h3>A complete answer you can say aloud</h3>
      <blockquote><p>I would first clarify the expected behavior and allowed tools. Then I would trace one request from its entry point, recording the state it reads and changes. I would explain that flow back to the interviewer and identify any assumptions I cannot yet verify. Before editing, I would construct a small failing case, including boundary inputs, and predict its output. I would make the smallest change that restores the contract and test both the failure and adjacent cases. If AI is permitted, I would ask for specific hypotheses and independently check the suggested patch. For an optimization, I would compare the same workload before and after and explain any extra memory or consistency cost.</p></blockquote>

      <ComprehensionExercises />

      <h2 id="exercise">Worked exercise: why does this cache miss or return stale data?</h2>
      <p>This optional example uses JavaScript, not Java. A <strong>cache</strong> is a place to keep a value temporarily so we can reuse it. Think of a lookup table: the key “zero” points to a small object with two fields. <code>value</code> is the stored answer; <code>expiresAt</code> is the time when we must stop using it. <strong>TTL</strong> means time to live: how long a value remains usable.</p>
      <p><strong>The rules:</strong> time is measured in milliseconds from one consistent clock. An entry with expiresAt = 1000 is usable at time 999 and expired at time 1000. A stored value of 0, false, an empty string or null is valid. The special result undefined means “no usable cached value.” Entries are correctly formed and do not change during a read.</p>
      <p><strong>JavaScript syntax:</strong> <code>cache.get(key)</code> looks up the entry; a missing key gives undefined. <code>entry.value</code> reads a field. <code>&amp;&amp;</code> checks the conditions from left to right and stops when one fails. In a condition, JavaScript treats 0, false, an empty string, null and undefined as false-like values. That conversion does not mean a cached zero is missing.</p>
      <p>The next block supplies concrete input. It is a setup example, not the cache implementation:</p>
      <pre tabIndex={0} aria-label="Cache example inputs"><code>{`const cache = new Map([
  ["zero", { value: 0, expiresAt: 1000 }],
  ["name", { value: "Ada", expiresAt: 1000 }],
]);

readCachedBuggy(cache, "zero", 999); // Should return 0
readCachedBuggy(cache, "name", 999); // Should return "Ada"
readCachedBuggy(cache, "name", 1000); // Should return undefined`}</code></pre>
      <h3>Read the function and trace each condition</h3>
      <pre tabIndex={0} aria-label="Buggy cache reader"><code>{COMPREHENSION_STARTER}</code></pre>
      <CourseSketch title="A cached zero is still a valid answer" story="We are reading the key zero at time 999, before its expiration at 1000." steps={[
        ['Lookup', 'The key exists: value is 0 and expiresAt is 1000.'],
        ['Starter condition', 'entry.value is 0, so JavaScript treats this condition as false.'],
        ['Wrong result', 'The function returns undefined even though zero is valid.'],
        ['Correct condition', 'Check that the entry exists and 999 < 1000, then return its value.'],
      ]} />
      <table tabIndex={0} aria-label="Cache expected versus actual results"><thead><tr><th scope="col">Read</th><th scope="col">Expected</th><th scope="col">Starter result</th><th scope="col">Reason</th></tr></thead><tbody>
        <tr><th scope="row">zero at 999</th><td>0</td><td>undefined</td><td>The value check rejects a valid zero.</td></tr>
        <tr><th scope="row">name at 999</th><td>“Ada”</td><td>“Ada”</td><td>The value is true-like and the time is before expiry.</td></tr>
        <tr><th scope="row">name at 1000</th><td>undefined</td><td>“Ada”</td><td>The inclusive time comparison accepts the exact expiration time.</td></tr>
      </tbody></table>
      <details className={styles.guideNotes}>
        <summary>Reveal the trace and minimal fix</summary>
        <p>The expected results are 0, “Ada”, undefined. The starter returns undefined, “Ada”, “Ada”. For zero, the value check treats a valid value as false and falls through. At the expiration boundary, the inclusive comparison still accepts an expired entry. These are independent defects: removing the value check does not fix expiration.</p>
        <pre tabIndex={0} aria-label="Corrected cache reader"><code>{COMPREHENSION_REFERENCE}</code></pre>
        <p>The entry object establishes presence; its value does not. The strict time comparison enforces expiration at the boundary. A missing key yields undefined from Map.get, so the entry guard protects access to expiresAt. See the primary <a href="https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map.prototype.get">ECMAScript Map.get contract</a> and <a href="https://tc39.es/ecma262/multipage/abstract-operations.html#sec-toboolean">boolean conversion rules</a>.</p>
        <p><strong>Verify:</strong> test a missing key, all four valid false-like values, a live ordinary value, one millisecond before expiration, exact expiration and after expiration. Check that reads do not delete or mutate entries. If undefined must become a valid cached value, return an explicit hit/miss result instead of overloading undefined.</p>
      </details>
        <h3>A worked interview explanation</h3>
        <blockquote><p>I found two failures against the stated contract. A cached zero is rejected because the condition tests its truth value, and an entry is returned at its expiration because the comparison includes equality. I would remove the value condition and use a strict less-than comparison. I would verify zero, false, an empty string and null before expiry, then check missing keys and the exact time boundary. This preserves the value-or-undefined interface. It does not clean up expired entries or coordinate concurrent loads, so those would need separate requirements and tests.</p></blockquote>


      <h2 id="ai-verification">How do I catch a plausible but incorrect AI patch?</h2>
      <p>In JavaScript, <code>x || undefined</code> returns undefined whenever x is false-like. <code>x ?? undefined</code> does so only for null or undefined. Neither expression checks expiration. Those operators are useful in other contracts, but the cache must preserve a stored null and enforce its deadline.</p>
      <p>The <code>?.</code> operator reads a field only when the object is present; otherwise it gives undefined. Suppose the assistant proposes replacing the condition with <code>entry?.value || undefined</code>. That still loses zero, false and empty strings, loses a cached null, and removes expiration checking entirely. Replacing || with ?? still loses null and does not restore expiration. A shorter expression is not evidence that the contract is preserved.</p>
      <p>When AI is allowed, try: “Given this contract and function, identify a minimal counterexample. State expected and actual results before proposing a patch. Preserve the return type and expiration rule.” Check every changed branch yourself and run tests you derived from the contract. If code cannot be executed in the interview, show the trace and label the result as reasoned rather than executed.</p>
      <details className={styles.guideNotes}>
        <summary>Deep dive: trade-offs and explained follow-ups</summary>
        <h3>Why not build a production cache immediately?</h3>
        <p>This patch restores two local rules without expanding the interface. Adding eviction, loading and locks now would increase the behavior to review. The model retains expired entries, so memory can grow with distinct keys; a real cache needs a capacity limit and an eviction policy. Reading does not copy mutable values, so ownership also needs a contract.</p>
        <h3>What changes with concurrent or asynchronous loading?</h3>
        <p>Two callers can both miss and start duplicate loads. Coalescing means sharing an in-flight load per key, but it introduces cancellation, failure cleanup and stale completion questions. An older load must not overwrite a newer invalidation or value. Test controlled completion order and failed-load cleanup; the synchronous model proves none of those guarantees.</p>
        <h3>What about clock changes and performance?</h3>
        <p>The exercise assumes a consistent clock. Backward wall-clock adjustments can extend apparent freshness; process-local duration tracking can use a monotonic clock, which advances independently of wall-clock corrections. Persisted or cross-process deadlines need an explicit clock model. This fix keeps one Map lookup and avoids a scan. Measure latency and memory on a stated workload before claiming a speedup; JavaScript Map does not promise a particular hash-table implementation. See <a href="https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map-objects">the Map specification</a> and <a href="https://w3c.github.io/hr-time/#monotonic-clock">High Resolution Time’s monotonic clock</a>.</p>
        <h3>Would you always use AI?</h3>
        <p>No. Follow the round’s explicit tool policy. Even with permission, a three-line trace can be faster and easier to verify than an assistant conversation. Use the assistant for bounded hypotheses, test ideas or unfamiliar API explanations, then check those claims against code and primary documentation.</p>
      </details>

      <h2 id="mock-round">A 60-minute practice round</h2>
      <p>This is a suggested practice schedule, not Google’s official timing. Start with the small exercise, then repeat with an unfamiliar small project or an open-source change you have not read before.</p>
      <ol>
        <li><strong>0–10 minutes:</strong> clarify the contract and draw the entry point, collaborators and state ownership.</li>
        <li><strong>10–25 minutes:</strong> trace one successful request and reproduce a failure with expected and actual results.</li>
        <li><strong>25–40 minutes:</strong> implement a minimal fix and check boundary and regression cases.</li>
        <li><strong>40–50 minutes:</strong> evaluate one improvement or AI suggestion; explain a counterexample and the trade-off.</li>
        <li><strong>50–60 minutes:</strong> give a concise walkthrough of the evidence, remaining risks and next verification step.</li>
      </ol>
      <p><strong>Self-review:</strong> can another person predict the output from your explanation, reproduce the defect, and see why your fix preserves the contract? Repeat once without AI to test independent comprehension, and once with an approved tool in a practice setting to test verification. This checklist is a learning aid, not Google’s scoring rubric.</p>
      <p><Link href="/scenarios/google-ai-code-comprehension-2026">Practice the existing AI-assisted interview scenario →</Link></p>
      <p><Link href="/senior-java-interview/part-9">Continue with Java coding practice →</Link></p>
    </article>
  </ReaderLayout>;
}
