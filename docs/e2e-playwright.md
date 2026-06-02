# Playwright E2E Coverage

This suite lives in `e2e/` and is wired through `playwright.config.mjs`.

## Commands

- `npm run test:e2e` runs the default Chromium suite.
- `npm run test:e2e:headed` runs the default suite with a visible browser.
- `npm run test:e2e:browser-matrix` enables the optional Chrome, Firefox, WebKit, and Edge projects when those browsers are installed on the machine.

## Automated Scope

- Onboarding and personalization: happy path, validation, stack-specific topic preview, persistence, and XSS rendering smoke.
- Navigation and content modules: major sidebar categories, subtopic rendering, Agentic UI Course content/media surfaces, and current free-only access surface.
- Company prep and mock rounds: company search states, mode toggles, calibrated difficulty payloads, and mocked chat responses.
- Feedback and weak spots: poor database feedback updates the Weak Spots surface without a hard refresh.
- DSA Visual Lab: guided stage buttons, generated interview challenges, answer feedback, and local fallback when generation fails.
- Non-functional smoke: mobile/tablet/desktop usability, accessible labels for core controls, API latency loading state, and repeated navigation stability.

## Manual Or Environment-Dependent Checks

- Staging API payload monitoring needs staging endpoints and credentials.
- Browser matrix runs require installed browser binaries/channels on the runner.
- Lighthouse and deep axe scans are not included because `@axe-core/playwright` was unavailable from the configured registry in this environment; the suite still checks key accessible names and keyboard paths.
- Backend load testing and memory profiling beyond lightweight smoke checks should run in a dedicated performance environment.
