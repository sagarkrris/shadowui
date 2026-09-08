import Head from "next/head";
import Link from "next/link";
import { listTechBlogs } from "../lib/techBlogs.mjs";

export default function TechBlogsIndex() {
  const blogs = listTechBlogs();
  return <><Head><title>Tech Blog Courses | InterviewIQ</title><meta name="description" content="Free, original full-length courses for design patterns, DSA, system design, Java engineering, and interview communication." /></Head><main style={pageStyle}><article style={{ maxWidth: 1060, margin: "0 auto" }}><nav><Link href="/">InterviewIQ</Link> / Tech Blogs</nav><header><p style={eyebrow}>FREE PUBLIC COURSES</p><h1>Tech Blogs</h1><p style={lede}>Chapter-based courses with walkthroughs, examples, exercises, and interview self-checks. No account required.</p></header><div style={grid}>{blogs.map((blog) => <article key={blog.id} style={card}><p style={eyebrow}>{blog.category}</p><h2><Link href={`/tech-blogs/${blog.id}`}>{blog.title}</Link></h2><p>{blog.summary}</p><p style={muted}>{blog.chapters.length} chapters · lessons · exercises · self-checks</p><Link href={`/tech-blogs/${blog.id}`} style={button}>Start course</Link></article>)}</div></article></main></>;
}

const pageStyle = { background: "#08111f", color: "#e5edf8", minHeight: "100vh", padding: "40px 18px", lineHeight: 1.55 };
const grid = { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", marginTop: 28 };
const card = { background: "#101d30", border: "1px solid #253b57", borderRadius: 9, display: "grid", gap: 9, padding: 17 };
const eyebrow = { color: "#8bd3ff", fontSize: 11, fontWeight: 850, letterSpacing: ".08em", margin: 0, textTransform: "uppercase" };
const lede = { color: "#a9bad1", fontSize: 18, maxWidth: 760 };
const muted = { color: "#8fa4bd", fontSize: 13 };
const button = { border: "1px solid #38516e", borderRadius: 6, color: "#dbeafe", display: "inline-block", padding: "8px 11px", textDecoration: "none", width: "fit-content" };
