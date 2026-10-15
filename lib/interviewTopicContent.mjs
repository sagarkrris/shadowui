import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { INTERVIEW_TOPICS } from './interviewTopics.mjs';

export async function readInterviewTopic(slug) {
  const topic = INTERVIEW_TOPICS.find(item => item.slug === slug);
  if (!topic) return null;
  const content = JSON.parse(await readFile(path.join(process.cwd(), 'content/interview-topics', `${topic.slug}.json`), 'utf8'));
  return { topic, groups: content.groups };
}
