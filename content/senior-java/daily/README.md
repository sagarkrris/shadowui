# Daily SDE-3 Java practice sets

The Markdown files are the authored source. After adding or correcting a set, run
`ruby scripts/render-senior-java-daily.rb` and commit its matching HTML fragment.
The site reads the checked-in HTML, so a production build does not need Ruby.

Register each set in `lib/seniorJavaDaily.mjs` with a unique dated URL slug and
sequential set number. The catalog drives the index, static pages, and sitemap.
Keep the 12 numbered questions, spoken answers, examples, and follow-ups in the
source; run `node --test test/seniorJavaDaily.test.mjs` after rendering.

Sets 1–3 preserve the complete answers from the three 7 October 2026 Codex runs.
