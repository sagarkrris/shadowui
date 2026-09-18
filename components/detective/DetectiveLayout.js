import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/ProductionDetective.module.css";

export default function DetectiveLayout({ title, description, path = "/detective", children }) {
  const canonical = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app").replace(/\/$/, "")}${path}`;
  return <div className={styles.shell} data-detective-scroll tabIndex={-1}>
    <Head><title>{`${title} · Production Detective`}</title><meta name="description" content={description} /><link rel="canonical" href={canonical} /><meta property="og:title" content={`${title} · Production Detective`} /><meta property="og:description" content={description} /><meta property="og:url" content={canonical} /><meta property="og:type" content="website" /><meta name="twitter:card" content="summary" /></Head>
    <a className={styles.skip} href="#detective-main">Skip to case content</a>
    <header className={styles.header}><Link href="/detective" className={styles.brand}><span aria-hidden="true" className={styles.mark}>PD</span><span>PRODUCTION<br /><strong>DETECTIVE</strong></span></Link><nav aria-label="Detective navigation"><Link href="/detective">Case files</Link><Link href="/practice">Practice workspace <span aria-hidden="true">↗</span></Link></nav></header>
    <main id="detective-main" tabIndex={-1} className={styles.main}>{children}</main>
    {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- RSS requires native XML navigation. */}
    <footer className={styles.footer}><span>Fictional incidents. Real engineering lessons.</span><a href="/rss.xml">Follow new guides & cases via RSS</a><span>No account or AI response required.</span></footer>
  </div>;
}
