import dynamic from "next/dynamic";
const ReaderTools = dynamic(() => import("../components/reader/ReaderTools"), { ssr: false });
const LearningPosition = dynamic(() => import("../components/reader/LearningPosition"), { ssr: false });
const ArticleBookReader = dynamic(() => import("../components/reader/ArticleBookReader"), { ssr: false });
import RuntimeBaseline from "../components/reader/RuntimeBaseline";
import Head from "next/head";
import { SITE_URL } from "../lib/siteUrl.mjs";
import { useEffect } from "react";
import "../styles/globals.css";
import "../styles/corporate.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { installIconTooltips } from "../lib/iconTooltips.mjs";
import BrandWatermark from "../components/BrandWatermark";
import { trackEvent } from "../lib/analytics.mjs";
import PublicHeader from '../components/reader/PublicHeader';
import { bookReadingRoute } from "../lib/bookReadingRoutes.mjs";

export default function App({ Component, pageProps, router }) {
  useEffect(() => installIconTooltips(), []);
  useEffect(() => {
    // Icon fonts are decorative; their CDN must not block the first text paint.
    if (document.getElementById("tabler-icons")) return;
    const link = document.createElement("link");
    link.id = "tabler-icons";
    link.rel = "stylesheet";
    link.href = "https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css";
    document.head.appendChild(link);
  }, []);
  useEffect(() => { trackEvent("page_view"); }, [router.asPath]);
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement; keep the app usable without noisy failures.
    });
  }, []);

  const articlePath = router.asPath.split(/[?#]/)[0];
  const bookRoute = bookReadingRoute(articlePath);
  const isReaderArticle = /^\/(?:java|tech-blogs|guides|spring|sql|python|aws|javascript|system-design)\/.+/.test(articlePath) && articlePath !== "/java/roadmap";
  const needsPublicHeader = /^\/(?:java$|guides$|resources(?:\/|$)|advice-fails(?:\/|$)|explain-log(?:\/|$)|share\/readiness)/.test(articlePath);
  const socialPath = router.asPath.split(/[?#]/)[0];
  const socialImage = /^\/(?:hld|detective|series)\/[^/]+$/.test(socialPath) ? `${SITE_URL}/api/og?path=${encodeURIComponent(socialPath)}` : `${SITE_URL}/interviewiq-social.png`;
  return (
    <>
      <Head><link rel="manifest" href="/manifest.webmanifest" /><meta name="theme-color" content="#174ea6" /><meta property="og:image" content={socialImage} /><meta name="twitter:card" content="summary_large_image" /><meta name="twitter:image" content={socialImage} /><meta name="description" content="Learn engineering through examples, investigations and interview practice." /></Head>
      {router.pathname === '/practice' ? <Component {...pageProps} /> : <div className="corporate-public theme-light">{isReaderArticle ? <div className="reader-article-scroll">{articlePath !== '/system-design/visual-guide' && <PublicHeader />}<RuntimeBaseline /><Component {...pageProps} /><ReaderTools key={articlePath} path={articlePath} /></div> : <>{needsPublicHeader && <PublicHeader />}<Component {...pageProps} /></>}</div>}
      {bookRoute && <ArticleBookReader {...bookRoute} />}
      {(isReaderArticle || /^\/(?:build|detective)\/.+/.test(articlePath)) && <LearningPosition key={articlePath} path={articlePath} />}
      <BrandWatermark publicPage={router.pathname !== '/practice'} />
      <SpeedInsights />
    </>
  );
}
