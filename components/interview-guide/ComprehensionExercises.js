import CourseSketch from '../course/CourseSketch';
import { JAVA_COMPREHENSION_EXERCISES } from '../../lib/codeComprehensionExercises.mjs';
import styles from '../../styles/Reader.module.css';

export default function ComprehensionExercises() {
  return <section aria-labelledby="java-comprehension-title">
    <h2 id="java-comprehension-title">Eight Java exercises: start small, then follow a service</h2>
    <p>Start at question 1 if reading code is new to you. Questions 1–3 teach the basic vocabulary; 4–5 introduce collections and numeric boundaries; 6–8 follow state and failures across calls. These are original practice questions, not reported Google questions.</p>
    <p>Each starter or corrected block is a complete <strong>Java 17</strong> class. Save one block at a time as <code>Exercise.java</code> and compile it with <code>javac --release 17 Exercise.java</code>. It has no main method. To try it interactively, start a fresh <code>jshell</code> session, enter <code>/open Exercise.java</code>, then enter the sample statements shown for that question. An exception in the starter is an expected observation; you can enter the next statement afterwards. Exit with <code>/exit</code>. Compilation alone does not prove an answer correct.</p>
    <h3>A quick guide to the Java syntax</h3>
    <ul>
      <li><code>public class Exercise</code> is the container for the example. A <strong>method</strong> is a named piece of code inside it.</li>
      <li><code>public static</code> lets us call a method as <code>Exercise.sum(...)</code>, without creating an Exercise object. The values in parentheses are its inputs.</li>
      <li><code>int</code> is a fixed-range whole-number type; <code>boolean</code> is true or false; <code>String</code> holds text. <code>return</code> supplies the method’s result.</li>
      <li><code>new</code> creates an object or array. <code>null</code> means a reference has no object. <code>Objects.requireNonNull</code> rejects a missing object immediately.</li>
      <li><code>var</code> asks Java to infer a local variable’s type from its initial value. The variable still has a fixed type.</li>
      <li><code>List&lt;Integer&gt;</code> means a list of integer objects. <code>Map&lt;String, Event&gt;</code> means a lookup table from text keys to Event values.</li>
      <li><code>() -&gt; ...</code> supplies a small task, called a lambda. Later examples call that task to simulate work that can succeed or fail.</li>
    </ul>
    <p>For each question: read the requirement, predict what the starter does, follow the trace, then compare the corrected code. A trace table records values after each important step. The diagram is a reading aid for the stated example, not a running application.</p>
    <nav aria-label="Java comprehension exercise questions"><ol>
      {JAVA_COMPREHENSION_EXERCISES.map((lesson, index) => <li key={lesson.id}><a href={`#${lesson.id}`}>Question {index + 1}: {lesson.title}</a> — {lesson.level}</li>)}
    </ol></nav>
    {JAVA_COMPREHENSION_EXERCISES.map((lesson, index) => <section key={lesson.id} data-comprehension-exercise={lesson.id} aria-labelledby={lesson.id}>
      <h2 id={lesson.id}>Question {index + 1}: {lesson.title}</h2>
      <p className={styles.eyebrow}>{lesson.level} · Java {lesson.javaRelease}</p>
      <p><a href={`#${lesson.id}`} aria-label={`Bookmark question ${index + 1}`}>Link to this question</a></p>
      <p><strong>What you will learn:</strong> {lesson.goal}</p>
      <h3>The task, in plain language</h3><p>{lesson.question}</p>
      <p><strong>Rules and assumptions:</strong> {lesson.contract}</p>
      <h3>Words and syntax you need</h3>
      <dl>{lesson.vocabulary.map(([word, definition]) => <div key={word}><dt><strong>{word}</strong></dt><dd>{definition}</dd></div>)}</dl>
      <h3>Read the starter code</h3>
      <pre tabIndex={0} aria-label={`Question ${index + 1} starter code`}><code>{lesson.starter}</code></pre>
      <p><strong>Try these sample statements in JShell after loading the starter:</strong></p>
      <pre tabIndex={0} aria-label={`Question ${index + 1} sample calls`}><code>{lesson.sample}</code></pre>
      <p><strong>Expected behavior:</strong> {lesson.expected}</p>
      <p><strong>What the starter actually does:</strong> {lesson.actual}</p>
      <h3>Understand the code, one step at a time</h3>
      <ol>{lesson.explanation.map(step => <li key={step}>{step}</li>)}</ol>
      <CourseSketch title={lesson.title} story="Follow this example from its input through the faulty decision to the corrected behavior." steps={lesson.flow} />
      <h3>Trace the example by hand</h3>
      <table tabIndex={0} aria-label={`Question ${index + 1} execution trace`}><thead><tr><th scope="col">Step</th><th scope="col">What happens</th><th scope="col">State or result</th></tr></thead><tbody>{lesson.trace.map(([step, action, result]) => <tr key={step}><th scope="row">{step}</th><td>{action}</td><td>{result}</td></tr>)}</tbody></table>
      <h3>The fix and why it works</h3><p>{lesson.fix}</p>
      <details className={styles.guideNotes}>
        <summary>Show corrected Java code for question {index + 1}</summary>
        <pre tabIndex={0} aria-label={`Question ${index + 1} corrected code`}><code>{lesson.reference}</code></pre>
      </details>
      <h3>A complete interview answer you can say aloud</h3><blockquote><p>{lesson.spoken}</p></blockquote>
      <h3>How to verify the answer</h3><ul>{lesson.tests.map(check => <li key={check}>{check}</li>)}</ul>
      <details className={styles.guideNotes}>
        <summary>Trade-offs and explained follow-up for question {index + 1}</summary>
        <h4>Mechanism, costs and limits</h4><p>{lesson.deepDive}</p>
        <h4>{lesson.followUp[0]}</h4><p>{lesson.followUp[1]}</p>
        <h4>A plausible AI suggestion to challenge</h4><p>{lesson.aiTrap}</p>
      </details>
      <p><strong>Primary references:</strong> {lesson.sources.map(([title, href], sourceIndex) => <span key={href}>{sourceIndex > 0 && ' · '}<a href={href}>{title}</a></span>)}</p>
      <p><a href="#java-comprehension-title">Back to the exercise list</a>{index < JAVA_COMPREHENSION_EXERCISES.length - 1 && <> · <a href={`#${JAVA_COMPREHENSION_EXERCISES[index + 1].id}`}>Next question →</a></>}</p>
    </section>)}
  </section>;
}
