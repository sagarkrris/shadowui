import { useRouter } from 'next/router';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PUBLIC_NAVIGATION } from '../../lib/publicNavigation.mjs';
import UiIcon from './UiIcon';
import ui from '../../styles/PublicUi.module.css';
const DiscoverySearch = dynamic(() => import('./DiscoverySearch'), { ssr: false });

export default function PublicHeader() {
  const router = useRouter();
  const header = useRef(null);
  const [menu, setMenu] = useState(null);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const closeSearch = useCallback(() => setSearch(false), []);
  useEffect(() => {
    function keys(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setMenu(null); setMobile(false); setSearch(value => !value); }
      if (event.key === 'Escape' && !search) {
        if (menu) header.current?.querySelector(`[data-nav-trigger="${menu}"]`)?.focus();
        else if (mobile) header.current?.querySelector('[aria-controls="public-navigation"]')?.focus();
        setMenu(null); setMobile(false);
      }
    }
    function outside(event) { if (!header.current?.contains(event.target)) { setMenu(null); setMobile(false); } }
    function navigate() { setMenu(null); setMobile(false); setSearch(false); }
    document.addEventListener('keydown', keys);
    document.addEventListener('pointerdown', outside);
    router.events.on('routeChangeStart', navigate);
    return () => { document.removeEventListener('keydown', keys); document.removeEventListener('pointerdown', outside); router.events.off('routeChangeStart', navigate); };
  }, [router.events, menu, mobile, search]);
  function current(href) { return router.pathname === href ? 'page' : undefined; }
  return <>
    <header className={ui.siteHeader} ref={header}>
      <div className={ui.headerInner}>
        <Link prefetch={false} href="/" className={ui.brand} aria-label="InterviewIQ home"><span className={ui.brandMark} aria-hidden="true">IQ<span /></span><span>InterviewIQ<small>ENGINEERING, UNDERSTOOD.</small></span></Link>
        <button type="button" className={ui.mobileToggle} aria-label={mobile ? 'Close navigation' : 'Open navigation'} aria-expanded={mobile} aria-controls="public-navigation" onClick={() => { setMobile(value => !value); setMenu(null); }}><UiIcon name={mobile ? 'close' : 'menu'} /></button>
        <nav id="public-navigation" aria-label="Reading navigation" className={`${ui.navigation} ${mobile ? ui.navigationOpen : ''}`}>
          {PUBLIC_NAVIGATION.map(group => <div className={ui.navGroup} key={group.label}>
            <button type="button" data-nav-trigger={group.label} aria-expanded={menu === group.label} aria-controls={`nav-${group.label.toLowerCase()}`} onClick={() => setMenu(menu === group.label ? null : group.label)}>{group.label}<UiIcon name="chevron" size={14} /></button>
            <div id={`nav-${group.label.toLowerCase()}`} className={ui.megaMenu} hidden={menu !== group.label}>
              <p className={ui.menuIntro}>{group.description}</p>
              {group.items.map(item => <Link prefetch={false} key={item.href} href={item.href} aria-current={current(item.href)} onClick={() => { setMenu(null); setMobile(false); }}><span className={ui.menuIcon}><UiIcon name={item.icon} /></span><span><strong>{item.title}</strong><small>{item.description}</small></span><UiIcon name="arrow" size={16} /></Link>)}
            </div>
          </div>)}
        </nav>
        <div className={ui.headerActions}>
          <button type="button" className={ui.searchTrigger} aria-label="Search learning library" onClick={() => { setMenu(null); setMobile(false); setSearch(true); }}><UiIcon name="search" size={18} /><span>Search</span><kbd>⌘ K</kbd></button>
          <Link prefetch={false} href="/notebook" className={ui.notebookLink} aria-label="My notebook"><UiIcon name="bookmark" size={19} /></Link>
          <Link prefetch={false} href="/practice" className={ui.headerCta}>Start practising<UiIcon name="arrow" size={16} /></Link>
        </div>
      </div>
    </header>
    {search && <DiscoverySearch onClose={closeSearch} />}
  </>;
}
