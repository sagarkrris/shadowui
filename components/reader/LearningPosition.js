import { useEffect } from 'react';
import { saveResume } from '../../lib/learningResume.mjs';

// Loaded only on learning detail pages; no scroll listener runs on the homepage.
export default function LearningPosition({ path }) {
  useEffect(() => {
    const main = document.querySelector('main');
    const title = main?.querySelector('h1')?.textContent;
    if (!main || !title) return;
    const scroll = main.closest('.reader-article-scroll, [data-reader-scroll], [data-detective-scroll]') || document.scrollingElement;
    let timer;
    let pending = null;
    function persist() {
      if (!pending) return;
      try { saveResume(localStorage, pending); }
      catch { /* Resume is optional; activity-specific storage reports its own errors. */ }
      pending = null;
    }
    function schedule() {
      // Column positions are horizontal inside Book Mode; the normal scroll model
      // resumes once the live article has returned to its original container.
      if (main.closest('dialog[open]')) return;
      const top = scroll === document.scrollingElement ? 0 : scroll.getBoundingClientRect().top;
      const sections = [...main.querySelectorAll('section[id], h2[id], h3[id]')].filter(element => !element.closest('[data-reader-transient]'));
      const section = sections.filter(element => element.getBoundingClientRect().top <= top + Math.max(100, parseFloat(getComputedStyle(element).scrollMarginTop) || 0) + 1).at(-1);
      const label = section?.matches('section') ? section.querySelector('h2, h3')?.textContent : section?.textContent;
      pending = { href: path + (section ? `#${section.id}` : ''), title, section: label || '' };
      clearTimeout(timer); timer = setTimeout(persist, 250);
    }
    scroll.addEventListener('scroll', schedule, { passive: true });
    main.addEventListener('input', schedule);
    main.addEventListener('click', schedule);
    window.addEventListener('pagehide', persist);
    // Native hash scrolling can precede hydration of saved workshop content.
    const initialHash = window.location.hash;
    const restore = setTimeout(() => {
      if (window.location.hash !== initialHash) return;
      let hash;
      try { hash = decodeURIComponent(window.location.hash.slice(1)); } catch { return; }
      const target = hash && document.getElementById(hash);
      if (target && main.contains(target)) target.scrollIntoView({ block: 'start' });
    }, 150);
    // A delayed hydration correction must never override navigation or input.
    const cancelRestore = () => clearTimeout(restore);
    const intentEvents = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'input'];
    intentEvents.forEach(type => window.addEventListener(type, cancelRestore, { capture: true, passive: true }));
    return () => { intentEvents.forEach(type => window.removeEventListener(type, cancelRestore, true)); clearTimeout(timer); clearTimeout(restore); persist(); scroll.removeEventListener('scroll', schedule); main.removeEventListener('input', schedule); main.removeEventListener('click', schedule); window.removeEventListener('pagehide', persist); };
  }, [path]);
  return null;
}
