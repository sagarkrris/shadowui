import Link from 'next/link';
export default function PracticeRecommendations({gaps}){
 if(!gaps.length)return null;
 return <section aria-label="Targeted practice recommendations"><h2>Practise the gaps from your checks</h2><p>These suggestions come from failed practice checks, not a prediction of interview readiness. Passing the related check clears its suggestion.</p>{gaps.map(gap=><article key={gap.id}><h3><Link href={gap.href}>{gap.title} →</Link></h3><p>{gap.detail}</p><p><strong>Try next:</strong> {gap.drill}</p></article>)}</section>;
}
