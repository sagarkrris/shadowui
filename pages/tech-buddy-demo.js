import ReaderLayout from '../components/reader/ReaderLayout';
import dynamic from 'next/dynamic';

const TechBuddy = dynamic(() => import('../components/chat/TechBuddy'), { ssr: false });

export default function TechBuddyDemo() {
  return <ReaderLayout title="Tech Buddy offline practice" description="Practise 36 Java interview questions from fresher to engineering manager. No account or AI connection required.">
    <h1>Tech Buddy offline practice</h1>
    <TechBuddy config={{ mode: 'demo', level: 'fresher' }} />
    <p>Demo answers stay in this page’s memory and clear when you reload. After this page loads, the question bank works without an AI connection.</p>
  </ReaderLayout>;
}
