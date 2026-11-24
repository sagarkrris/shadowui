import Link from 'next/link';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import styles from '../../../styles/Reader.module.css';

const files = [
  'pom.xml',
  'src/main/resources/application.properties',
  'src/main/resources/logback.xml',
  ...['Application', 'OrderPolicy', 'LabConfiguration', 'Reservation', 'ReservationRepository', 'OrderService', 'OrderController']
    .map(name => `src/main/java/learning/micronaut/${name}.java`),
  ...['OrderPolicyTest', 'FrameworkMechanicsTest', 'OrderControllerTest']
    .map(name => `src/test/java/learning/micronaut/${name}.java`),
];

const requests = `curl -i http://127.0.0.1:8080/orders \\
  -H 'Content-Type: application/json' \\
  -d '{"sku":"NOTEBOOK","quantity":3}'

# Replace ORDER_ID with the id from the 201 response.
curl -i http://127.0.0.1:8080/orders/ORDER_ID

# Repeat the first POST. Only two units are left, so it returns 409.`;

export default function MicronautCapstone() {
  return <ReaderLayout title="Micronaut capstone: Build an order reservation API"
    description="Run a Java Micronaut service and verify validation, generated interception, executor placement and transaction rollback.">
    <p><Link href="/learn/micronaut">Java and Micronaut course</Link></p>
    <h1>Build and verify a Micronaut reservation API</h1>
    <p className={styles.lead}>Reserve inventory and store the order in one transaction. Follow the request from JSON and generated routing through the blocking executor and repository to the committed row.</p>
    <h2>Set up the reference project</h2>
    <p>Use Java 21 and Maven 3.9. Copy <code>public/micronaut-lab</code> from the checkout into a separate working folder or download the files below, preserving their paths. The first Maven run needs access to Maven Central.</p>
    <details><summary>Download project files</summary><ul>
      {files.map(file => <li key={file}><a href={`/micronaut-lab/${file}`} download>{file}</a></li>)}
    </ul></details>
    <h2>Run the lab checkpoints</h2>
    <ol>
      <li>Run <code>mvn -Dtest=OrderPolicyTest test</code> to prove Java record and quantity boundaries before involving the container.</li>
      <li>Run <code>mvn -Dtest=FrameworkMechanicsTest test</code> to inspect generated constructor metadata, select conditional beans, and check eligible same-class advice.</li>
      <li>Run <code>mvn -Dtest=OrderControllerTest test</code> for real JSON requests, transaction rollback, and competing reservations. Trace one request across the route, executor and repository.</li>
    </ol>
    <h2>Start the API and inspect its responses</h2>
    <pre className={styles.code}><code>{'mvn clean test\nORDERS_CLOCK=fixed mvn compile exec:java'}</code></pre>
    <p>The app listens on loopback and starts with five notebooks. Run these commands from a second terminal. Restart the service to reset its in-memory database.</p>
    <pre className={styles.code}><code>{requests}</code></pre>
    <h2>Acceptance criteria</h2>
    <ul>
      <li>Missing or malformed input returns 400. A configured policy limit also returns 400 with <code>quantity_limit</code>.</li>
      <li>Two competing requests for three units yield one 201, one 409, one committed reservation and two units remaining.</li>
      <li>A write that fails after the stock update leaves the original inventory and no reservation.</li>
      <li>The completed reservation can be found through the GET route, while an unknown identifier yields 404.</li>
      <li>Configuration selects the intended bean, and JDBC work executes on the named executor in the HTTP test.</li>
    </ul>
    <h2>Experienced extension</h2>
    <p>Add a durable operation key to protect a retry after a lost response. Store it with the reservation, reject the same key with a different payload, and prove that two simultaneous duplicates consume stock only once. Then replace the H2 fixture with migrations on your target database and repeat rollback, contention and failure tests.</p>
    <p>The reference service uses loopback HTTP, a JVM, and local H2. A deployed version needs an explicit authentication and authorization contract, controlled traffic admission, a migration policy and verification against its own database.</p>
  </ReaderLayout>;
}
