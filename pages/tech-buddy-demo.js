import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const TechBuddy = dynamic(() => import('../components/chat/TechBuddy'), { ssr: false });

export default function TechBuddyDemo() {
  return <>
    <Head><title>Tech Buddy offline practice | InterviewIQ</title><meta name="description" content="Practise 36 Java interview questions from fresher to engineering manager. No account or AI connection required." /></Head>
    <main style={{ minHeight: '100vh', background: '#14100c', color: '#ede3d3', padding: '24px 16px' }}>
      <nav style={{ maxWidth: 960, margin: '0 auto 24px', display: 'flex', gap: 20 }}><Link href="/">InterviewIQ</Link><Link href="/practice?buddy=1">Practise with Gemini feedback</Link></nav>
      <TechBuddy config={{ mode: 'demo', level: 'fresher' }} />
      <p style={{ maxWidth: 960, margin: '20px auto' }}>Demo answers stay in this page’s memory and clear when you reload. After this page loads, the question bank works without an AI connection.</p>
    </main>
  </>;
}
