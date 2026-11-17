import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { sharedChecklist } from '../../lib/practiceEvidence.mjs';
import { PRODUCT_IDENTITY } from '../../lib/productIdentity.mjs';

export default function ReadinessShare() {
  const { query } = useRouter();
  const shared = sharedChecklist(query);
  return <><Head><title>Self-reported preparation checklist · {PRODUCT_IDENTITY.name}</title><meta name="robots" content="noindex, nofollow" /><meta name="description" content="An unverified, self-reported preparation checklist. This shared page is not a verified assessment or hiring prediction." /><meta property="og:title" content="Self-reported preparation checklist · InterviewIQ" /><meta property="og:description" content="Unverified shared checklist. Values are supplied by the link creator and can be edited." /></Head><main style={{background:'#f8f9fa',color:'#202124',minHeight:'100vh',padding:24,display:'grid',placeItems:'center'}}><article style={{background:'#fff',border:'1px solid #dadce0',borderRadius:8,padding:'32px 24px',maxWidth:600,width:'100%'}}><h1>Self-reported preparation checklist</h1><p role="note"><strong>Unverified shared values.</strong> This link’s creator supplies the values in its URL. Anyone can change them. They are not a verified InterviewIQ assessment, a certification, or a probability of receiving an offer.</p><p style={{fontSize:48,fontWeight:800,margin:'20px 0'}}>{shared.score === null ? 'No valid value supplied' : `${shared.score}%`}</p><h2>{shared.label}</h2><p>{shared.stack}</p><p>Checklist activity combines different kinds of self-reported preparation and AI estimates. For your own learning decisions, inspect question evidence, topic coverage and comparable retests.</p><p><Link href="/progress">Review your device-held practice evidence →</Link></p><p><Link href="/diagnostic">Try the optional baseline diagnostic →</Link></p><p>{PRODUCT_IDENTITY.description}</p></article></main></>;
}
