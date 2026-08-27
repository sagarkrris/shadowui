import { useEffect } from "react";
import "../styles/globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { installIconTooltips } from "../lib/iconTooltips.mjs";
import BrandWatermark from "../components/BrandWatermark";

export default function App({ Component, pageProps }) {
  useEffect(() => installIconTooltips(), []);
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Offline support is progressive enhancement; keep the app usable without noisy failures.
    });
  }, []);

  return (
    <>
      <Component {...pageProps} />
      <BrandWatermark />
      <SpeedInsights />
    </>
  );
}
