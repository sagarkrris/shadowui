import { PUBLIC_STACK_GUIDES } from "./seoGuides.mjs";
import { listTechBlogs } from './techBlogs.mjs';
import { JAVA_CURATED_TUTORIAL_CATALOG, slugifyJavaTutorial } from './javaDigest.mjs';
import { SPRING_COURSES, springCourseHref, springLessonId } from './springCourses.mjs';
import { HIBERNATE_COURSE, hibernateLessonId } from './hibernateCourse.mjs';
import { MICRONAUT_COURSE, micronautLessonId } from './micronautCourse.mjs';
import { STANDALONE_JAVA_COURSE, standaloneJavaLessonId } from './standaloneJavaCourse.mjs';
import { AGENTIC_UI_COURSE } from './agenticCourse.mjs';
export function learningCategory(value) {
  const category = String(value || '').trim().replace(/\s+/g, ' ');
  return category.toLowerCase() === 'ai engineering' ? 'AI Engineering' : category;
}
export function learningCatalogue() {
  return [
    ...SPRING_COURSES.map(course => ({
      id: course.id, title: course.title, category: 'Spring', href: springCourseHref(course.id),
      prerequisites: course.prerequisites,
      lessons: course.lessons.map(lesson => ({
        id: springLessonId(course.id, lesson.id), title: lesson.title,
        href: springCourseHref(course.id) + '#' + lesson.id,
      })),
    })),
    {
      id: HIBERNATE_COURSE.id, title: HIBERNATE_COURSE.title, category: 'Hibernate',
      href: HIBERNATE_COURSE.href, prerequisites: HIBERNATE_COURSE.prerequisites,
      lessons: HIBERNATE_COURSE.lessons.map(lesson => ({
        id: hibernateLessonId(lesson.id), title: lesson.title, href: HIBERNATE_COURSE.href + '#' + lesson.id,
      })),
    },
    {
      id: MICRONAUT_COURSE.id, title: MICRONAUT_COURSE.title, category: 'Micronaut',
      href: MICRONAUT_COURSE.href, prerequisites: MICRONAUT_COURSE.prerequisites,
      lessons: MICRONAUT_COURSE.lessons.map(lesson => ({
        id: micronautLessonId(lesson.id), title: lesson.title, href: MICRONAUT_COURSE.href + '#' + lesson.id,
      })),
    },
    {
      id: STANDALONE_JAVA_COURSE.id, title: STANDALONE_JAVA_COURSE.title, category: 'Java',
      href: STANDALONE_JAVA_COURSE.href, prerequisites: STANDALONE_JAVA_COURSE.prerequisites,
      lessons: STANDALONE_JAVA_COURSE.lessons.map(lesson => ({
        id: standaloneJavaLessonId(lesson.id), title: lesson.title, href: STANDALONE_JAVA_COURSE.href + '#' + lesson.id,
      })),
    },
    ...listTechBlogs().map(course => ({ id: course.id, title: course.title, category: course.category, href: `/tech-blogs/${course.id}`, prerequisites: course.javaRelease ? `Java ${course.javaRelease}, collections, exceptions, and basic tests.` : 'Read the course overview; basic HTTP, data, and service-boundary concepts are recommended.', lessons: course.chapters.map(c => ({ id: `${course.id}-chapter-${c.order}`, title: c.title, href: `/tech-blogs/${course.id}#lesson-${c.order}` })) })),
    { id: 'java-fundamentals', title: 'Structured Java tutorial library', category: 'Java', href: '/java/roadmap', prerequisites: 'Begin with JDK setup and language basics; follow the numbered chapter checklist.', lessons: JAVA_CURATED_TUTORIAL_CATALOG.map(t => ({ id: t.id, title: t.title, href: `/java/tutorial/${slugifyJavaTutorial(t.title)}` })) },
    ...PUBLIC_STACK_GUIDES.filter(g => ['react', 'nodejs'].includes(g.stack)).map(g => ({ id: g.slug, title: g.title, category: 'Full Stack', href: `/guides/${g.stack}/${g.slug}`, prerequisites: 'JavaScript, HTTP, and basic tests.', lessons: [{ id: `guide-${g.slug}`, title: g.title, href: `/guides/${g.stack}/${g.slug}` }] })),
    { id: 'ai-software-engineers', title: AGENTIC_UI_COURSE.title, category: 'AI Engineering', href: '/learn/ai-engineering', prerequisites: 'JavaScript, JSON, terminal use, Node.js 20+, and basic testing.', lessons: AGENTIC_UI_COURSE.lessons.map(l => ({ id: `ai-lesson-${l.id}`, title: l.title, href: `/learn/ai-engineering#lesson-${l.id}` })) },
  ].map(course => ({ ...course, category: learningCategory(course.category) }));
}
