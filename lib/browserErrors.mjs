// A fixed route vocabulary prevents URLs, account identifiers and search terms
// from becoming diagnostic data. Unknown routes share the /other bucket.
const ROUTES = new Set([
  '/advice-fails/[slug]',
  '/advice-fails',
  '/assessments',
  '/aws/[slug]',
  '/build/[slug]',
  '/build',
  '/build/java-dependency-injection',
  '/build/node-service-contract',
  '/build/practice/[slug]',
  '/capabilities',
  '/corrections',
  '/detective/[slug]',
  '/detective',
  '/diagnostic',
  '/digest',
  '/editorial',
  '/explain-log/[slug]',
  '/explain-log',
  '/explore',
  '/guides/[stack]/[slug]',
  '/guides',
  '/hld/[slug]',
  '/hld',
  '/',
  '/java/[slug]',
  '/java',
  '/java/listicle/[slug]',
  '/java/releases',
  '/java/roadmap',
  '/java/tutorial/[slug]',
  '/javascript/[slug]',
  '/labs/[slug]',
  '/labs/git',
  '/labs',
  '/labs/sql',
  '/learn/ai-engineering',
  '/learn',
  '/learn/roadmaps/[slug]',
  '/learn/spring-transactions',
  '/license',
  '/lld/[slug]',
  '/lld',
  '/notebook',
  '/practice',
  '/prepare',
  '/privacy',
  '/progress',
  '/python/[slug]',
  '/requests',
  '/reset-password',
  '/resources/[slug]',
  '/resources',
  '/scenarios/[id]',
  '/senior-java-interview/[slug]',
  '/senior-java-interview/code-comprehension',
  '/senior-java-interview/daily/[slug]',
  '/senior-java-interview/daily',
  '/senior-java-interview',
  '/senior-java-interview/topics/[topic]',
  '/senior-java-interview/topics',
  '/series/[slug]',
  '/series',
  '/share/readiness',
  '/sign-in',
  '/sign-up',
  '/spring/[slug]',
  '/sql/[slug]',
  '/symptoms/[slug]',
  '/symptoms',
  '/system-design/[slug]',
  '/system-design/visual-guide',
  '/tech-blogs/[slug]',
  '/tech-blogs',
  '/tech-buddy-demo',
  '/time-machine/database-decisions',
  '/weekly/[slug]',
  '/weekly',
  '/other',
]);
const KINDS = new Set(['runtime_error', 'unhandled_rejection', 'render_error']);

export function normalizeBrowserError(input) {
  if (!input || !KINDS.has(input.kind)) return null;
  const location = value => Number.isSafeInteger(value) && value > 0 && value <= 10_000_000 ? value : 0;
  return { kind: input.kind, route: ROUTES.has(input.route) ? input.route : '/other', line: location(input.line), column: location(input.column) };
}

export function createBrowserErrorReporter({ send, maxReports = 10 } = {}) {
  const seen = new Set();
  return input => {
    const report = normalizeBrowserError(input);
    if (!report || seen.size >= maxReports) return;
    const key = JSON.stringify(report);
    if (seen.has(key)) return;
    seen.add(key);
    // Diagnostics must never throw or recursively report transport failures.
    try { Promise.resolve(send(report)).catch(() => {}); } catch { /* Best effort. */ }
  };
}

const report = createBrowserErrorReporter({
  send: payload => fetch('/api/client-errors', {
    method: 'POST', credentials: 'omit', mode: 'same-origin', keepalive: true,
    referrerPolicy: 'origin', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }),
});

export function reportBrowserError(input) { report(input); }

export function installBrowserErrorReporting(target, route, reportError = reportBrowserError) {
  const onError = event => reportError({ kind: 'runtime_error', route, line: event.lineno, column: event.colno });
  const onRejection = () => reportError({ kind: 'unhandled_rejection', route });
  target.addEventListener('error', onError);
  target.addEventListener('unhandledrejection', onRejection);
  return () => {
    target.removeEventListener('error', onError);
    target.removeEventListener('unhandledrejection', onRejection);
  };
}
