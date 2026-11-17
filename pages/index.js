import LandingHome from '../components/reader/LandingHome';
import { EDITORIAL_PROMISE, READER_ARTICLES } from '../lib/readerEditorial.mjs';
import { contentInventory } from '../lib/contentInventory.mjs';

export default LandingHome;
export async function getStaticProps() {
  const inventory = await contentInventory();
  return { props: { promise: EDITORIAL_PROMISE, catalogue: READER_ARTICLES, counts: inventory.counts } };
}
