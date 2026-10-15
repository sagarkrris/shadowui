import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../../styles/BookReader.module.css";

const SETTINGS_KEY = "interviewiq.book.settings.v1";
const BLOCKS = "h1,h2,h3,h4,h5,h6,p,pre,table,li,figure,details,form,[data-course-demo],section[aria-label^='Practice ']";
const FIGURES = "figure,[data-course-diagram]";
function readingBlocks(root) {
  return [...root.querySelectorAll(BLOCKS)].filter(element => !element.closest('.reader-controls-host,[data-reader-transient]'));
}
function boundsFor(root) {
  return root.closest('[data-reader-scroll],.reader-article-scroll,.java-digest-reader-scroll,[data-detective-scroll]')?.getBoundingClientRect()
    || { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth };
}
function moveInto(element, destination) {
  const placeholder = document.createComment("Book Mode reading position");
  element.before(placeholder);
  destination.appendChild(element);
  return () => { if (placeholder.parentNode) placeholder.replaceWith(element); };
}
const defaults = { theme: "paper", size: "18", font: "serif", spacing: "1.7", layout: "spread" };
function readSaved(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Reading works without storage. */ }
}

export default function BookReader({ children, target, storageId, title, previous, next, contentsHref = "/senior-java-interview", chapterBase = "/senior-java-interview" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState(defaults);
  const [pagination, setPagination] = useState({ page: 0, pages: 1, perView: 2 });
  const [headings, setHeadings] = useState([]);
  const [figures, setFigures] = useState([]);
  const [diagrams, setDiagrams] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const expandedDialog = useRef(null);
  const expandedContent = useRef(null);
  const restoreContent = useRef(() => {});
  const restoreExpanded = useRef(() => {});
  const isExpanded = useRef(false);
  const dialog = useRef(null);
  const regular = useRef(null);
  const flow = useRef(null);
  const viewport = useRef(null);
  const runway = useRef(null);
  const trigger = useRef(null);
  const anchor = useRef(0);
  const hashApplied = useRef(false);
  const handledHash = useRef(null);
  const metrics = useRef({ stride: 1, pages: 1, perView: 2 });
  const id = useId();
  const contentRoot = target || regular.current;
  const positionKey = `interviewiq.book.position.v1.${storageId}`;

  useEffect(() => {
    anchor.current = 0;
    hashApplied.current = false;
    handledHash.current = null;
  }, [storageId]);

  useEffect(() => {
    const stored = readSaved(SETTINGS_KEY);
    if (stored && typeof stored === "object") {
      const valid = {};
      for (const [key, values] of Object.entries({ theme: ["paper", "sepia", "dark"], size: ["16", "18", "20", "22"], font: ["serif", "sans"], spacing: ["1.5", "1.7", "1.9"], layout: ["spread", "single"] })) {
        if (values.includes(stored[key])) valid[key] = stored[key];
      }
      setSettings({ ...defaults, ...valid });
    }
  }, []);

  function rememberVisible(root, paged) {
    const bounds = paged ? viewport.current.getBoundingClientRect() : boundsFor(root);
    const blocks = readingBlocks(root);
    const index = blocks.findIndex(element => {
      const rect = element.getClientRects()[0];
      return rect && rect.width > 0 && rect.bottom > bounds.top + 8 && rect.top < bounds.bottom && (!paged || rect.left >= bounds.left - 2 && rect.left < bounds.right);
    });
    if (index >= 0) anchor.current = index;
    save(positionKey, anchor.current);
  }

  function enter() {
    const contentRoot = target || regular.current;
    const saved = readSaved(positionKey);
    hashApplied.current = handledHash.current === window.location.hash;
    rememberVisible(contentRoot, false);
    // An explicit section link takes precedence over a previously saved place.
    if ((!window.location.hash || hashApplied.current) && Number.isSafeInteger(saved) && saved >= 0) {
      const candidate = readingBlocks(contentRoot)[saved]?.getBoundingClientRect();
      const bounds = boundsFor(contentRoot);
      if (anchor.current === 0 || (candidate && candidate.bottom > bounds.top && candidate.top < bounds.bottom)) anchor.current = saved;
    }
    setOpen(true);
  }
  function exit() {
    save(positionKey, anchor.current);
    restoreExpanded.current();
    expandedDialog.current?.close();
    isExpanded.current = false;
    setExpanded(null);
    restoreContent.current();
    dialog.current.close();
    setOpen(false);
    requestAnimationFrame(() => {
      if (contentRoot?.isConnected) readingBlocks(contentRoot)[anchor.current]?.scrollIntoView({ block: "start" });
      trigger.current?.focus({ preventScroll: true });
    });
  }
  function turn(direction) {
    const { stride, pages, perView } = metrics.current;
    const page = Math.max(0, Math.min(Math.floor((pages - 1) / perView) * perView, pagination.page + direction * perView));
    viewport.current.scrollLeft = page * stride;
    setPagination({ page, pages, perView });
    rememberVisible(flow.current, true);
  }
  function jumpTo(element) {
    if (!element) return;
    for (let parent = element.parentElement; parent && flow.current.contains(parent); parent = parent.parentElement) if (parent.tagName === "DETAILS" && !parent.open) parent.open = true;
    const { stride, perView, pages } = metrics.current;
    const offset = element.getBoundingClientRect().left - flow.current.getBoundingClientRect().left;
    const page = Math.max(0, Math.min(pages - 1, Math.floor((offset + 1) / stride)));
    viewport.current.scrollLeft = Math.floor(page / perView) * perView * stride;
    const panel = element.closest('[data-book-atomic]');
    if (panel && panel !== element) element.scrollIntoView({ block: "nearest", inline: "nearest" });
    setPagination({ page: Math.floor(page / perView) * perView, pages, perView });
    const index = readingBlocks(flow.current).indexOf(element);
    if (index >= 0) { anchor.current = index; save(positionKey, index); }
  }

  // Move a stable host rather than rerendering children in a different React tree.
  // This retains local state, DOM identity, editor drafts and ReaderTools portals.
  useLayoutEffect(() => {
    if (!open) return;
    const root = target || regular.current;
    const originalAttribute = root.getAttribute("data-book-content");
    root.setAttribute("data-book-content", "");
    const restore = moveInto(root, flow.current);
    restoreContent.current = () => {
      restore();
      if (originalAttribute === null) root.removeAttribute("data-book-content");
      else root.setAttribute("data-book-content", originalAttribute);
    };
    dialog.current.showModal();
    return () => { restoreExpanded.current(); restoreContent.current(); };
  }, [open, target]);

  useEffect(() => {
    if (!open) return;
    const root = flow.current;
    let frame;
    let active = true;
    const tabIndexes = new Map();
    const atomicAttributes = new Map();
    function indexContent() {
      const blocks = readingBlocks(root);
      setHeadings([...root.querySelectorAll("h1,h2,h3,h4")].filter(element => !element.closest('.reader-controls-host,[data-reader-transient]')).map(element => ({ title: element.textContent, index: blocks.indexOf(element) })));
      const scrollables = [...root.querySelectorAll("pre,table")];
      setFigures(scrollables.map((element, index) => ({ index, title: `${element.tagName === "PRE" ? "Code" : "Table"} ${index + 1}: ${element.textContent.trim().slice(0, 55)}` })));
      setDiagrams([...root.querySelectorAll(FIGURES)].filter(element => !element.parentElement.closest(FIGURES)).map((element, index) => ({ index, title: element.querySelector("figcaption")?.textContent.trim().slice(0, 70) || `Diagram ${index + 1}` })));
      scrollables.forEach(element => {
        if (!tabIndexes.has(element)) tabIndexes.set(element, element.getAttribute("tabindex"));
        if (element.getAttribute("tabindex") !== "0") element.setAttribute("tabindex", "0");
      });
      const atomics = [...root.querySelectorAll('figure,[data-course-demo],details,form,.reader-tools,section[aria-label^="Practice "]')];
      atomics.forEach(element => {
        if (!atomicAttributes.has(element)) atomicAttributes.set(element, element.getAttribute("data-book-atomic"));
        if (!element.hasAttribute("data-book-atomic")) element.setAttribute("data-book-atomic", "");
      });
      return blocks;
    }
    function measure() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!active || isExpanded.current || !viewport.current) return;
        const blocks = indexContent();
        const width = viewport.current.clientWidth;
        const height = viewport.current.clientHeight;
        root.style.setProperty("--book-page-height", `${height}px`);
        const computed = getComputedStyle(root);
        const perView = Number(computed.columnCount) || 1;
        const gap = parseFloat(computed.columnGap) || 0;
        const stride = (width + gap) / perView;
        if (!stride) return;
        const pages = Math.max(1, Math.round((root.scrollWidth + gap) / stride));
        metrics.current = { stride, pages, perView };
        runway.current.style.width = `${Math.ceil(pages / perView) * perView * stride - gap}px`;
        jumpTo(blocks[Math.min(anchor.current, blocks.length - 1)]);
        if (!hashApplied.current) { hashApplied.current = true; hashJump(); }
      });
    }
    function hashJump() {
      let hash;
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const element = hash && document.getElementById(hash);
      if (element && root.contains(element)) {
        for (let parent = element.parentElement; parent && root.contains(parent); parent = parent.parentElement) if (parent.tagName === "DETAILS" && !parent.open) parent.open = true;
        jumpTo(element);
      }
      handledHash.current = window.location.hash;
    }
    function restoreForNavigation() {
      restoreExpanded.current();
      expandedDialog.current?.close();
      restoreContent.current();
      dialog.current?.close();
      setExpanded(null);
      setOpen(false);
    }
    const resize = new ResizeObserver(measure);
    resize.observe(viewport.current);
    const mutations = new MutationObserver(measure);
    // Internal controls update the existing lesson; reflow after answers/demos change.
    mutations.observe(contentRoot, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["open", "hidden", "style", "class"] });
    root.addEventListener("load", measure, true);
    root.addEventListener("toggle", measure, true);
    window.addEventListener("hashchange", hashJump);
    router.events.on("routeChangeStart", restoreForNavigation);
    window.addEventListener("beforeprint", exit);
    document.fonts.ready.then(() => { if (active) measure(); });
    measure();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      resize.disconnect(); mutations.disconnect();
      root.removeEventListener("load", measure, true);
      root.removeEventListener("toggle", measure, true);
      window.removeEventListener("hashchange", hashJump);
      router.events.off("routeChangeStart", restoreForNavigation);
      window.removeEventListener("beforeprint", exit);
      tabIndexes.forEach((value, element) => value === null ? element.removeAttribute("tabindex") : element.setAttribute("tabindex", value));
      atomicAttributes.forEach((value, element) => value === null ? element.removeAttribute("data-book-atomic") : element.setAttribute("data-book-atomic", value));
    };
    // Settings reflow around the current semantic position; the content host stays mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, settings, target]);

  useLayoutEffect(() => {
    if (!expanded) return;
    isExpanded.current = true;
    const restore = moveInto(expanded, expandedContent.current);
    restoreExpanded.current = restore;
    const modal = expandedDialog.current;
    modal.showModal();
    return () => { restore(); modal.close(); isExpanded.current = false; };
  }, [expanded]);

  function closeExpanded() {
    restoreExpanded.current();
    isExpanded.current = false;
    expandedDialog.current.close();
    setExpanded(null);
  }
  function expand(element) {
    isExpanded.current = true;
    setExpanded(element);
  }
  function focusBlock(element) {
    const block = element.closest('[data-book-atomic]') || element.closest(BLOCKS);
    if (block && flow.current.contains(block)) jumpTo(block);
  }

  function change(key, value) {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    save(SETTINGS_KEY, updated);
  }

  return <>
    <div className={styles.launch}><button ref={trigger} type="button" onClick={enter}>Open Book Mode</button><span>Facing pages, reading themes, and a saved place in this browser.</span></div>
    {!target && <div className={styles.home}><div ref={regular} className={styles.content}>{children}</div></div>}
    <dialog ref={dialog} className={styles.dialog} data-theme={settings.theme} aria-labelledby={`${id}-title`} onKeyDown={event => { if (event.key === "Escape") event.stopPropagation(); }} onCancel={event => { event.preventDefault(); event.stopPropagation(); exit(); }}>
      <header className={styles.toolbar}>
        <button type="button" onClick={exit} autoFocus>← Exit Book Mode</button>
        <strong id={`${id}-title`}>{title}</strong>
        <label className={styles.contents}>Contents<select aria-label="Book contents" value="" onChange={event => jumpTo(readingBlocks(flow.current)[Number(event.target.value)])}><option value="" disabled>Jump to section</option>{headings.map(heading => <option key={heading.index} value={heading.index}>{heading.title}</option>)}</select></label>
        <details className={styles.settings}><summary>Reading settings</summary><div>
          <label>Theme<select aria-label="Theme" value={settings.theme} onChange={event => change("theme", event.target.value)}><option value="paper">Paper</option><option value="sepia">Sepia</option><option value="dark">Dark</option></select></label>
          <label>Text size<select aria-label="Text size" value={settings.size} onChange={event => change("size", event.target.value)}>{[16, 18, 20, 22].map(size => <option key={size} value={size}>{size}px</option>)}</select></label>
          <label>Font<select aria-label="Font" value={settings.font} onChange={event => change("font", event.target.value)}><option value="serif">Serif</option><option value="sans">Sans serif</option></select></label>
          <label>Line spacing<select aria-label="Line spacing" value={settings.spacing} onChange={event => change("spacing", event.target.value)}><option value="1.5">Compact</option><option value="1.7">Comfortable</option><option value="1.9">Spacious</option></select></label>
          <label>Layout<select aria-label="Layout" value={settings.layout} onChange={event => change("layout", event.target.value)}><option value="spread">Two pages</option><option value="single">Wide single page</option></select></label>
          {figures.length > 0 && <label>Expand code or table<select aria-label="Expand code or table" value="" onChange={event => expand(flow.current.querySelectorAll("pre,table")[Number(event.target.value)])}><option value="" disabled>Choose a block</option>{figures.map(figure => <option key={figure.index} value={figure.index}>{figure.title}</option>)}</select></label>}
          {diagrams.length > 0 && <label>Expand diagram<select aria-label="Expand diagram" value="" onChange={event => expand([...flow.current.querySelectorAll(FIGURES)].filter(element => !element.parentElement.closest(FIGURES))[Number(event.target.value)])}><option value="" disabled>Choose a diagram</option>{diagrams.map(diagram => <option key={diagram.index} value={diagram.index}>{diagram.title}</option>)}</select></label>}
          <p>Small screens use one page. Code and tables scroll within their page; choose Wide single page for more room.</p>
        </div></details>
      </header>
      <div className={styles.book} data-layout={settings.layout} style={{ "--book-size": `${settings.size}px`, "--book-font": settings.font === "serif" ? "Georgia, serif" : "system-ui, sans-serif", "--book-spacing": settings.spacing }}>
        <div ref={viewport} className={styles.viewport} tabIndex={0} role="region" aria-label="Book pages" onFocusCapture={event => { if (event.target !== event.currentTarget) focusBlock(event.target); }} onKeyDown={event => {
          if (event.target !== event.currentTarget || event.altKey || event.ctrlKey || event.metaKey) return;
          if (["ArrowRight", "PageDown", "ArrowLeft", "PageUp"].includes(event.key)) { event.preventDefault(); turn(["ArrowRight", "PageDown"].includes(event.key) ? 1 : -1); }
        }} onScroll={() => {
          const { stride, perView, pages } = metrics.current;
          const page = Math.min(pages - 1, Math.round(viewport.current.scrollLeft / (stride * perView)) * perView);
          setPagination({ page, pages, perView });
        }}>
          <div ref={flow} className={styles.flow} /><div ref={runway} className={styles.runway} aria-hidden="true" />
        </div>
      </div>
      <footer className={styles.footer}><button type="button" disabled={pagination.page === 0} onClick={() => turn(-1)}>← Previous page</button><span role="status">{pagination.perView === 2 ? `Pages ${pagination.page + 1}–${Math.min(pagination.page + 2, pagination.pages)}` : `Page ${pagination.page + 1}`} of {pagination.pages}</span><button type="button" disabled={pagination.page + pagination.perView >= pagination.pages} onClick={() => turn(1)}>Next page →</button><nav aria-label="Book chapters">{previous && <Link href={previous.href || `${chapterBase}/${previous.slug}`}>← Previous part</Link>}<Link href={contentsHref}>{contentsHref === "/senior-java-interview" ? "All parts" : "All lessons"}</Link>{next && <Link href={next.href || `${chapterBase}/${next.slug}`}>Next part →</Link>}</nav></footer>
      <dialog ref={expandedDialog} className={styles.expanded} aria-label={expanded?.matches(FIGURES) ? "Expanded diagram" : "Expanded code or table"} onCancel={event => { event.preventDefault(); event.stopPropagation(); closeExpanded(); }}><button type="button" onClick={closeExpanded}>Close expanded view</button><div ref={expandedContent} /></dialog>
    </dialog>
  </>;
}
