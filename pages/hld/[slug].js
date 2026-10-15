import DesignWorkspace from '../../components/design-library/DesignWorkspace';
import { HLD_SOLUTIONS } from '../../lib/designLibraryHld.mjs';
export default function HldWorkspace(props) { return <DesignWorkspace key={props.problem.slug} {...props} />; }
export function getStaticPaths() { return { paths: HLD_SOLUTIONS.map(problem => ({ params: { slug: problem.slug } })), fallback: false }; }
export function getStaticProps({ params }) {
  const index = HLD_SOLUTIONS.findIndex(problem => problem.slug === params.slug);
  if (index === -1) return { notFound: true };
  const next = HLD_SOLUTIONS[(index + 1) % HLD_SOLUTIONS.length];
  return { props: { problem: HLD_SOLUTIONS[index], nextProblem: { track: next.track, slug: next.slug, title: next.title } } };
}
