function average(values) {
  if (!values?.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function list(items, fallback = "- Not available yet") {
  return items?.length ? items.map((item) => `- ${item}`).join("\n") : fallback;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function closeList(lines, html) {
  if (!lines.inList) return;
  html.push("</ul>");
  lines.inList = false;
}

export function buildPrepReportMarkdown({
  profile = {},
  resumeAnalysis = null,
  jobDescriptionAnalysis = null,
  weakSpots = [],
  mockScores = [],
  roadmap = null,
  companyFocus = null,
  nextActions = [],
} = {}) {
  const averageScore = average(mockScores);
  const resumeScore = Number.isFinite(resumeAnalysis?.score) ? `${resumeAnalysis.score}%` : "Not analyzed yet";
  const jobDescriptionScore = Number.isFinite(jobDescriptionAnalysis?.score) ? `${jobDescriptionAnalysis.score}%` : "Not analyzed yet";
  const missingSkills = (resumeAnalysis?.missingSkills || []).map((skill) => skill.name || skill).filter(Boolean);
  const jobDescriptionMissingSkills = (jobDescriptionAnalysis?.missingSkills || []).map((skill) => skill.name || skill).filter(Boolean);
  const roadmapLines = (roadmap?.days || []).slice(0, 7).map((day) => `- Day ${day.day}: ${day.title} - ${day.focus} (${day.minutes}m)`);

  return [
    "# InterviewIQ Prep Report",
    "",
    `Generated: ${new Date().toISOString().slice(0, 10)}`,
    "",
    "## Candidate",
    `- Name: ${profile.name || "Candidate"}`,
    `- Target Role: ${profile.position || "Not set"}`,
    `- Stack: ${profile.stack || "Not set"}`,
    "",
    "## Resume",
    `- Resume Score: ${resumeScore}`,
    "### Resume Gaps",
    list(missingSkills),
    "### Job Description Match",
    `- Job Description Match: ${jobDescriptionScore}`,
    list(jobDescriptionMissingSkills),
    "",
    "## Mock Performance",
    `- Completed Mocks: ${mockScores.length}`,
    `- Average Mock Score: ${averageScore === null ? "Not available yet" : `${Math.round(averageScore * 10) / 10}/10`}`,
    "### Weak Spots",
    list(weakSpots),
    "",
    "## Roadmap",
    list(roadmapLines),
    "",
    "## Company Prep Focus",
    `- Company: ${companyFocus?.company || "Not selected"}`,
    `- Topic: ${companyFocus?.topic || "Not selected"}`,
    "",
    "## Next Actions",
    list(nextActions),
    "",
  ].join("\n");
}

export function buildPrepReportHtml(markdown = "") {
  const state = { inList: false };
  const body = [];

  String(markdown).split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList(state, body);
      return;
    }

    if (trimmed.startsWith("### ")) {
      closeList(state, body);
      body.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
      return;
    }

    if (trimmed.startsWith("## ")) {
      closeList(state, body);
      body.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      return;
    }

    if (trimmed.startsWith("# ")) {
      closeList(state, body);
      body.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
      return;
    }

    if (trimmed.startsWith("- ")) {
      if (!state.inList) {
        body.push("<ul>");
        state.inList = true;
      }
      body.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
      return;
    }

    closeList(state, body);
    body.push(`<p>${escapeHtml(trimmed)}</p>`);
  });

  closeList(state, body);

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>InterviewIQ Prep Report</title>
  <style>
    body { color: #111827; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.5; margin: 40px; }
    h1 { border-bottom: 2px solid #111827; font-size: 28px; margin: 0 0 16px; padding-bottom: 12px; }
    h2 { color: #1f2937; font-size: 18px; margin: 24px 0 8px; }
    h3 { color: #374151; font-size: 14px; margin: 14px 0 6px; }
    p { margin: 8px 0; }
    ul { margin: 6px 0 12px 20px; padding: 0; }
    li { margin: 4px 0; }
    @media print { body { margin: 24px; } }
  </style>
</head>
<body>${body.join("\n")}</body>
</html>`;
}
