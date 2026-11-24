import Link from 'next/link';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import { SPRING_COURSES, springCourseHref } from '../../../lib/springCourses.mjs';
import styles from '../../../styles/Reader.module.css';

const root = '/spring-labs';
const projectFiles = [
  'pom.xml',
  ...['OrdersApplication', 'OrderPolicy', 'OrderService', 'OrderStore', 'OrderController', 'OrderSecurity']
    .map(name => `src/main/java/learning/orders/${name}.java`),
  'src/main/java/learning/defaults/OrderClockAutoConfiguration.java',
  'src/main/resources/application.properties',
  'src/main/resources/schema.sql',
  'src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports',
  ...['OrderServiceTest', 'OrdersApplicationTest', 'OrderClockAutoConfigurationTest', 'TransactionBoundaryTest', 'AnnotationExecutionTest']
    .map(name => `src/test/java/learning/orders/${name}.java`),
];

const requestCommands = `curl -fsS http://127.0.0.1:8080/actuator/health
cookies=$(mktemp)
curl -fsS -u learner -c "$cookies" http://127.0.0.1:8080/csrf
# Copy the token field from the JSON response below.
curl -i -u learner -b "$cookies" \\
  -H "X-CSRF-TOKEN: REPLACE_WITH_TOKEN" \\
  -H 'Content-Type: application/json' \\
  -d '{"sku":"NOTEBOOK","quantity":3}' http://127.0.0.1:8080/orders
rm -f "$cookies"`;

export default function SpringCapstone() {
  return <ReaderLayout title="Spring capstone: Build and verify an order API"
    description="Run and verify a Spring Boot order API from HTTP through security, transactions and persistence.">
    <p><Link href="/learn#courses">Learning catalog</Link></p>
    <h1>Build and verify an order API</h1>
    <p className={styles.lead}>Reserve stock and create an order in one transaction. Prove that invalid, unauthorized and concurrent requests preserve the inventory.</p>
    <h2>Set up the reference project</h2>
    <p>Install Java 21 and Maven 3.6.3 or later. From a checkout, copy <code>public/spring-labs</code> into a separate working folder and enter it. You can also download the files below into an empty folder using the displayed paths. Maven needs access to Maven Central on the first run.</p>
    <p>The project uses Boot 4.0.0 for reproducible local exercises. Use a maintained patch and test the target deployment database before adapting it for a deployed service. H2 starts with fresh stock on each run.</p>
    <details><summary>Download project files</summary><ul>
      {projectFiles.map(file => <li key={file}><a href={`${root}/${file}`} download>{file}</a></li>)}
    </ul></details>
    <h2>Run the checkpoints</h2>
    <ol>
      <li><strong>Container wiring.</strong> Run <code>mvn -Dtest=OrderServiceTest test</code>. Find the constructor dependencies and the fixed clock. Remove a dependency registration, diagnose the startup failure, then restore it.</li>
      <li><strong>Transaction annotation.</strong> Run <code>mvn -Dtest=TransactionBoundaryTest test</code> to compare internal and external calls against the same database. <Link href="/learn/spring/annotation-internals">Read the call paths and expected outcomes</Link>.</li>
      <li><strong>Async and caching annotations.</strong> Run <code>mvn -Dtest=AnnotationExecutionTest test</code>. Compare the worker thread names and target invocation counts when calls cross the proxy and when they stay within the class.</li>
      <li><strong>Conditional default.</strong> Run <code>mvn -Dtest=OrderClockAutoConfigurationTest test</code>. Explain why supplying a fixed clock prevents the default from appearing.</li>
      <li><strong>HTTP and database.</strong> Run <code>mvn -Dtest=OrdersApplicationTest test</code>. Explain why reading the stock outside the failing service call detects whether rollback worked.</li>
    </ol>
    <h2>Package and exercise the API</h2>
    <p>Set a throwaway local password before running the jar. Leave the app running in one terminal. The server binds to loopback.</p>
    <pre className={styles.code}><code>{`mvn clean package
LAB_PASSWORD=local-training-only java -jar target/spring-orders-1.0.0.jar`}</code></pre>
    <p>In another terminal, run the following commands and enter the lab password when prompted. After copying the token, repeat the POST before deleting the cookie file and compare both status codes.</p>
    <pre className={styles.code}><code>{requestCommands}</code></pre>
    <p>The first request to reserve three notebooks should return 201 and the second should return 409. Try quantity zero for 400, omit the CSRF header for 403, and request the token without credentials for 401. Restart the application to reset the fixture.</p>
    <h2>Capstone acceptance criteria</h2>
    <ul>
      <li>The packaged jar starts, exposes health, and rejects an invalid quantity limit at startup.</li>
      <li>A valid authorized request creates exactly one order and decrements stock by the requested quantity.</li>
      <li>Two concurrent requests for three units from stock of five yield one order and two remaining units.</li>
      <li>A database failure after reservation leaves the original stock and no order.</li>
      <li>The learner can explain what H2 verifies and outline how to repeat the data and rollout checks with a deployment database.</li>
    </ul>
    <h2>Experienced extension</h2>
    <p>Design an operation key for retries after ambiguous timeouts. Scope it to the caller, define what happens when the same key arrives with a different payload, and store the successful result with the order. Add a test that sends concurrent duplicates and checks that only one reservation survives. This is an extension to implement after the reference lab.</p>
    <ul>{SPRING_COURSES.map(course => <li key={course.id}><Link href={springCourseHref(course.id)}>{course.title}</Link></li>)}</ul>
  </ReaderLayout>;
}
