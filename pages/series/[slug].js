import Link from "next/link";
import ReaderLayout from "../../components/reader/ReaderLayout";
import { READING_SERIES, readingItem } from "../../lib/readerEditorial.mjs";
import styles from "../../styles/Reader.module.css";
export default function Series({ series }) { return <ReaderLayout title={series.title} description={series.description}><p className={styles.eyebrow}>A GUIDED READING PATH</p><h1>{series.title}</h1><p className={styles.lead}>{series.description}</p><p><strong>Prerequisites:</strong> {series.prerequisites}</p><ol className={styles.list}>{series.items.map(href => { const item = readingItem(href); return <li key={href}><h2><Link href={href}>{item.title}</Link></h2><p>{item.description}</p><p className={styles.small}>{item.minutes} minutes · {item.category}</p></li>; })}</ol><Link href="/series">All reading paths</Link></ReaderLayout>; }
export function getStaticPaths() { return { paths: READING_SERIES.map(s => ({ params: { slug: s.slug } })), fallback: false }; }
export function getStaticProps({ params }) { const series = READING_SERIES.find(s => s.slug === params.slug); return series ? { props: { series } } : { notFound: true }; }
