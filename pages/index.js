import LandingHome from '../components/reader/LandingHome';
import { EDITORIAL_PROMISE, READER_ARTICLES } from '../lib/readerEditorial.mjs';
import { HUB_LABS } from '../lib/hubLabs.mjs';
import { learningCatalogue } from '../lib/learningCatalog.mjs';
import { BUILD_CHALLENGES } from '../lib/buildChallenges.mjs';

export default LandingHome;
export function getStaticProps() {
  return { props: { promise: EDITORIAL_PROMISE, catalogue: READER_ARTICLES, counts: { courses: learningCatalogue().length, labs: HUB_LABS.length + 2, challenges: BUILD_CHALLENGES.length } } };
}
