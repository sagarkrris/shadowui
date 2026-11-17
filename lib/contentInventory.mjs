// Build-time inventory: do not import canonical banks into client navigation bundles.
import { learningCatalogue } from './learningCatalog.mjs';
import { listTechBlogs } from './techBlogs.mjs';
import { READER_ARTICLES } from './readerEditorial.mjs';
import { PUBLIC_STACK_GUIDES } from './seoGuides.mjs';
import { JAVA_CURATED_TUTORIAL_CATALOG, slugifyJavaTutorial } from './javaDigest.mjs';
import { HUB_LABS } from './hubLabs.mjs';
import { BUILD_CHALLENGES } from './buildChallenges.mjs';
import { LEARNING_PATHS } from './learningHub.mjs';
import { listBlind75Problems } from './blind75VisualTrack.mjs';
import { INTERVIEW_TOPICS } from './interviewTopics.mjs';
import { readInterviewTopic } from './interviewTopicContent.mjs';

export const INVENTORY_DEFINITIONS = [
  { key: 'courses', label: 'Structured courses', definition: 'Multi-lesson tech-blog courses (excluding field notes), plus the AI engineering course. Chapters are not additional courses.' },
  { key: 'collections', label: 'Tutorial collections', definition: 'The Java tutorial library, counted once as a collection; its chapters are guides.' },
  { key: 'guides', label: 'Guides and articles', definition: 'Reader articles, stack guides and curated Java tutorial chapters, deduplicated by canonical route. Field notes are guides even when also listed in the learning catalog.' },
  { key: 'questions', label: 'Interview questions', definition: 'Authored question entries in the canonical topic JSON banks, counted once by normalized question text within each topic. Daily selections and other views do not add questions.' },
  { key: 'codingProblems', label: 'Coding problems', definition: 'Canonical Blind75 problem IDs. Fresher, visualizer and daily views reuse these problems. External or generated questions are excluded.' },
  { key: 'labs', label: 'Interactive labs', definition: 'The five registered bounded hub models plus the SQL and Git labs. Individual scenarios and lesson controls are not extra labs.' },
  { key: 'challenges', label: 'Java build challenges', definition: 'Registered BUILD_CHALLENGES contracts. Multi-chapter projects, Node exercises and detective cases are separate formats and excluded from this count.' },
  { key: 'paths', label: 'Learning paths', definition: 'The connected role roadmaps. Stages, reading series and individual activities are not additional paths.' },
];
export function uniqueInventoryCount(values) { return new Set(values).size; }
export async function contentInventory({ readTopic = readInterviewTopic } = {}) {
  const catalog = learningCatalogue();
  const courses = new Set(listTechBlogs().filter(item => item.format !== 'field-note').map(item => `/tech-blogs/${item.id}`));
  courses.add('/learn/ai-engineering');
  const guides = [...READER_ARTICLES.map(item => item.href), ...PUBLIC_STACK_GUIDES.map(item => `/guides/${item.stack}/${item.slug}`), ...JAVA_CURATED_TUTORIAL_CATALOG.map(item => `/java/tutorial/${slugifyJavaTutorial(item.title)}`)];
  const topics = await Promise.all(INTERVIEW_TOPICS.map(async topic => {
    const content = await readTopic(topic.slug);
    // Read actual authored entries, not the topic's advertised count.
    return uniqueInventoryCount(content.groups.flatMap(group => group.questions.map(item => item.question.trim().replace(/\s+/g, ' ').toLowerCase())));
  }));
  return { schemaVersion: 1, scope: 'Registered learning catalog and canonical practice banks; categories overlap in subject matter and are not a total of unique lessons.', counts: { courses: courses.size, collections: 1, catalogEntries: uniqueInventoryCount(catalog.map(item => item.href)), guides: uniqueInventoryCount(guides), questions: topics.reduce((sum, count) => sum + count, 0), codingProblems: uniqueInventoryCount(listBlind75Problems().map(item => item.id)), labs: uniqueInventoryCount([...HUB_LABS.map(item => `/labs/${item.id}`), '/labs/sql', '/labs/git']), challenges: uniqueInventoryCount(BUILD_CHALLENGES.map(item => item.id)), paths: uniqueInventoryCount(LEARNING_PATHS.map(item => item.id)) } };
}
