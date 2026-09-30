<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Mandatory tech-blog completion gate

For every tech-blog addition or edit, read `scripts/validation/README.md`, perform
its independent semantic review, and run `npm run verify:tech-blog` on the final
files. Do not report completion from a partial suite, compilation alone, or a
failed/stale gate. Add course-specific behavioral regressions and register every
declared Java course's fixture. Record actual results and infrastructure limits.
The gate does not promise zero bugs and does not authorize deployment or publishing.
