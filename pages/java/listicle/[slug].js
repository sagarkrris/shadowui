import VerticalArticle from "../../../components/public/VerticalArticle";
import { getVerticalListicle, PUBLIC_VERTICAL_LISTICLES } from "../../../lib/verticalContent.mjs";
export default VerticalArticle;
export function getStaticPaths() { return { paths: PUBLIC_VERTICAL_LISTICLES.filter((item) => item.vertical === "java").map((item) => ({ params: { slug: item.slug } })), fallback: false }; }
export function getStaticProps({ params }) { return { props: { listicle: getVerticalListicle("java", params.slug) } }; }
