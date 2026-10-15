import DesignWorkspace from '../../components/design-library/DesignWorkspace';
import { LLD_SOLUTIONS } from '../../lib/designLibraryLld.mjs';
export default function LldWorkspace(props) { return <DesignWorkspace key={props.problem.slug} {...props} />; }
export function getStaticPaths() { return { paths: LLD_SOLUTIONS.map(problem => ({ params: { slug: problem.slug } })), fallback: false }; }
export function getStaticProps({ params }) {
  const index = LLD_SOLUTIONS.findIndex(problem => problem.slug === params.slug);
  if (index === -1) return { notFound: true };
  const next = LLD_SOLUTIONS[(index + 1) % LLD_SOLUTIONS.length];
  return { props: { problem: LLD_SOLUTIONS[index], nextProblem: { track: next.track, slug: next.slug, title: next.title } } };
}
