import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReaderLayout from "../components/reader/ReaderLayout";
import { EDITORIAL_PROMISE, READER_ARTICLES, READING_SERIES } from "../lib/readerEditorial.mjs";
import { DETECTIVE_CASES } from "../lib/productionDetective.mjs";
import styles from "../styles/Reader.module.css";
export default function Explore({ catalogue, series, incidents, promise }) {
  const router = useRouter();
  useEffect(() => {
    if (router.isReady && typeof router.query.workspace === "string") {
      router.replace({ pathname: "/practice", query: router.query });
    }
  }, [router]);
  const [query, setQuery] = useState("");
  const articles = catalogue.filter(article => `${article.title} ${article.description} ${article.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <ReaderLayout title="Explore the learning library" description={promise}><section className={styles.hero}><p className={styles.eyebrow}>WORKING IDEAS FOR WORKING ENGINEERS</p><h1>{promise}</h1><p className={styles.lead}>Read a clear explanation. Follow the evidence in a production mystery. Test the idea, then take it back to your own code.</p><div className={styles.actions}><Link prefetch={false} className={styles.button} href="/java/hashmap-internals">Start with HashMap →</Link><Link prefetch={false} href="/detective">Investigate a five-minute case</Link><Link prefetch={false} href="/practice">Resume unfinished practice</Link></div><p className={styles.small}>Browse without an account. Sources, verification limits, and public corrections accompany the work.</p></section><section className={styles.card}><p className={styles.eyebrow}>ENGINEERING SYMPTOMS ATLAS</p><h2>Something is slow, stuck, or happening twice.</h2><p>Start with one of ten Java/Spring symptoms. Follow the evidence into a lesson, scenario, and practice exercise.</p><Link prefetch={false} href="/symptoms">Search engineering symptoms →</Link></section><section aria-labelledby="article-list"><h2 id="article-list">Find your next explanation</h2><label>Search articles<input type="search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Try transactions, SQL, or memory" /></label><p role="status" className={styles.small}>{articles.length} articles</p><div className={styles.grid}>{articles.map(article => <article className={styles.card} key={article.href}><p className={styles.eyebrow}>{article.category} · {article.minutes} min read</p><h3><Link prefetch={false} href={article.href}>{article.title}</Link></h3><p>{article.description}</p></article>)}</div></section><section className={styles.card}><p className={styles.eyebrow}>BUILD A TINY SYSTEM</p><h2>Understand dependency injection by building it.</h2><p>Four Java chapters. A new requirement breaks each design, and runnable tests guide the next version.</p><Link prefetch={false} href="/build/java-dependency-injection">Build a small Java container →</Link></section><section className={styles.card}><p className={styles.eyebrow}>ENGINEERING TIME MACHINE</p><h2>What changes when your constraints change?</h2><p>Revisit a database decision through traffic growth, regional failure, and deletion requirements.</p><Link prefetch={false} href="/time-machine/database-decisions">Explore the database time machine →</Link></section><section><h2>Learn in a useful order</h2><div className={styles.grid}>{series.map(series => <article className={styles.card} key={series.slug}><h3><Link prefetch={false} href={`/series/${series.slug}`}>{series.title}</Link></h3><p>{series.description}</p><p className={styles.small}>{series.items.length} connected articles and challenges</p></article>)}</div></section><section><h2>Take the on-call chair</h2><div className={styles.grid}>{incidents.map(incident => <article className={styles.card} key={incident.slug}><p className={styles.eyebrow}>PRODUCTION DETECTIVE · 5 MINUTES</p><h3><Link prefetch={false} href={`/detective/${incident.slug}`}>{incident.title}</Link></h3><p>{incident.description}</p></article>)}</div></section><section className={styles.card}><h2>A small, useful digest</h2><p>One explanation, one challenge, and one practical takeaway. Read the first issue before deciding whether to subscribe.</p><Link prefetch={false} href="/digest">Preview the digest →</Link></section></ReaderLayout>;
}
// Public content is generated once per build; legacy links redirect in config.
export function getStaticProps() {
  return { props: {
    promise: EDITORIAL_PROMISE,
    catalogue: READER_ARTICLES,
    series: READING_SERIES,
    incidents: DETECTIVE_CASES.slice(0, 3).map(({ slug, title, description }) => ({ slug, title, description })),
  } };
}
