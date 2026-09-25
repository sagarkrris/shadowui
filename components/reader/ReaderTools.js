import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { editorialCredit, normalizeBookmarks, READER_BOOKMARK_KEY, sectionId } from "../../lib/readerEditorial.mjs";

export default function ReaderTools({ path }) {
  const [targets, setTargets] = useState(null);
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState([]);
  const [message, setMessage] = useState("");
  const [fallback, setFallback] = useState("");
  const credit = editorialCredit(path);
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const title = main.querySelector("h1");
    if (!title) return;
    const hosts = [];
    const hostAfter = element => { const host = document.createElement("div"); host.className = "reader-controls-host"; element.after(host); hosts.push(host); return host; };
    const toolbar = hostAfter(title.closest("header") || title);
    const usedIds = new Set([...main.querySelectorAll("[id]")].map(element => element.id));
    const assignedIds = [];
    // Interactive content is indexed through its persistent parent heading.
    const headings = [...main.querySelectorAll("h2, h3")].filter(heading => !heading.closest('[data-reader-transient]'));
    const sections = headings.map((heading, index) => {
      const label = heading.textContent.trim();
      if (!heading.id) {
        let occurrence = 1;
        let id = sectionId(label, occurrence);
        while (usedIds.has(id)) id = sectionId(label, ++occurrence);
        heading.id = id; usedIds.add(id); assignedIds.push({ heading, id });
      }
      const range = document.createRange(); range.setStartAfter(heading);
      if (headings[index + 1]) range.setEndBefore(headings[index + 1]); else range.setEndAfter(main.lastChild);
      return { id: heading.id, title: label, text: `${label} ${range.toString()}`, element: heading, host: hostAfter(heading) };
    });
    const snippets = [...main.querySelectorAll("pre")].map((element, index) => ({ text: element.textContent, host: hostAfter(element), number: index + 1 }));
    setTargets({ toolbar, sections, snippets });
    try { setBookmarks(normalizeBookmarks(JSON.parse(localStorage.getItem(READER_BOOKMARK_KEY)))); } catch { setMessage("Bookmarks are unavailable in this browser."); }
    let hash;
    try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { hash = ""; }
    const target = hash && document.getElementById(hash);
    if (target && main.contains(target)) reveal(target);
    return () => { hosts.forEach(host => host.remove()); assignedIds.forEach(({ heading, id }) => { if (heading.id === id) heading.removeAttribute("id"); }); };
  }, [path]);
  function reveal(element) {
    for (let parent = element.parentElement; parent; parent = parent.parentElement) if (parent.tagName === "DETAILS") parent.open = true;
    element.scrollIntoView({ block: "start" });
  }
  function jump(section) { history.replaceState(history.state, "", `${path}#${section.id}`); reveal(section.element); section.element.tabIndex = -1; section.element.focus({ preventScroll: true }); }
  function bookmark(section) {
    const href = `${path}#${section.id}`;
    const next = bookmarks.some(item => item.href === href) ? bookmarks.filter(item => item.href !== href) : [...bookmarks, { href, title: section.title }].slice(-100);
    try { localStorage.setItem(READER_BOOKMARK_KEY, JSON.stringify(next)); setBookmarks(next); setMessage(next.some(item => item.href === href) ? "Section bookmarked in this browser." : "Bookmark removed."); }
    catch { setMessage("Bookmark could not be saved. Your browser storage may be unavailable."); }
  }
  async function copy(text, success) {
    try { await navigator.clipboard.writeText(text); setMessage(success); setFallback(""); }
    catch { setMessage("Copy was unavailable. Select and copy the text below."); setFallback(text); }
  }
  if (!targets) return null;
  const matches = query.trim() ? targets.sections.filter(section => {
    // Read the currently selected demo when searching, not its initial snapshot.
    const text = section.element.closest('[data-course-demo]')?.textContent || section.text;
    return text.toLowerCase().includes(query.trim().toLowerCase());
  }).slice(0, 30) : [];
  return <>
    {createPortal(<aside className="reader-tools" aria-label="Article tools and editorial details"><p><strong>By {credit.author}</strong> · {credit.reviewer}</p><p>{credit.updated ? `Updated ${credit.updated}.` : "Update date not yet recorded."} {credit.runtime}</p><p><Link href="/editorial">Editorial standards</Link> · <Link href={`/corrections?article=${encodeURIComponent(path)}`}>Corrections and report a mistake</Link> · <Link href="/series">Reading paths</Link> · <Link href="/notebook">My notebook</Link>{path === "/java/spring-transactional-not-working" && <> · <Link href="/learn/spring-transactions">Continue the Spring journey</Link></>}</p><label>Search within this article<input type="search" value={query} onChange={e => setQuery(e.target.value)} /></label>{query && <div><p role="status">{matches.length} matching sections{matches.length === 30 ? " (first 30)" : ""}</p><ul>{matches.map(section => <li key={section.id}><button onClick={() => jump(section)}>{section.title}</button></li>)}</ul></div>}<details><summary>Bookmarked sections ({bookmarks.length})</summary><p>Saved only in this browser. Use a section’s bookmark button to add or remove it.</p><ul>{bookmarks.map(item => <li key={item.href}><a href={item.href}>{item.title}</a></li>)}</ul></details><p role="status">{message}</p>{fallback && <label>Text to copy<textarea readOnly value={fallback} onFocus={e => e.target.select()} /></label>}</aside>, targets.toolbar)}
    {targets.sections.map(section => createPortal(<div className="reader-section-actions"><button onClick={() => bookmark(section)} aria-pressed={bookmarks.some(item => item.href === `${path}#${section.id}`)} aria-label={`Bookmark ${section.title}`}>{bookmarks.some(item => item.href === `${path}#${section.id}`) ? "Bookmarked ✓" : "Bookmark section"}</button><button onClick={() => copy(`${window.location.origin}${path}#${section.id}`, "Section link copied.")} aria-label={`Share ${section.title}`}>Copy section link</button></div>, section.host, section.id))}
    {targets.snippets.map(snippet => createPortal(<button className="reader-copy-code" onClick={() => copy(snippet.text, `Code example ${snippet.number} copied.`)} aria-label={`Copy code example ${snippet.number}`}>Copy code example {snippet.number}</button>, snippet.host, `code-${snippet.number}`))}
  </>;
}
