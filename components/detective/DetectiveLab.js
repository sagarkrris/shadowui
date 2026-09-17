import { useState } from "react";
import { indexWork, replayTenantCache, retryWork } from "../../lib/productionDetective.mjs";
import styles from "../../styles/ProductionDetective.module.css";

export default function DetectiveLab({ lab }) {
  const [run, setRun] = useState(false);
  const [choice, setChoice] = useState(false);
  const [attempts, setAttempts] = useState(3);
  const [layers, setLayers] = useState(3);
  const [reads, setReads] = useState(10);
  const retries = retryWork(attempts, layers);
  const work = indexWork(reads);
  const cache = replayTenantCache(choice);
  return <section className={styles.lab} aria-labelledby="lab-title"><p className={styles.eyebrow}>TRY IT YOURSELF</p><h3 id="lab-title">{lab.title}</h3><p>{lab.prompt}</p>
    {lab.kind === "map" && <><pre tabIndex={0} aria-label="Java prediction snippet"><code>{lab.code}</code></pre><button onClick={() => setRun(true)}>Run the trace</button>{run && <div role="status"><h4>Output</h4><pre>{lab.output}</pre><h4>Execution trace</h4><pre>{lab.trace}</pre><p>Recorded Java example; no code is sent to a server.</p></div>}</>}
    {lab.kind === "transaction" && <><label className={styles.check}><input type="checkbox" checked={choice} onChange={e => setChoice(e.target.checked)} /> Call an injected transactional collaborator</label><div className={styles.result} role="status">{choice ? "Controller → submit → collaborator proxy → BEGIN → debit → exception → ROLLBACK. Both balances unchanged." : "Controller → submit → this.transfer → no advice → debit auto-commits → exception. Debit remains."}</div><p className={styles.small}>Teaching model of the stated proxy configuration; not a Spring runtime.</p></>}
    {lab.kind === "retry" && <><label className={styles.slider}>Total attempts per layer: {attempts}<input type="range" min="1" max="5" value={attempts} onChange={e => setAttempts(Number(e.target.value))} /></label><label className={styles.slider}>Retrying layers: {layers}<input type="range" min="1" max="3" value={layers} onChange={e => setLayers(Number(e.target.value))} /></label><div className={styles.result} role="status"><strong>{retries.perRequest} leaf attempts per user request</strong><p>At 100 arrivals/s: up to {retries.nested.toLocaleString("en-US")} attempts/s with nested retries; {retries.singleOwner.toLocaleString("en-US")} with one retry owner.</p></div><p className={styles.small}>Worst case: every call fails, every budget is exhausted, and no deadline cuts off the attempt tree. Jitter changes timing, not this maximum.</p></>}
    {lab.kind === "index" && <><label className={styles.slider}>Reads per 100 operations: {reads}<input type="range" min="0" max="100" value={reads} onChange={e => setReads(Number(e.target.value))} /></label><div className={styles.result} role="status"><p>Without index: <strong>{work.without} work units</strong></p><meter aria-label="Work without index" min="0" max="1000" value={work.without} /><p>With index: <strong>{work.with} work units</strong></p><meter aria-label="Work with index" min="0" max="1000" value={work.with} /></div><p className={styles.small}>Illustrative arithmetic for {100 - reads} writes and {reads} reads, not a latency estimate or a database benchmark.</p></>}
    {lab.kind === "cache" && <><label className={styles.check}><input type="checkbox" checked={choice} onChange={e => setChoice(e.target.checked)} /> Include the trusted tenant in the cache key</label><div className={styles.result} role="status"><pre>{`Alder key: ${cache.alderKey}\nBirch key: ${cache.birchKey}\nBirch lookup: ${cache.hit ? "HIT" : "MISS → tenant-scoped database query"}\nReturned: ${cache.returned}`}</pre><strong>{cache.hit ? "Isolation failed: wrong tenant's report." : "Isolation preserved for these two requests."}</strong></div><p className={styles.small}>Both requests are authorized before lookup. Namespacing alone never authorizes access.</p></>}
  </section>;
}
