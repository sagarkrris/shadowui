import { useRouter } from "next/router";
import Link from "next/link";
import { useEffect, useState } from "react";
import ReaderLayout from "../components/reader/ReaderLayout";
import ContinueLearning from "../components/reader/ContinueLearning";
import { EDITORIAL_PROMISE, READER_ARTICLES } from "../lib/readerEditorial.mjs";
import styles from "../styles/Reader.module.css";
export default function ReadingHome({ catalogue, promise }) {
  const router = useRouter();
  useEffect(() => { if (router.isReady && typeof router.query.workspace === "string") router.replace({ pathname: "/practice", query: router.query }); }, [router]);
  const [query, setQuery] = useState("");
  const articles = catalogue.filter(article => `${article.title} ${article.description} ${article.category}`.toLowerCase().includes(query.toLowerCase().trim()));
  return <ReaderLayout title="Java & backend field notes" description={promise}>
    <section className={styles.hero}><p className={styles.eyebrow}>INVESTIGATE · BUILD · EXPLAIN</p><h1>{promise}</h1><p className={styles.lead}>Understand backend engineering by investigating failures, building small systems, and explaining your decisions.</p><p>No sign-in needed. Start with the question you brought.</p></section>
    <div className={styles.grid}>{[["Diagnose a problem", "/symptoms", "Start with a symptom. Compare causes and decide what to inspect next."], ["Learn a concept", "/series", "Follow a connected path from explanation to a working example."], ["Practice for an interview", "/practice", "Turn what you understand into an explanation you can defend."]].map(([title, href, text]) => <section className={styles.card} key={href}><h2><Link prefetch={false} href={href}>{title}</Link></h2><p>{text}</p></section>)}</div>
    <ContinueLearning />
    <section className={styles.hero}><p className={styles.eyebrow}>FEATURED INVESTIGATION · ABOUT 5 MINUTES</p><h2>The rollback that never happened</h2><p>A transfer failed, but one balance changed. Inspect the trace, choose a repair, and explain its limits.</p><div className={styles.actions}><Link prefetch={false} className={styles.button} href="/weekly/2026-09-18-transaction-boundaries">Take the weekly challenge</Link><Link prefetch={false} href="/learn/spring-transactions">Follow the full Spring journey →</Link></div></section>
    <section><h2>What are you seeing?</h2><form action="/symptoms"><label>Search engineering symptoms<input type="search" name="q" placeholder="Try slow requests or rollback" /></label><button>Find diagnostic steps</button></form></section>
    <section><h2>Build understanding in layers</h2><div className={styles.grid}>{[["Spring transaction boundaries", "/learn/spring-transactions", "Observe → understand → investigate → implement → explain. About 30 minutes."], ["Build a tiny Java container", "/build/java-dependency-injection", "Four chapters that expose the limits of your design."], ["Revisit a database decision", "/time-machine/database-decisions", "Change the constraints, compare consequences, and defend your choice."]].map(([title, href, text]) => <article className={styles.card} key={href}><h3><Link prefetch={false} href={href}>{title}</Link></h3><p>{text}</p></article>)}</div></section>
    <section><h2>Find an explanation</h2><label>Search articles<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try transactions, SQL, or memory" /></label><p role="status">{articles.length} articles</p><div className={styles.grid}>{articles.slice(0, query ? 12 : 3).map(article => <article className={styles.card} key={article.href}><p className={styles.eyebrow}>{article.category} · {article.minutes} min read</p><h3><Link prefetch={false} href={article.href}>{article.title}</Link></h3><p>{article.description}</p></article>)}</div><p><Link prefetch={false} href="/explore">Browse the complete library →</Link></p></section>
    <section className={styles.card}><h2>Know what you can trust</h2><p>Lessons identify their sources and verification limits. Runnable examples list their runtime. Named human review is shown only when recorded.</p><div className={styles.actions}><Link prefetch={false} href="/editorial">Editorial standards</Link><Link prefetch={false} href="/corrections">See public corrections</Link><Link prefetch={false} href="/digest">Preview the digest</Link></div></section>
  </ReaderLayout>;
}
export function getStaticProps() { return { props: { promise: EDITORIAL_PROMISE, catalogue: READER_ARTICLES } }; }
