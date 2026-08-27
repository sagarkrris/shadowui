import Head from "next/head";

export default function LicensePage() {
  return (
    <main className="privacyPage">
      <Head>
        <title>Copyright &amp; License · InterviewIQ</title>
        <meta name="description" content="Copyright and permitted-use terms for InterviewIQ." />
      </Head>
      <section className="privacyShell">
        <p className="privacyEyebrow">InterviewIQ</p>
        <h1>Copyright &amp; License</h1>
        <p className="privacyUpdated">Last updated: August 27, 2026</p>
        <p>InterviewIQ and its original code, design, content, branding, and watermark assets are owned by InterviewIQ and its publisher.</p>
        <h2>Permitted use</h2>
        <p>You may use the service for personal learning and interview preparation. You may quote short excerpts with clear attribution and a link to InterviewIQ.</p>
        <h2>Not permitted</h2>
        <p>Do not copy, rebrand, resell, mirror, or represent InterviewIQ screens, tutorials, or generated materials as your own product. The InterviewIQ name, logo, and watermark must remain intact in shared screenshots and exports.</p>
        <p>For licensing requests, contact the publisher before redistributing material.</p>
      </section>
    </main>
  );
}
