import TopicReader from '../../../components/interview-guide/TopicReader';
import { INTERVIEW_TOPICS } from '../../../lib/interviewTopics.mjs';
import { readInterviewTopic } from '../../../lib/interviewTopicContent.mjs';
import legacyIndex from '../../../content/interview-topics/legacy-index.json';

export default function InterviewTopicPage(props) {
  return <TopicReader key={props.topic.slug} {...props} />;
}

export function getStaticPaths() {
  return { paths: INTERVIEW_TOPICS.map(topic => ({ params: { topic: topic.slug } })), fallback: false };
}
export async function getStaticProps({ params }) {
  const content = await readInterviewTopic(params.topic);
  if (!content) return { notFound: true };
  return { props: { ...content, legacy: legacyIndex.filter(entry => entry.topics.includes(params.topic)) } };
}
