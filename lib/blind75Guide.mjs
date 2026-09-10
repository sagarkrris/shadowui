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
