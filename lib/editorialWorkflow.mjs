// Build-time provenance. Fingerprints identify content revisions; they are not review approvals.
import { AGENTIC_UI_COURSE } from './agenticCourse.mjs';
import { createHash } from 'node:crypto';
import { editorialCredit } from './readerEditorial.mjs';
import { listTechBlogs } from './techBlogs.mjs';
import { JAVA_CURATED_TUTORIAL_CATALOG, slugifyJavaTutorial } from './javaDigest.mjs';
import { PUBLIC_ARTICLES } from './publicContent.mjs';
import { PUBLIC_STACK_GUIDES } from './seoGuides.mjs';
import { DETECTIVE_CASES, DETECTIVE_REVIEWED_AT } from './productionDetective.mjs';
import { SYSTEM_DESIGN_VISUAL_GUIDE } from './systemDesignVisualGuide.mjs';

export const EDITORIAL_WORKFLOW_VERSION = 1;
export function contentRevision(content) { return `sha256:${createHash('sha256').update(JSON.stringify(content)).digest('hex')}`; }
function provenance(href, content, source, evidence, updated = null) {
  return { href, title: content.title, schemaVersion: EDITORIAL_WORKFLOW_VERSION, revision: contentRevision(content), source, recordedDate: updated, reviewStatus: 'Named independent review not recorded', reviewer: null, evidence, runtimeRecord: editorialCredit(href).runtime, lastExecution: null };
}
export function articleProvenance() {
  const records = [
    provenance('/learn/ai-engineering', AGENTIC_UI_COURSE, 'lib/agenticCourse.mjs', 'Exercise contracts and authored examples are maintained in source. See chapter setup; no per-article execution date is recorded here.'),
    ...listTechBlogs().map(article => provenance(`/tech-blogs/${article.id}`, article, article.format === 'field-note' ? 'lib/backendFieldNotes.mjs' : `lib/techBlogs.mjs (catalog ID: ${article.id})`, article.fixture ? `Model fixture: public/blog-examples/${article.fixture}; regression: test/backendFieldNotes.test.mjs. ${article.scope}` : article.javaRelease ? `Declared Java release ${article.javaRelease}; behavioral registration: scripts/validation/tech-blog-contracts.mjs. Consult the release-gate report for executed results.` : 'Examples may be contextual fragments or teaching models. Consult chapter setup and scripts/validation/README.md; no per-article execution date is recorded here.', article.updated || article.reviewedAt || null)),
    ...JAVA_CURATED_TUTORIAL_CATALOG.map(article => provenance(`/java/tutorial/${slugifyJavaTutorial(article.title)}`, article, `lib/javaDigest.mjs (chapter ID: ${article.id}; authored chapter overrides are assembled here)`, 'Chapter setup identifies complete programs versus contextual fragments. Verification entry point: scripts/validation/check-java-content.mjs; version labs: test/javaReleaseLessonsCode.test.mjs. Registration is not an execution result.', article.reviewedAt || null)),
    ...PUBLIC_ARTICLES.map(article => provenance(`/java/${article.slug}`, article, `lib/publicContent.mjs (guide: ${article.slug}; source question/scenario in lib/javaDigest.mjs)`, 'Source-backed explanation. Runtime verification is not recorded for this guide.', article.reviewedAt || null)),
    ...PUBLIC_STACK_GUIDES.map(article => provenance(`/guides/${article.stack}/${article.slug}`, article, 'lib/seoGuides.mjs', 'Source-backed explanation. Runtime verification is not recorded for this guide.', article.reviewedAt || null)),
    ...DETECTIVE_CASES.map(article => provenance(`/detective/${article.slug}`, article, 'lib/productionDetective.mjs', 'Bounded browser investigation; runtime scope is described by the case. Historical execution claims appear in the article editorial details.', DETECTIVE_REVIEWED_AT)),
    provenance('/system-design/visual-guide', SYSTEM_DESIGN_VISUAL_GUIDE, 'lib/systemDesignVisualGuide.mjs', 'Visual teaching guide; this is not a deployed distributed system.'),
  ];
  return records.filter((record, index) => records.findIndex(other => other.href === record.href) === index);
}
