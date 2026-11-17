import ReaderLayout from '../components/reader/ReaderLayout';
import Diagnostic from '../components/diagnostic/Diagnostic';
import { diagnosticContent } from '../lib/diagnosticContent.mjs';
export default function DiagnosticPage(props) {
  return <ReaderLayout title="Find your next learning step" description="An optional five-question baseline with evidence, focused exercises, and a practical learning plan."><Diagnostic {...props} /></ReaderLayout>;
}
export async function getStaticProps() { return { props: await diagnosticContent() }; }
