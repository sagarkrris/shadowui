import Link from 'next/link';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import styles from '../../../styles/Reader.module.css';

const files = [
  'pom.xml',
  ...['LabDatabase', 'PurchaseOrder', 'OrderLine', 'OrderCatalog', 'OrderCatalogDemo']
    .map(name => `src/main/java/learning/hibernate/${name}.java`),
  ...['PurchaseOrderTest', 'OrderCatalogTest']
    .map(name => `src/test/java/learning/hibernate/${name}.java`),
];

export default function HibernateCapstone() {
  return <ReaderLayout title="Hibernate capstone: Build an order catalog"
    description="Build a runnable Hibernate order catalog and verify its SQL, pagination and update conflicts.">
    <p><Link href="/learn/hibernate">Hibernate course</Link></p>
    <h1>Build and verify a Hibernate order catalog</h1>
    <p className={styles.lead}>Persist orders with line items, read a page without N+1, and reject a stale update. Trace each command from the catalog through Hibernate to the database, then verify what a fresh Session sees.</p>
    <h2>Set up the reference project</h2>
    <p>Use Java 21 and Maven 3.9. Copy <code>public/hibernate-lab</code> from a checkout into a separate working folder, or download the files below and reproduce the displayed paths. Maven needs access to Maven Central on its first run.</p>
    <details><summary>Download project files</summary><ul>
      {files.map(file => <li key={file}><a href={`/hibernate-lab/${file}`} download>{file}</a></li>)}
    </ul></details>
    <pre className={styles.code}><code>{'mvn test\nmvn compile exec:java'}</code></pre>
    <p>The CLI builds a fresh in-memory schema, creates orders, prints a page, renames an order, rejects a stale rename, and reads the committed page back. Expect <code>Page statements: 2</code> and <code>Stale update rejected</code>. IDs and diagnostic output can vary.</p>
    <h2>Build the catalog in checkpoints</h2>
    <ol>
      <li><strong>Map and persist.</strong> In a working copy, start with the bootstrap and order mapping. Add OrderLine and set its owning foreign key when adding a line to an order. Run the cascade and orphan test and inspect the stored foreign key.</li>
      <li><strong>Observe Session boundaries.</strong> Use <code>mvn -Dtest=PurchaseOrderTest test</code> to distinguish a managed object from a detached edit. Flush before a rollback, then verify the row from a new Session. Compare that with the bulk update, which leaves the current managed object stale until refreshed.</li>
      <li><strong>Replace N+1 without changing results.</strong> Start with a root query and access each collection. Use the test fixture of three roots to observe four statements. Then page IDs and fetch lines for just those IDs. Retain the empty root and restore ID order before mapping DTOs.</li>
      <li><strong>Protect the write.</strong> Load a versioned order in two Sessions. Commit one, then flush the other and prove its stale update fails. Carry the originally seen version into a later catalog command too.</li>
    </ol>
    <h2>Acceptance criteria</h2>
    <ul>
      <li>The creation transaction saves one order and the intended line rows. Removing an orphan deletes that line only.</li>
      <li>The nonempty page uses two prepared statements, preserves root order and includes orders with no lines. An empty page needs one statement.</li>
      <li>The fail-fast setting rejects a paged collection fetch join, and a detached lazy collection fails outside its Session.</li>
      <li>Flush followed by rollback leaves the old label. The stale writer and the stale command both leave the winner’s label intact.</li>
      <li>Invalid input and a missing order produce explicit errors, while DTOs can be read outside the Session.</li>
    </ul>
    <h2>Extend the capstone for a production database</h2>
    <p>The lab uses Hibernate ORM 6.6.59.Final and H2 with test schema generation. For an extension, use the supported Hibernate patch and intended database and driver, replace generated DDL with migrations, and configure a production connection pool. Test the lock timeout and read consistency used by your deployment. Measure rows and query plans alongside statement counts.</p>
    <p>For a stronger paging contract, decide whether a deleted order may shorten a page and what a late commit means for a cursor. Write a failing test first, then choose snapshot isolation or a different read design based on the contract.</p>
  </ReaderLayout>;
}
