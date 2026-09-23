import CourseDiagram from "../../components/java-digest/CourseDiagram";
import Head from "next/head";
import Link from "next/link";
import { listTechBlogs } from "../../lib/techBlogs.mjs";
import BackendFieldNote from "../../components/reader/BackendFieldNote";

export default function TechBlogCourse({ blog }) {
  if (blog.format === 'field-note') return <BackendFieldNote key={blog.id} blog={blog} />;
  const url = `/tech-blogs/${blog.id}`;
  return <><Head><title>{`${blog.title} | InterviewIQ`}</title><meta name="description" content={blog.summary} /><link rel="canonical" href={`${process.env.NEXT_PUBLIC_SITE_URL || "https://interviewiq.app"}${url}`} /></Head><main style={pageStyle}><article style={{ maxWidth: 820, margin: "0 auto" }}><nav><Link href="/">InterviewIQ</Link> / <Link href="/tech-blogs">Tech Blogs</Link> / {blog.title}</nav><header><p style={eyebrow}>{blog.category} · PUBLIC COURSE</p><h1>{blog.title}</h1><p style={lede}>{blog.summary}</p><p style={muted}>{blog.chapters.length} chapters with lessons, examples, exercises, and self-checks.</p></header><section style={card}><h2>Course overview</h2>{blog.sections.map((section) => <div key={section.heading}><h3>{section.heading}</h3><p>{section.body}</p></div>)}</section>{blog.patterns?.length ? <section style={{ ...card, marginTop: 22 }}><h2>18 industry design patterns</h2>{blog.patterns.map((pattern) => <div key={pattern.name} style={{ borderTop: "1px solid #253b57", padding: "10px 0" }}><h3 style={{ margin: 0 }}>{pattern.name}</h3><p style={{ margin: "4px 0" }}>{pattern.intent}</p><p style={muted}><b>Use:</b> {pattern.use} <b>Watch:</b> {pattern.caution}</p></div>)}</section> : null}<section style={{ display: "grid", gap: 14, marginTop: 22 }}>{blog.chapters.map((chapter) => <article key={chapter.title} style={card}><p style={eyebrow}>Chapter {chapter.order}</p><h2>{chapter.title}</h2><p>{chapter.lesson}</p><CourseDiagram diagramKey={chapter.diagramKey} />{chapter.walkthrough && <p><strong>Walkthrough:</strong> {chapter.walkthrough}</p>}<div aria-label={`${chapter.title} diagram`} style={flow}>{chapter.diagram}</div>{chapter.whenToUse && <p><strong>When to use:</strong> {chapter.whenToUse}</p>}{chapter.avoid && <p><strong>When to avoid:</strong> {chapter.avoid}</p>}<h3>Worked example</h3><pre style={code}>{chapter.example}</pre><h3>Exercise</h3><p>{chapter.exercise}</p><h3>Self-check</h3><p>{chapter.quiz}</p>{chapter.answer && <details><summary>Sample answer</summary><p>{chapter.answer}</p></details>}</article>)}</section>{blog.capstone && <section style={{ ...card, marginTop: 22 }}><h2>{blog.capstone.title}</h2><p><strong>Scenario:</strong> {blog.capstone.scenario}</p><ol>{blog.capstone.steps.map(step => <li key={step}>{step}</li>)}</ol><p><strong>Outcome:</strong> {blog.capstone.outcome}</p></section>}<section style={{ ...card, marginTop: 22 }}><h2>Interview checkpoint</h2><ul>{blog.interviewQuestions.map((question) => <li key={question}>{question}</li>)}</ul><Link href="/?workspace=java-digest" style={button}>Practice in workspace</Link></section></article></main></>;
}

const pageStyle = { background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "40px 18px", lineHeight: 1.6 };
const card = { minWidth: 0, background: "#101d30", border: "1px solid #253b57", borderRadius: 9, padding: 18 };
const eyebrow = { color: "#8bd3ff", fontSize: 11, fontWeight: 850, letterSpacing: ".08em", margin: 0, textTransform: "uppercase" };
const lede = { color: "#a9bad1", fontSize: 18 };
const muted = { color: "#8fa4bd", fontSize: 13 };
const flow = { background: "#0b1728", border: "1px solid #294563", borderRadius: 6, color: "#8bd3ff", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", margin: "12px 0", overflowX: "auto", padding: "9px 10px", whiteSpace: "pre-wrap" };
const code = { background: "#0b1728", borderRadius: 6, color: "#c7e7ff", overflowX: "auto", padding: 10, whiteSpace: "pre-wrap" };
const button = { border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", display: "inline-block", padding: "8px 11px", textDecoration: "none" };

export function getStaticPaths() { return { paths: listTechBlogs().map((blog) => ({ params: { slug: blog.id } })), fallback: false }; }
export async function getStaticProps({ params }) {
  const blog = listTechBlogs().find((entry) => entry.id === params.slug);
  if (!blog) return { notFound: true };
  if (blog.fixture) {
    const { readFile } = await import('node:fs/promises');
    const { join } = await import('node:path');
    const exampleSource = await readFile(join(process.cwd(), 'public/blog-examples', blog.fixture), 'utf8');
    return { props: { blog: { ...blog, exampleSource } } };
  }
  return { props: { blog } };
}
