import Link from 'next/link';
import ReaderLayout from '../../components/reader/ReaderLayout';
import { WEEKLY_CHALLENGES } from '../../lib/weeklyChallenges.mjs';
import styles from '../../styles/Reader.module.css';
export default function Weekly() { return <ReaderLayout title="Weekly engineering challenge" description="One focused investigation to discuss with your team."><h1>One investigation. A better explanation.</h1><p>Our first weekly edition is ready. Each published edition keeps its own permanent, spoiler-free link. New editions are published after content checks; future releases are not yet scheduled.</p>{WEEKLY_CHALLENGES.map(issue => <article className={styles.card} key={issue.slug}><p>{issue.date} · ABOUT 5 MINUTES</p><h2><Link href={`/weekly/${issue.slug}`}>{issue.title}</Link></h2><p>{issue.description}</p></article>)}<p><Link href="/digest">Read the digest and check subscription availability</Link></p></ReaderLayout>; }
