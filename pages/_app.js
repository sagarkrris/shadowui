import { useEffect } from "react";
import "../styles/globals.css";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { installIconTooltips } from "../lib/iconTooltips.mjs";

export default function App({ Component, pageProps }) {
  useEffect(() => installIconTooltips(), []);

  return (
    <>
      <Component {...pageProps} />
      <SpeedInsights />
    </>
  );
}
