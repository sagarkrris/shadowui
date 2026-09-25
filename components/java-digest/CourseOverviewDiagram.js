import CourseDiagram from './CourseDiagram';
import { BLOG_OVERVIEW_DIAGRAMS } from '../../lib/techBlogDiagrams.mjs';

export default function CourseOverviewDiagram({ courseId, accent }) {
  return <CourseDiagram diagramKey={BLOG_OVERVIEW_DIAGRAMS[courseId]} accent={accent} />;
}
