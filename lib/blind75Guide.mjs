import javaReferences from "./blind75JavaReferences.json" with { type: "json" };
const SECTION_PATTERN = /<h3><strong>([^<]+)<\/strong><\/h3>/g;

function decodeHtml(value = "") {
  return String(value)
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html = "") {
  return decodeHtml(String(html)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

function guideBlocks(html) {
  const blocks = [];
  let cursor = 0;
  for (const table of html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)) {
    const text = htmlToText(html.slice(cursor, table.index));
    if (text) blocks.push({ type: 'text', content: text });
    const rows = [...table[0].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(row =>
      [...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(cell => htmlToText(cell[1])));
    if (rows.length > 1 && rows[0].length && rows.every(row => row.length === rows[0].length)) {
      blocks.push({ type: 'table', headers: rows[0], rows: rows.slice(1) });
    } else {
      blocks.push({ type: 'text', content: htmlToText(table[0]) });
    }
    cursor = table.index + table[0].length;
  }
  const text = htmlToText(html.slice(cursor));
  if (text) blocks.push({ type: 'text', content: text });
  return blocks;
}

function canonicalBlocks(heading, content) {
  if (heading === 'Test it yourself') {
    const rows = content.trim().split(/\n\s*\n/).map(row => row.split(/\n[ \t]*\|[ \t]*/).map(cell => cell.trim()));
    if (rows.length > 1 && rows.every(row => row.length === 2)) return [{ type: 'table', headers: rows[0], rows: rows.slice(1) }];
  }
  return [{ type: 'text', content }];
}

export function extractBlind75GuideEntryFromHtml(html, problem) {
  if (!problem?.id) return null;
  const headings = [...String(html).matchAll(/<h2><a id="problem-(\d+)"><\/a><strong>\d+\. ([^<]+)<\/strong><\/h2>/g)];
  const slug = (title) => decodeHtml(title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const heading = headings.find((match) => slug(match[2]) === problem.id);
  if (!heading) return null;
  const remainder = String(html).slice(heading.index + heading[0].length);
  // Category introductions belong to the guide, not to the previous answer.
  const next = remainder.search(/<h[12][ >]/);
  const chapter = next < 0 ? remainder : remainder.slice(0, next);
  const matches = [...chapter.matchAll(SECTION_PATTERN)];

  return {
    title: problem.title,
    sourceTitle: decodeHtml(heading[2]),
    sourceOrder: Number(heading[1]),
    sections: matches.map((match, index) => {
      const sectionStart = match.index + match[0].length;
      const sectionEnd = index + 1 < matches.length ? matches[index + 1].index : chapter.length;
      return {
        heading: decodeHtml(match[1]),
        content: htmlToText(chapter.slice(sectionStart, sectionEnd)),
        blocks: guideBlocks(chapter.slice(sectionStart, sectionEnd)),
      };
    }).filter((section) => section.content),
  };
}

export async function readBlind75GuideHtml(buffer) {
  const mammoth = await import("mammoth");
  const result = await mammoth.default.convertToHtml({ buffer });
  return result.value;
}

export async function readBlind75GuideEntry({ buffer, problem }) {
  const html = await readBlind75GuideHtml(buffer);
  return extractBlind75GuideEntryFromHtml(html, problem);
}

// Overlay audited content onto archival prose so every in-app solution and worked
// example comes from the same canonical definition, including Binary Search.
export function buildCanonicalGuideEntry(problem, archivalEntry = null) {
  const reference = javaReferences[problem?.id];
  if (!reference) return archivalEntry;
  const replacements = {
    "Problem in one sentence": reference.statement,
    "Java solution": reference.code,
    "Worked example": reference.example,
    "Why it works": reference.invariant,
    Complexity: reference.complexity,
    "Test it yourself": reference.tests,
    "Edge cases": reference.constraints,
  };
  const sections = (archivalEntry?.sections || []).map(section => replacements[section.heading]
    ? { ...section, content: replacements[section.heading], blocks: canonicalBlocks(section.heading, replacements[section.heading]) }
    : section);
  for (const [heading, content] of Object.entries(replacements)) if (!sections.some(section => section.heading === heading)) sections.push({ heading, content, blocks: canonicalBlocks(heading, content) });
  return { ...archivalEntry, title: problem.title, sourceTitle: problem.title, source: reference.source, sections };
}
