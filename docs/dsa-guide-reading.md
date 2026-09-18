# DSA guide reading repair

The Blind 75 guide previously flattened DOCX tables into text. Paragraph breaks inside cells separated variable names from their roles and exposed pipe separators. The loader now retains table headers and rows alongside its backward-compatible plain `content` field. The reader renders semantic tables with row/column headings, wrapped cells, and a keyboard-accessible overflow container.

Canonical solution overlays replace structured blocks together with plain text so old archival content cannot override audited content. Canonical input/expected examples stored in the old two-column text format are also recovered as tables. Text is rendered through React, never injected as HTML. Irregular archival tables retain a plain-text fallback.

Section links let readers jump to the state model, solution, examples, or complexity without searching through the whole guide. Validation covers extraction, canonical replacement, real guide API responses, light-mode layouts at 390/768/1440 pixels, code navigation, modal dismissal, and existing DSA interactions in Chromium, Firefox, and WebKit.
