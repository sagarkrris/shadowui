import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { TINY_SYSTEMS } from '../../lib/tinySystems.mjs';
import styles from '../../styles/Reader.module.css';

export default function BuildIndex({ projects }) {
  return <ReaderLayout title="Build a tiny system" description="Understand engineering mechanisms by implementing small Java systems with runnable tests.">
    <p className={styles.eyebrow}>BUILD · TEST · EXPLAIN</p><h1>Build a tiny version of the real thing.</h1>
    <p>Each chapter adds a requirement, exposes the previous design’s limitation, and provides runnable tests. Download your Java and run it locally. No account required.</p>
    <div className={styles.grid}>
      <article className={styles.card}><h2><Link href="/build/java-dependency-injection">Dependency-injection container</Link></h2><p>Construct dependencies, preserve identity, and detect cycles. Four chapters · about 45 minutes.</p></article>
      {projects.map(project => <article key={project.slug} className={styles.card}><h2><Link prefetch={false} href={`/build/${project.slug}`}>{project.title}</Link></h2><p>{project.description}</p><p>Three chapters · about {project.minutes} minutes · Java 8+</p></article>)}
    </div><p>Prerequisites: Java methods, collections, and exceptions. Every model states where it falls short of production needs.</p>
  </ReaderLayout>;
}
export function getStaticProps() { return { props: { projects: TINY_SYSTEMS.map(({ slug, title, minutes, description }) => ({ slug, title, minutes, description })) } }; }
