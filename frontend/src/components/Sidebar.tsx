'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { LayoutGrid, Users, FileText, Backpack, History, Settings } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '/', icon: LayoutGrid },
  { label: 'My Groups', href: '/groups', icon: Users },
  { label: 'Assignments', href: '/assignments', icon: FileText, badge: true },
  { label: "AI Teacher's Toolkit", href: '/toolkit', icon: Backpack },
  { label: 'My Library', href: '/library', icon: History },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { assignments } = useAssignmentStore();
  const count = assignments.length;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <img 
          src="/Frame 1618872393.png" 
          alt="VedaAI Logo" 
          style={{ height: 50, width: 'auto', objectFit: 'contain', flexShrink: 0 }} 
        />
      </div>

      {/* Create button */}
      <Link href="/assignments/create" style={{ textDecoration: 'none', flexShrink: 0 }}>
        <button className="btn-create">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, flexShrink: 0 }}>
            {/* Large sparkle */}
            <path d="M10 4 Q10 12 2 12 Q10 12 10 20 Q10 12 18 12 Q10 12 10 4 Z" />
            {/* Small sparkle */}
            <path d="M19 3 Q19 7 15 7 Q19 7 19 11 Q19 7 23 7 Q19 7 19 3 Z" />
          </svg>
          Create Assignment
        </button>
      </Link>

      {/* Nav with elegant scroll */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
              {item.badge && count > 0 && (
                <span className="badge">{count > 99 ? '99+' : count}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section (Settings & Profile) locked in place */}
      <div className="sidebar-bottom">
        <Link href="/settings" className="nav-item sidebar-settings">
          <Settings size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span>Settings</span>
        </Link>
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">
            <img 
              src="https://avatars.githubusercontent.com/u/98923053?v=4" 
              alt="User Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">Delhi Public School</div>
            <div className="sidebar-profile-location">Bokaro Steel City</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
