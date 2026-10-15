import DesignCatalog from '../../components/design-library/DesignCatalog';
import { HLD_SOLUTIONS } from '../../lib/designLibraryHld.mjs';
export default DesignCatalog;
export function getStaticProps() {
  return { props: { track: 'hld', problems: HLD_SOLUTIONS.map(({ track, slug, title, difficulty, topic, summary, tags, minutes }) => ({ track, slug, title, difficulty, topic, summary, tags, minutes })) } };
}
