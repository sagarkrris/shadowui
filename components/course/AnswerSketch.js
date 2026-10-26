import CourseSketch from './CourseSketch';

export default function AnswerSketch({ visual, summary = 'See the reasoning as a sketch' }) {
  if (!visual) return null;
  return <details style={{ margin: '10px 0' }}>
    <summary style={{ cursor: 'pointer', fontWeight: 700 }}>{summary}</summary>
    <CourseSketch {...visual} compact />
  </details>;
}
