import { SITE_URL } from "../../lib/siteUrl.mjs";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import { PUBLIC_NAVIGATION } from '../../lib/publicNavigation.mjs';
import UiIcon from './UiIcon';
import styles from "../../styles/Reader.module.css";
import ui from '../../styles/PublicUi.module.css';
import PublicHeader from './PublicHeader';

export default function ReaderLayout({ title, description, children }) {
  const router = useRouter();
  const url = `${SITE_URL}${router.asPath.split(/[?#]/)[0]}`;
  return <div className={styles.shell} data-reader-scroll>
    <Head><title>{`${title} · InterviewIQ`}</title><meta name="description" content={description} /><link rel="canonical" href={url} /><meta property="og:title" content={title} /><meta property="og:description" content={description} /><meta property="og:url" content={url} /></Head>
    <a href="#reader-main" className={styles.skip}>Skip to reading</a>
    <PublicHeader />
    <main id="reader-main" tabIndex={-1} className={styles.main}>{children}</main>
    <footer className={ui.siteFooter}>
      <div className={ui.footerInner}><div className={ui.footerBrand}><Link prefetch={false} href="/" className={ui.brand}><span className={ui.brandMark} aria-hidden="true">IQ<span /></span><span>InterviewIQ</span></Link><p>Understand the idea.<br />Build something small.<br />Explain it with confidence.</p><Link prefetch={false} href="/learn">Find your learning path <UiIcon name="arrow" size={16} /></Link></div>
        {PUBLIC_NAVIGATION.map(group => <nav key={group.label} aria-label={`${group.label} footer`}><h2>{group.label}</h2>{group.items.map(item => <Link prefetch={false} href={item.href} key={item.href}>{item.title}</Link>)}</nav>)}
      </div>
      <div className={ui.footerBottom}><p>Built for curious engineers. Public learning starts without an account.</p><div><Link href="/corrections">Public corrections</Link><Link href="/requests">Request board</Link><Link href="/sign-in">Sign in</Link></div></div>
    </footer>
  </div>;
}
