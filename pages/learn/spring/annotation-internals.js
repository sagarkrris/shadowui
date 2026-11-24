import Link from 'next/link';
import { SPRING_ANNOTATION_LESSONS } from '../../../lib/springAnnotationLessons.mjs';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import styles from '../../../styles/Reader.module.css';

const transactionDocs = 'https://docs.spring.io/spring-framework/reference/7.0/data-access/transaction/declarative';

const callCases = [
  ['Nontransactional method calls this.inner()', 'No inner interceptor runs and no transaction begins. In the JDBC lab, the insert auto-commits before the exception.', 'One row survives.'],
  ['Another bean calls the managed inner() method', 'The call enters the proxy. REQUIRED opens a transaction when none exists. A runtime exception leaving the method requests rollback.', 'Zero rows survive.'],
  ['Proxied outer transaction calls this.inner() with REQUIRES_NEW', 'The existing outer transaction is still active, but the inner annotation is bypassed. Both JDBC operations use the outer resource.', 'The outer runtime failure rolls back the inner write.'],
  ['Proxied outer transaction calls a separate REQUIRES_NEW bean', 'Spring suspends the outer transaction and starts an independent one. The inner commit survives an outer rollback.', 'Only the independent row survives.'],
  ['Outer transaction catches a runtime exception from a separate REQUIRED bean', 'The inner interceptor has already marked the shared transaction rollback-only. When the outer scope tries to commit, it sees UnexpectedRollbackException.', 'Zero rows survive.'],
  ['Outer transaction catches the same error from this.inner()', 'No inner interceptor evaluates that exception. If neither the resource nor any other code marks rollback-only, the outer method can return and commit.', 'The inner row survives.'],
  ['A checked exception escapes a proxied method', 'Traditional defaults commit unless a rollback rule matches. Use a typed rollbackFor rule or assess the application-wide rollback policy.', 'The default row survives. The row written with rollbackFor does not.'],
];

const propagation = [
  ['REQUIRED', 'Join a current transaction or start one. A participating inner scope can mark the shared transaction rollback-only.'],
  ['REQUIRES_NEW', 'Suspend the current transaction and commit or roll back independently. Budget another connection for nested JDBC calls and check lock contention.'],
  ['NESTED', 'Create a savepoint inside a current transaction when the manager supports it. Rolling back an inner savepoint can let the outer work continue. An outer rollback still undoes everything.'],
  ['SUPPORTS / NOT_SUPPORTED', 'SUPPORTS can join an existing transaction. NOT_SUPPORTED suspends one and executes without a transaction.'],
  ['MANDATORY / NEVER', 'MANDATORY fails when a transaction is absent. NEVER fails when one is present. Both checks require interception.'],
];

export default function AnnotationInternals() {
  return <ReaderLayout title="Spring annotation internals"
    description="Trace transaction interception, same-class calls, rollback and other common Spring annotation mechanisms.">
    <nav aria-label="Spring courses"><Link href="/learn/spring/spring-framework#transactions">Spring Framework</Link>
      {' · '}<Link href="/learn/spring/spring-boot#auto-config">Spring Boot</Link>
      {' · '}<Link href="/learn/spring/capstone">Runnable labs</Link></nav>
    <h1>How Spring annotations work internally</h1>
    <p className={styles.lead}>Start by asking which Spring component reads the annotation, when it acts and whether the call reaches it. For <code>@Transactional</code>, the answer depends on the runtime call path.</p>
    <h2>From metadata to a database transaction</h2>
    <ol>
      <li><strong>Register the advice.</strong> Boot can enable transaction management when a suitable manager is present. In plain Spring the lab enables it explicitly with <code>@EnableTransactionManagement</code>. The infrastructure installs an advisor, which pairs a transaction method matcher with a <code>TransactionInterceptor</code>.</li>
      <li><strong>Wrap eligible beans.</strong> Spring’s auto-proxy infrastructure exposes an eligible bean through an interface-based or subclass proxy. The annotation provides attributes such as propagation, rollback rules and the optional transaction manager qualifier.</li>
      <li><strong>Call through the proxy.</strong> The interceptor looks up the method attributes and asks the selected transaction manager to join, open, suspend or reject a transaction. In the imperative JDBC lab the manager binds the connection to the thread, and <code>JdbcTemplate</code> participates using that connection.</li>
      <li><strong>Complete the boundary.</strong> The interceptor checks the return or exception and completes the transaction. A participating scope can request rollback without owning the physical commit. The manager releases or restores resources when it leaves the boundary.</li>
    </ol>
    <pre className={styles.code}><code>{`other bean → Spring proxy → TransactionInterceptor → target.inner()
                                                   ↳ JDBC connection in transaction

target.outer() → this.inner() → JDBC
                 ↳ direct call; any existing outer transaction still applies`}</code></pre>
    <p><a href={transactionDocs + '/tx-decl-explained.html'}>Spring reference for the interceptor and transaction manager</a></p>
    <h2 id="transaction-cases">Same-class calls and rollback evidence</h2>
    <p>Assume proxy mode, Spring JDBC, one data source and the default rollback rules. Each test creates a fresh H2 database and reads committed rows after the call. There is no enclosing test transaction.</p>
    <ol>{callCases.map(([trigger, mechanism, result]) => <li key={trigger}><strong>{trigger}</strong><p>{mechanism}</p><p>{result}</p></li>)}</ol>
    <p>Run <code>mvn -Dtest=TransactionBoundaryTest test</code> from the <Link href="/learn/spring/capstone">lab project</Link>. Compare the first two test methods, one for the same-class call and one for the external call. The lab asserts transaction state inside the method and reads the persisted rows independently.</p>
    <h2>Propagation choices</h2>
    <dl>{propagation.map(([name, behavior]) => <div key={name}><dt><code>{name}</code></dt><dd>{behavior}</dd></div>)}</dl>
    <p><a href={transactionDocs + '/tx-propagation.html'}>Spring reference for propagation and rollback-only behavior</a></p>
    <h2>Edge cases to check before changing code</h2>
    <ul>
      <li><strong>Method eligibility.</strong> Interface proxies advise calls to public methods exposed on the proxied interface. Class proxies can advise eligible protected and package-visible methods in current Spring versions, but cannot override private, static or final methods. A final implementation method can still be invoked through an interface proxy. A manually constructed object bypasses proxy advice.</li>
      <li><strong>Initialization.</strong> Avoid depending on proxy advice during a constructor or initialization callback such as <code>@PostConstruct</code>. Run transactional startup work through an initialized collaborator.</li>
      <li><strong>Exception boundaries.</strong> An escaping <code>RuntimeException</code> or <code>Error</code> normally triggers rollback. Checked exceptions need a matching rule under traditional defaults. Spring 6.2 and later allow a global all-exceptions policy. A caught exception may still leave the resource or transaction marked rollback-only. A database error can also surface only at flush or commit.</li>
      <li><strong>Future and worker threads.</strong> A new thread does not inherit an imperative transaction. A <code>Future</code> already completed exceptionally when returned can trigger rollback in supported Spring versions. A failure that happens later cannot undo a commit. Start any necessary transaction on the worker side and verify advice ordering when combining annotations.</li>
      <li><strong>Reactive execution.</strong> With a reactive manager, participating operations must run in the same reactive pipeline and Reactor context. An imperative thread-bound JDBC transaction follows different rules. Verify the selected manager and resource, especially when reactive and imperative beans coexist.</li>
      <li><strong>Multiple managers and remote work.</strong> Qualify the manager when several are available, and check which resources it owns. A local transaction cannot roll back an HTTP call or an independently committed database write.</li>
      <li><strong>Isolation, timeout and read-only hints.</strong> Joining a transaction normally uses the outer settings. A manager can be configured to reject incompatible existing settings. Read-only handling varies by manager and database. Use measured behavior and actual permissions to enforce restrictions.</li>
      <li><strong>Fix the call path.</strong> Extract a collaborator when the inner operation owns a separate boundary. Put the boundary on the outer method if the whole use case should commit together. Use <code>TransactionTemplate</code> when explicit local boundaries improve clarity. AspectJ weaving can advise self-invocations, with a different build and runtime setup.</li>
    </ul>
    <p><a href={transactionDocs + '/annotations.html'}>Annotation settings and method visibility</a>
      {' · '}<a href={transactionDocs + '/rolling-back.html'}>Rollback rules</a></p>
    <h2>Interview answer</h2>
    <blockquote><p>Spring uses transaction metadata to advise calls that cross a managed proxy. For JDBC, the transaction manager binds a connection for the scope, and the interceptor decides how to complete it. A same-class call still executes the Java method, but it bypasses the inner advice. With no transaction, the work may auto-commit. With an existing transaction, the inner work can participate and its declared REQUIRES_NEW or rollback rule never runs. I verify this by forcing a failure and checking the committed rows from outside the call.</p></blockquote>
    <details><summary>Follow-up: Why did the caller get UnexpectedRollbackException after catching the error?</summary>
      <p>A separate REQUIRED method shared the outer physical transaction. Its interceptor saw the failure and marked the transaction rollback-only before returning control. The outer code caught the original exception, but it could not turn the rollback-only transaction into a successful commit.</p>
    </details>
    <h2>Annotation-by-annotation guide</h2>
    <nav aria-label="Annotation topics"><ul>{SPRING_ANNOTATION_LESSONS.map(item =>
      <li key={item.id}><a href={`#${item.id}`}>{item.title}</a></li>)}</ul></nav>
    {SPRING_ANNOTATION_LESSONS.map(item => <section key={item.id} className={styles.card} aria-labelledby={item.id}>
      <h3 id={item.id}>{item.title}</h3>
      <p>{item.mechanism}</p>
      <h4>Worked example</h4><p>{item.example}</p>
      <h4>Interview answer</h4><blockquote><p>{item.answer}</p></blockquote>
      <details><summary>Edge cases, verification and follow-up</summary>
        <p>{item.edge}</p><p><strong>How to verify.</strong> {item.verify}</p><p>{item.followUp}</p>
      </details>
      <p><a href={item.source}>Spring reference</a></p>
    </section>)}
    <p>Continue with the <Link href="/senior-java-interview/topics/spring-framework#spring-framework-101">Framework annotation questions</Link> and the <Link href="/senior-java-interview/topics/spring-boot#spring-boot-101">Boot annotation questions</Link>.</p>
  </ReaderLayout>;
}
