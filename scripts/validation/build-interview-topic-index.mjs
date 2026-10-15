import { readFile, writeFile } from 'node:fs/promises';
import { SENIOR_JAVA_GUIDE_PARTS } from '../../lib/seniorJavaGuide.mjs';

const rules = [
  ['micronaut', /micronaut/i], ['spring-boot', /spring boot|auto.?configuration|actuator/i],
  ['spring-framework', /spring|webflux|transactional|bean|mvc|dependency injection/i],
  ['hibernate', /hibernate|\bjpa\b|persistence|entity|session management/i],
  ['sql', /\bsql\b|database|index|query|join|relational|connection pool/i],
  ['redis', /redis|cach/i], ['kafka', /kafka|messaging|consumer offset/i],
  ['gcp', /google cloud|\bgcp\b|cloud sql|pub\/sub|bigquery|spanner|cloud run|\bgke\b/i],
  ['microservices', /microservice|distributed|saga|outbox|api|consensus|reliab|backpressure|rate.limit/i],
  ['java', /\bjava\b|jvm|concurren|thread|stream|collection|hashmap|garbage|class.load|scoped.value/i],
];
const plain = html => html.replace(/<[^>]*>/g, '').replace(/&(?:amp|quot|lt|gt|#39);/g, value => ({ '&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>', '&#39;': "'" }[value]));
const entries = [];
for (const part of SENIOR_JAVA_GUIDE_PARTS) {
  const html = await readFile(new URL(`../../content/senior-java/rendered/${part.slug}.html`, import.meta.url), 'utf8');
  const stack = [];
  for (const match of html.matchAll(/<h([2-6]) id="([^"]+)">([\s\S]*?)<\/h\1>/g)) {
    const depth = Number(match[1]);
    while (stack.length && stack.at(-1).depth >= depth) stack.pop();
    const title = plain(match[3]);
    let topics = rules.filter(([, pattern]) => pattern.test(title)).map(([slug]) => slug);
    const additional = /leadership|behavioral|terraform|kubernetes|docker|maven|coding programs|algorithm walkthrough|coding problems|coding practice|mock interview|checklist|readiness|two-week|2-week|roadmap coverage|quality foundations/i.test(title);
    const mixedChapter = depth === 2 && /^(?:Part \d+|Senior Java)/i.test(title);
    if (additional || mixedChapter) topics = [];
    if (part.slug === 'part-22') topics = ['micronaut'];
    if (!topics.length && !additional && !mixedChapter) topics = stack.at(-1)?.topics || [];
    stack.push({ depth, topics });
    entries.push({ title, href: `/senior-java-interview/${part.slug}#${match[2]}`, part: part.title, topics });
  }
}
await writeFile(new URL('../../content/interview-topics/legacy-index.json', import.meta.url), JSON.stringify(entries, null, 2) + '\n');
console.log(`Indexed ${entries.length} existing guide sections; ${entries.filter(entry => !entry.topics.length).length} remain in additional subjects.`);
