import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.31.0/dist/tabler-icons.min.css"
        />
        <meta name="description" content="InterviewIQ - AI-powered interview intelligence for modern software engineers" />
        {process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION} /> : null}
        <meta name="author" content="InterviewIQ" />
        <meta name="copyright" content="InterviewIQ. All rights reserved." />
        <meta property="og:site_name" content="InterviewIQ" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
