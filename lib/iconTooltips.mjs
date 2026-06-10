const AUTO_TITLE_ATTR = "data-auto-icon-title";

const ACRONYMS = {
  ai: "AI",
  api: "API",
  cpu: "CPU",
  db: "DB",
  dsa: "DSA",
  hld: "HLD",
  id: "ID",
  io: "I/O",
  jwt: "JWT",
  lld: "LLD",
  github: "GitHub",
  openai: "OpenAI",
  sql: "SQL",
  ui: "UI",
  url: "URL",
};

function titleCasePart(part) {
  const clean = String(part || "").trim();
  if (!clean) return "";
  const acronym = ACRONYMS[clean.toLowerCase()];
  if (acronym) return acronym;
  if (/^\d+$/.test(clean)) return clean;
  return `${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
}

export function tablerIconClassToLabel(className) {
  const iconClass = String(className || "")
    .split(/\s+/)
    .find((item) => item.startsWith("ti-") && item !== "ti");

  if (!iconClass) return "";

  return iconClass
    .replace(/^ti-/, "")
    .split("-")
    .map(titleCasePart)
    .filter(Boolean)
    .join(" ");
}

function nearestControlLabel(icon) {
  const control = icon.closest?.("button[aria-label], button[title], a[aria-label], a[title], [role='button'][aria-label], [role='button'][title]");
  if (!control) return "";
  return control.getAttribute("aria-label") || control.getAttribute("title") || "";
}

function titleForIcon(icon) {
  return nearestControlLabel(icon) || tablerIconClassToLabel(icon.className);
}

export function applyIconTooltips(root = globalThis.document) {
  if (!root?.querySelectorAll) return 0;

  const icons = [
    ...(root.matches?.(".ti") ? [root] : []),
    ...root.querySelectorAll(".ti"),
  ];

  let updated = 0;
  icons.forEach((icon) => {
    const explicitTitle = icon.getAttribute("title");
    const autoTitle = icon.getAttribute(AUTO_TITLE_ATTR);
    if (explicitTitle && !autoTitle) return;

    const nextTitle = titleForIcon(icon);
    if (!nextTitle) return;

    if (explicitTitle !== nextTitle) {
      icon.setAttribute("title", nextTitle);
      updated += 1;
    }
    icon.setAttribute(AUTO_TITLE_ATTR, nextTitle);
  });

  return updated;
}

export function installIconTooltips(documentRef = globalThis.document) {
  if (!documentRef?.body || !globalThis.MutationObserver) return () => {};

  applyIconTooltips(documentRef);

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes") {
        applyIconTooltips(mutation.target);
        return;
      }

      mutation.addedNodes.forEach((node) => {
        if (node?.nodeType === 1) applyIconTooltips(node);
      });
    });
  });

  observer.observe(documentRef.body, {
    attributeFilter: ["class", "title", "aria-label"],
    attributes: true,
    childList: true,
    subtree: true,
  });

  return () => observer.disconnect();
}
