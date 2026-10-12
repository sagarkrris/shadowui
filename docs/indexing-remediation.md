# Search Console indexing remediation — 12 October 2026

The authenticated report displayed 69 indexed pages and six excluded URLs:

| URL | Google's recorded exclusion | Source action |
| --- | --- | --- |
| `/explain-log/[slug]` | Not found | Permanent redirect for this exact obsolete template, including percent-encoded brackets, to `/explain-log`. Unknown real slugs still return 404. |
| `/practice?workspace=java-digest` | Duplicate without user-selected canonical | One stable `/practice` canonical and intentional `noindex, follow` in HTML and the HTTP header. Workspace parameters and behavior remain available. |
| `/corrections?article=/tech-blogs/real-time-communication-patterns` | Alternate with proper canonical | Preserve canonical `/corrections` and the prefilled article context. This is an expected exclusion, not a broken public page. |
| `/tech-blogs/java-money-production` | Crawled, currently not indexed | Preserve rendered content and self-canonical; add a descriptive homepage link. |
| `/build/practice/webhook-version-gate` | Crawled, currently not indexed | Preserve rendered content and self-canonical; add a descriptive homepage link. |
| `/explain-log/blocked-pool-thread-dump` | Crawled, currently not indexed | Preserve rendered content and self-canonical; add a descriptive homepage link. |

## Evidence and scope

Live HTTP reads confirmed all three content pages returned successfully with
self-canonical URLs on `elevateprep.vercel.app`. The live sitemap already contained
these real URLs and did not contain `[slug]`. The live practice HTML contained no
canonical or robots meta directive. No site-owned link to the literal placeholder
was found in the source inspection; its original discovery source remains unknown.
The redirect is a targeted recovery, not evidence that its source was found.

`lib/siteUrl.mjs` is now the common origin for public canonical tags, structured
metadata, robots, sitemap and RSS. `NEXT_PUBLIC_SITE_URL` overrides the default
`https://elevateprep.vercel.app`; surrounding whitespace and trailing slashes are
normalized. Previously some public index pages ignored the deployment origin and
hard-coded `interviewiq.app`. Preview deployments must supply their intended
origin or restrict indexing separately; this change does not provision preview
access controls.

Practice is an interactive personal workspace, so its intentional search exclusion
is independent of canonical consolidation. It remains crawlable so Google can
read `noindex`; robots.txt must not disallow it. Public lessons remain indexable.
The nested Java Digest article view uses the same canonical key and value, so
client rendering cannot introduce a competing query-based canonical.

## Independent semantic review

Reviewed the complete source diff separately from implementation. This change
adds no Java examples, course declarations, fixtures, technical diagrams, or
runtime claims. Existing Java course fixtures remain selected by the full gate.

- Verified Next 16.3.1 Head, redirects, and headers behavior against installed
  documentation. Regression checks execute raw/encoded placeholder redirects,
  an unknown-slug 404, practice directives/canonical on query variants,
  corrections query context, and no-JavaScript content discovery.
- Challenged empty/whitespace/custom origins and trailing slashes. The origin is
  deployment configuration, not user input. No new request-derived origin or
  redirects to external sites are introduced.
- Verified that permanent redirect matching is limited to the literal template.
  Real missing content is not rewritten to a successful unrelated page.
- Existing correction variants retain their expected exclusion. No redirect
  strips the article query or damages the correction submission flow.
- The three content pages were already technically eligible according to live
  responses. Stronger internal links are a discovery improvement, not a proved
  cure for Google's selection. No quality penalty or root cause is asserted.
- Concurrent completion, cancellation, retries, and ownership are not applicable
  to these static metadata/configuration changes. Practice behavior and saved
  learning progress were not redesigned.
- The indexing browser regressions are registered in the mandatory content gate.
  They verify HTTP responses, emitted metadata, sitemap entries, and rendered
  links; they do not simulate Google's indexing decision.

Primary sources:

- [Google: Page indexing report](https://support.google.com/webmasters/answer/7440203)
- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: Crawlable links](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- [Google: noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)

## Verification and rollout

Focused unit checks: `node --test test/siteUrl.test.mjs test/publicSeo.test.mjs
test/javaDigestUi.test.mjs` — 9 passed. Initial indexing browser suite — 4 passed.
Full final validation: `npm run verify:tech-blog`, using the existing ARM Git
wrapper for this Mac. Logs: `/private/tmp/indexing-fix-gate.log`; the gate's
`report.json` records the actual final outcome and full evidence directory.

These source fixes must be deployed before the live responses change. After
verifying the deployed responses, inspect the three real pages in Search Console
and request indexing if eligible. Let Google recrawl intentional exclusions.
Only start fix validation for categories whose deployed fix has been verified.
No Search Console validation/indexing request or production deployment is claimed
by the local regression suite. Indexing and report refresh remain Google's work.
