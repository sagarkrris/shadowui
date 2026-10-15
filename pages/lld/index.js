import DesignCatalog from '../../components/design-library/DesignCatalog';
import { LLD_SOLUTIONS } from '../../lib/designLibraryLld.mjs';
export default DesignCatalog;
export function getStaticProps() {
  return { props: { track: 'lld', problems: LLD_SOLUTIONS.map(({ track, slug, title, difficulty, topic, summary, tags, minutes }) => ({ track, slug, title, difficulty, topic, summary, tags, minutes })) } };
}
