# Editorial provenance and correction workflow

InterviewIQ is the product name. ElevatePrep describes the current hosting address,
`elevateprep.vercel.app`; it does not establish company or domain ownership.
The shared identity and capability requirements live in `lib/productIdentity.mjs`.

## Content inventory

`lib/contentInventory.mjs` derives public counts at build time from canonical
repository sources. `/capabilities#content-inventory` publishes each definition.
The learning catalog includes several formats; its entry count must never be
relabeled as the number of courses. Mirrored Blind75/fresher/daily views are one
problem bank, not separate sets. Interview-question totals read actual topic JSON
entries instead of relying on advertised topic counts. Counts are not added into
an aggregate claim about unique outcomes or learner readiness.

## Metadata and versions

`lib/editorialWorkflow.mjs` schema version 1 assembles article provenance for the
registered tech blogs, curated Java tutorials, reader/stack guides, AI engineering
and detective cases. Each record includes canonical route, source registry,
SHA-256 content revision, recorded source date (or null), named-review status,
verification entry point and last-execution date (or null). The digest hashes the
assembled article object with JSON serialization; it identifies a revision within
this assembly scheme, not a Git commit or a stable cross-schema identifier.
Changing the serialization scheme requires a metadata schema-version change.

Source remains versioned in Git. A fingerprint or authored date is not a review
approval. Do not populate reviewer names, execution dates, runtime results or
publication status without evidence. Fixtures and validation commands identify
how to reproduce checks; registration alone is not a passing result. Existing
article runtime claims retain their original stated scope and date. The public
provenance page does not infer a newer successful run from them.

## Correction procedure

1. Receive the affected URL, section, expected behavior and reproduction through
   `/corrections`. For direct support use the public support contact listed in the
   privacy policy. Never include credentials or private customer incident data.
2. A maintainer verifies the claim against primary references, identifies runtime
   versions and distinguishes complete programs, contextual fragments and models.
3. Make the smallest source correction and add meaningful boundary regressions.
   Follow `docs/interview-answer-standard.md` for interview-answer changes.
4. Perform independent semantic review and run the full mandatory tech-blog gate
   for tech-blog edits, following `scripts/validation/README.md`. Record actual
   command results, report locations and infrastructure limits in the change.
5. Update the public correction log with the issue, affected URL, resolution and
   validation limits. Keep the state `Fixed in source` until the deployed result
   has been observed. Publishing requires its own authorization.

This describes a repository workflow, not an implemented CMS, an assigned review
team, an automatic deployment, a moderation SLA or a correctness guarantee.
