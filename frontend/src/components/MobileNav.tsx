'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function MobileHeader({ title = 'Assignments', backHref }: { title?: string; backHref?: string }) {
  return (
    <div className="mobile-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {backHref ? (
          <Link href={backHref} style={{ color: '#666', display: 'flex', alignItems: 'center' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
          </Link>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/Frame 1618872393.png" 
              alt="VedaAI Logo" 
              style={{ height: 24, width: 'auto', objectFit: 'contain', flexShrink: 0 }} 
            />
          </div>
        )}
        {backHref && <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, background: '#E84A2F', borderRadius: '50%' }} />
        </div>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e0c8a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>👤</div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </div>
    </div>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  const items = [
    { href: '/', label: 'Home', icon: HomeIcon },
    { href: '/assignments', label: 'Assignments', icon: AssignmentsIcon },
    { href: '/library', label: 'Library', icon: LibraryIcon },
    { href: '/toolkit', label: 'AI Toolkit', icon: ToolkitIcon },
  ];

  return (
    <nav className="mobile-bottom-nav">
      <div className="mobile-bottom-nav-inner">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={`mobile-nav-item ${active ? 'active' : ''}`}>
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}
function AssignmentsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  );
}
function LibraryIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  );
}
function ToolkitIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? 'white' : '#888'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
