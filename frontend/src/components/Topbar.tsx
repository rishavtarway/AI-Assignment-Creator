'use client';
import Link from 'next/link';
import { ArrowLeft, LayoutGrid, Bell, ChevronDown } from 'lucide-react';

interface TopbarProps {
  title?: string;
  backHref?: string;
  breadcrumb?: string;
}

export default function Topbar({ title, backHref, breadcrumb = 'Assignment' }: TopbarProps) {

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {backHref && (
          <Link href={backHref} className="topbar-back-btn">
            <ArrowLeft size={16} strokeWidth={2.5} />
          </Link>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888888', fontSize: 14, fontWeight: 500 }}>
          <LayoutGrid size={16} strokeWidth={2} style={{ color: '#999999', flexShrink: 0 }} />
          <span>{breadcrumb}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Notification Bell inside a round button */}
        <div className="topbar-bell-btn">
          <Bell size={18} strokeWidth={2} style={{ color: '#4B5563', flexShrink: 0 }} />
          <span className="topbar-bell-badge" />
        </div>

        {/* Vertical Divider */}
        <div className="topbar-divider" />

        {/* User profile (borderless as seen in design) */}
        <div className="topbar-profile">
          <div className="topbar-profile-avatar">
            <img 
              src="https://avatars.githubusercontent.com/u/98923053?v=4" 
              alt="User Avatar" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <span className="topbar-profile-name">John Doe</span>
          <ChevronDown size={14} strokeWidth={2.5} className="topbar-profile-chevron" style={{ flexShrink: 0 }} />
        </div>
      </div>
    </div>
  );
}
