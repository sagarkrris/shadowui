import Link from 'next/link';
import ReaderLayout from '../../../components/reader/ReaderLayout';
import styles from '../../../styles/Reader.module.css';

const files = [
  'verify.sh',
  'sample/collections.txt', 'sample/runtime.txt',
  ...['Indexer', 'SearchIndex', 'FileIndexer', 'IndexSnapshot'].map(name => `src/main/java/learning/javaindex/${name}.java`),
  ...['LanguageLab', 'ConcurrencyLab', 'IndexerChecks', 'JvmLab'].map(name => `src/test/java/learning/javaindex/${name}.java`),
];

const commands = `sh verify.sh

mkdir -p out
javac --release 21 -d out src/main/java/learning/javaindex/*.java
jar --create --file indexer.jar --main-class learning.javaindex.Indexer -C out .

java -jar indexer.jar build sample search.jidx 2
java -jar indexer.jar search search.jidx "java maps"`;

const diagnostics = `java -XX:StartFlightRecording=filename=build.jfr,settings=profile,dumponexit=true \\
  -jar indexer.jar build sample search.jidx 2
jfr summary build.jfr
jfr print --events learning.javaindex.Build build.jfr
javap -classpath out -c -p learning.javaindex.Indexer`;

export default function JavaIndexerCapstone() {
  return <ReaderLayout title="Java capstone: Searchable file indexer"
    description="Build, package and diagnose a framework-free Java application that indexes local text files.">
    <p><Link href="/learn/java">Core and Advanced Java course</Link></p>
    <h1>Build a searchable file indexer in Java</h1>
    <p className={styles.lead}>Turn local text files into a persisted index, search it from a second JVM, and inspect a real recording of the build.</p>
    <h2>Set up the reference project</h2>
    <p>Use a full JDK 21 or later. Copy <code>public/java-indexer-lab</code> to a separate working directory, or download the files and preserve their paths. The project uses JDK tools and a POSIX shell, and can run offline.</p>
    <details><summary>Download project files</summary><ul>
      {files.map(file => <li key={file}><a href={`/java-indexer-lab/${file}`} download>{file}</a></li>)}
    </ul></details>
    <h2>Build it in checkpoints</h2>
    <ol>
      <li><strong>Start in memory.</strong> Use the <Link href="/build/inverted-index">inverted-index starter</Link> to index words into sets, then implement all-terms matching. Compare with <code>SearchIndex.java</code> for Unicode normalization and stable ordering.</li>
      <li><strong>Read actual files.</strong> Add a strict UTF-8 reader, ignore symbolic links in a stable local tree, and bound reads. Use <code>LanguageLab</code> to understand cleanup and <code>IndexerChecks</code> to stop malformed or oversized files from publishing a revision.</li>
      <li><strong>Parallelize and publish.</strong> Keep the coordinator as the only writer to the builder. Bound outstanding tasks, react to interruption, then write a versioned, checksummed snapshot and publish it atomically. Compare a serial build and a parallel build byte for byte.</li>
      <li><strong>Package and diagnose.</strong> Build the executable JAR, search from a fresh process, then capture JFR while building the same index. Use <code>JvmLab</code> to verify a recorded build event and deferred class initialization.</li>
    </ol>
    <h2>Run the reference and search</h2>
    <pre className={styles.code}><code>{commands}</code></pre>
    <p>Expect <code>Indexed 2 files</code> and then <code>collections.txt</code>. A query for <code>java threads</code> returns both paths in sorted order. A query for <code>missing</code> returns no lines.</p>
    <h2>Observe the JVM</h2>
    <pre className={styles.code}><code>{diagnostics}</code></pre>
    <p>Find a <code>learning.javaindex.Build</code> event with two files, two workers and <code>published = true</code>. The small sample verifies instrumentation. Compare larger runs under the same settings before drawing performance conclusions.</p>
    <h2>Acceptance criteria</h2>
    <ul>
      <li>Case and decomposed accents normalize consistently. Duplicates, unknown terms, and empty input have explicit results.</li>
      <li>Serial and parallel builds publish identical bytes. A rebuild drops deleted and changed terms.</li>
      <li>A malformed file, an oversized file or an interrupted build leaves the previous snapshot readable.</li>
      <li>A truncated or checksum-damaged snapshot is rejected. The packaged CLI builds and searches in separate JVMs.</li>
      <li>The language, concurrency and JVM labs prove the edge cases with executable assertions.</li>
    </ul>
    <h2>Scope and experienced extension</h2>
    <p>The indexed root is a trusted, stable local directory. The indexer handles up to 1,000 text files, 1 MiB per file and 100,000 document-term postings. It assumes one writer and a filesystem that supports atomic replacement. The checksum detects accidental damage. Power-loss durability and live consistency while files change need additional design.</p>
    <p>Extend the indexer with incremental updates or a larger bounded workload. For updates, design a persistent record of each document’s old terms and a policy for deleted files. For performance, compare one and four workers, inspect allocation or waiting in JFR, and report any trade-off on the same machine and input.</p>
  </ReaderLayout>;
}
