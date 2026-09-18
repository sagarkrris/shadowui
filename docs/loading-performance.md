# Homepage loading investigation

Measured on 2026-09-18 against https://elevateprep.vercel.app/.

The live homepage returned `cache-control: private, no-cache, no-store,
max-age=0, must-revalidate` and `x-vercel-cache: MISS`. Its only server-side
logic was compatibility redirects for old workspace URLs. The first HTTP
request took 2.36 seconds to its first byte (including about 0.92 seconds for
DNS, connection and TLS); two subsequent requests took about 0.90 seconds.
These are HTTP measurements, not browser paint or complete-load timings.

The shared application bundle also included article tools and their content
catalogues on every route. The homepage imported complete case content for
three summary cards. Visible links prefetched other experiences, and the
external icon stylesheet could block initial rendering.

## Changes

- Generate the public homepage at build time. Configuration redirects retain
  incoming workspace query parameters, with a client-router fallback.
- Pass catalogue summaries as static props and load article tools only on
  article routes.
- Disable viewport prefetch for homepage and shared reader navigation links.
  Next's Pages Router can still prefetch on hover.
- Load decorative icon CSS after hydration, retaining a no-JavaScript fallback.
  Icons may appear later; readable text no longer waits for that stylesheet.

## Bundle comparison

Production build manifest initial JavaScript, deduplicated across `_app` and
each route. Gzip uses Node's default gzip compression on each emitted file;
these are reproducible estimates, not measured network transfers.

| Route | Before gzip bytes | After gzip bytes |
| --- | ---: | ---: |
| `/` | 267,703 | 131,911 |
| `/symptoms` | 263,603 | 139,367 |
| `/practice` | 445,279 | 431,452 |

Including the connected learning homepage, the initial JavaScript estimate falls by 51%. The build's prerender
manifest confirms `/` uses static computation without revalidation.

These changes require deployment. Production CDN cache behavior and browser
paint/interaction performance still need measurement after deployment; no
specific end-to-end loading speedup is claimed from these local measurements.

Validation: production build and ESLint passed; all 562 unit tests and 39
reader browser checks passed across Chromium, Firefox, and WebKit. Browser
coverage includes static homepage generation with an unavailable icon CDN,
legacy redirects with query preservation, article tools, saved practice,
accessibility, and scrolling at phone, tablet, and desktop widths.
