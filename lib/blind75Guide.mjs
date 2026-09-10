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
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/t[dh]>\s*<t[dh][^>]*>/gi, " | ")
    .replace(/<[^>]+>/g, "")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim());
}

export function extractBlind75GuideEntryFromHtml(html, problem) {
  const order = Number(problem?.order);
  if (!Number.isInteger(order) || order < 1) return null;

  const startPattern = new RegExp(`<h2><a id="problem-${order}"><\\/a><strong>${order}\\. [^<]+<\\/strong><\\/h2>`);
  const start = String(html).search(startPattern);
  if (start < 0) return null;

  const nextPattern = new RegExp(`<h2><a id="problem-${order + 1}"><\\/a><strong>${order + 1}\\. `);
  const remainder = String(html).slice(start);
  const next = remainder.search(nextPattern);
  const chapter = next < 0 ? remainder : remainder.slice(0, next);
  const matches = [...chapter.matchAll(SECTION_PATTERN)];

  return {
    title: problem.title,
    sections: matches.map((match, index) => {
      const sectionStart = match.index + match[0].length;
      const sectionEnd = index + 1 < matches.length ? matches[index + 1].index : chapter.length;
      return {
        heading: decodeHtml(match[1]),
        content: htmlToText(chapter.slice(sectionStart, sectionEnd)),
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
