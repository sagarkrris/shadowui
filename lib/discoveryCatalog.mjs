import { learningCatalogue } from './learningCatalog.mjs';
import { READER_ARTICLES, READING_SERIES } from './readerEditorial.mjs';
import { HUB_LABS } from './hubLabs.mjs';
import { BUILD_CHALLENGES } from './buildChallenges.mjs';
import { DISCOVERY_SHORTCUTS } from './publicNavigation.mjs';
import { DESIGN_PROBLEMS, designHref } from './designLibrary.mjs';
import { INTERVIEW_TOPICS, topicHref } from './interviewTopics.mjs';

// Only public metadata leaves the server; course bodies and solutions stay out of this index.
export function discoveryCatalogue() {
  const courses = learningCatalogue();
  const entries = [
    ...DISCOVERY_SHORTCUTS,
    ...INTERVIEW_TOPICS.map(topic => ({ title: `${topic.title} interview questions`, href: topicHref(topic.slug), description: `${topic.count} answered questions. ${topic.description}`, category: 'Interview topic', type: 'Course' })),
    ...DESIGN_PROBLEMS.map(problem => ({ title: problem.title, href: designHref(problem), description: problem.summary, category: `${problem.track.toUpperCase()} · ${problem.topic}`, type: 'Challenge' })),
    ...courses.map(c => ({ title: c.title, href: c.href, description: c.prerequisites, category: c.category, type: 'Course' })),
    ...courses.flatMap(c => c.lessons.map(l => ({ title: l.title, href: l.href, description: c.title, category: c.category, type: 'Lesson' }))),
    ...READER_ARTICLES.map(a => ({ ...a, type: 'Article' })),
    ...READING_SERIES.map(s => ({ title: s.title, href: `/series/${s.slug}`, description: s.description, category: 'Reading path', type: 'Course' })),
    ...HUB_LABS.map(l => ({ title: l.title, href: `/labs/${l.id}`, description: l.scope, category: 'Interactive lab', type: 'Lab' })),
    ...BUILD_CHALLENGES.map(c => ({ title: c.title, href: `/build/practice/${c.id}`, description: `${c.track} · ${c.difficulty} · Java 17`, category: c.track, type: 'Challenge' })),
  ];
  const seen = new Set();
  return entries.filter(item => !seen.has(`${item.type}:${item.href}`) && seen.add(`${item.type}:${item.href}`)).map(({ title, href, description, category, type }) => ({ title, href, description, category, type }));
}
