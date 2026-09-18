import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import styles from "../../styles/Reader.module.css";
export default function ReaderLayout({ title, description, children }) {
  const router = useRouter();
  const url = `${(process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app").replace(/\/$/, "")}${router.asPath.split(/[?#]/)[0]}`;
  return <div className={styles.shell} data-reader-scroll><Head><title>{`${title} · InterviewIQ`}</title><meta name="description" content={description} /><link rel="canonical" href={url} /><meta property="og:title" content={title} /><meta property="og:description" content={description} /><meta property="og:url" content={url} /></Head><a href="#reader-main" className={styles.skip}>Skip to reading</a><header className={styles.header}><Link href="/" className={styles.brand}>InterviewIQ <span>FIELD NOTES</span></Link><nav aria-label="Reading navigation"><Link href="/series">Reading paths</Link><Link href="/symptoms">Symptoms Atlas</Link><Link href="/detective">Challenges</Link><Link href="/requests">Request board</Link><Link href="/practice">Practice workspace →</Link></nav></header><main id="reader-main" tabIndex={-1} className={styles.main}>{children}</main><footer className={styles.footer}><Link href="/editorial">Editorial standards</Link><Link href="/corrections">Public corrections</Link><Link href="/digest">The digest</Link><Link href="/practice">Resume practice</Link></footer></div>;
}
