import { PUBLIC_STACK_GUIDES } from "./seoGuides.mjs";
import { listTechBlogs } from './techBlogs.mjs';
import { JAVA_CURATED_TUTORIAL_CATALOG, slugifyJavaTutorial } from './javaDigest.mjs';
import { AGENTIC_UI_COURSE } from './agenticCourse.mjs';
export function learningCatalogue() {
  return [
    ...listTechBlogs().map(course => ({ id: course.id, title: course.title, category: course.category, href: `/tech-blogs/${course.id}`, prerequisites: course.javaRelease ? `Java ${course.javaRelease}, collections, exceptions, and basic tests.` : 'Read the course overview; basic HTTP, data, and service-boundary concepts are recommended.', lessons: course.chapters.map(c => ({ id: `${course.id}-chapter-${c.order}`, title: c.title, href: `/tech-blogs/${course.id}#lesson-${c.order}` })) })),
    { id: 'java-fundamentals', title: 'Structured Java tutorial library', category: 'Java', href: '/java/roadmap', prerequisites: 'Begin with JDK setup and language basics; follow the numbered chapter checklist.', lessons: JAVA_CURATED_TUTORIAL_CATALOG.map(t => ({ id: t.id, title: t.title, href: `/java/tutorial/${slugifyJavaTutorial(t.title)}` })) },
    ...PUBLIC_STACK_GUIDES.filter(g => ['react', 'nodejs'].includes(g.stack)).map(g => ({ id: g.slug, title: g.title, category: 'Full Stack', href: `/guides/${g.stack}/${g.slug}`, prerequisites: 'JavaScript, HTTP, and basic tests.', lessons: [{ id: `guide-${g.slug}`, title: g.title, href: `/guides/${g.stack}/${g.slug}` }] })),
    { id: 'ai-software-engineers', title: AGENTIC_UI_COURSE.title, category: 'AI Engineering', href: '/learn/ai-engineering', prerequisites: 'JavaScript, JSON, terminal use, Node.js 20+, and basic testing.', lessons: AGENTIC_UI_COURSE.lessons.map(l => ({ id: `ai-lesson-${l.id}`, title: l.title, href: `/learn/ai-engineering#lesson-${l.id}` })) },
  ];
}
