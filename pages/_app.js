import ReaderTools from "../components/reader/ReaderTools";
import Head from "next/head";
import { useEffect } from "react";
import "../styles/globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { installIconTooltips } from "../lib/iconTooltips.mjs";
import BrandWatermark from "../components/BrandWatermark";
import { trackEvent } from "../lib/analytics.mjs";

export default function App({ Component, pageProps, router }) {
  useEffect(() => installIconTooltips(), []);
  useEffect(() => { trackEvent("page_view"); }, [router.asPath]);
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement; keep the app usable without noisy failures.
    });
  }, []);

  const articlePath = router.asPath.split(/[?#]/)[0];
  const isReaderArticle = /^\/(?:java|tech-blogs|guides|spring|sql|python|aws|javascript|system-design)\/.+/.test(articlePath) && articlePath !== "/java/roadmap";
  return (
    <>
      <Head><meta name="description" content="InterviewIQ - AI-powered interview intelligence for modern software engineers" /></Head>
      {isReaderArticle ? <div className="reader-article-scroll"><Component {...pageProps} /><ReaderTools key={articlePath} path={articlePath} /></div> : <Component {...pageProps} />}
      <BrandWatermark />
      <SpeedInsights />
    </>
  );
}
