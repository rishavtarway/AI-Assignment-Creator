'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useWebSocket } from '@/hooks/useWebSocket';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { MobileHeader, MobileBottomNav } from '@/components/MobileNav';
import { Assignment } from '@/types';
import toast from 'react-hot-toast';

export default function AssignmentsPage() {
  const router = useRouter();
  const { assignments, fetchAssignments, deleteAssignment, isLoading } = useAssignmentStore();
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useWebSocket();

  useEffect(() => {
    fetchAssignments();
  }, []);

  const filtered = assignments.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteAssignment(id);
    setOpenMenu(null);
    toast.success('Assignment deleted');
  };

  const handleView = (id: string) => {
    router.push(`/assignments/${id}`);
    setOpenMenu(null);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  };

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <div className="main-layout">
        <MobileHeader title="Assignments" />
        <Topbar breadcrumb="Assignment" />
        <div className="content-area">
          {assignments.length === 0 && !isLoading ? (
            /* Empty state */
            <div className="empty-state-container">
              <div className="empty-state">
                <EmptyIllustration />
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No assignments yet</h3>
                  <p style={{ color: '#666', fontSize: 14, maxWidth: 360, textAlign: 'center' }}>
                    Create your first assignment to start collecting and grading student submissions.
                    You can set up rubrics, define marking criteria, and let AI assist with grading.
                  </p>
                </div>
                <Link href="/assignments/create">
                  <button className="btn-primary">
                    <span style={{ fontSize: 18 }}>+</span> Create Your First Assignment
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            /* Filled state */
            <div>
              {/* Header */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div className="heading-status-dot" />
                  <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>Assignments</h1>
                </div>
                <p style={{ color: '#666', fontSize: 13 }}>Manage and create assignments for your classes.</p>
              </div>

              {/* Filter + Search */}
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  border: '1px solid #e0e0e0', borderRadius: 8, padding: '8px 14px',
                  background: 'white', fontSize: 13, cursor: 'pointer', color: '#555'
                }}>
                  <FilterIcon /> Filter By
                </button>
                <div style={{ flex: 1, position: 'relative' }}>
                  <SearchIcon style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#999', zIndex: 10 }} />
                  <input
                    className="search-pill"
                    placeholder="Search Assignment"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {/* Grid */}
              <div className="assignments-grid">
                {filtered.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="assignment-card"
                    onClick={() => handleView(assignment._id)}
                    style={{ position: 'relative' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <h3 style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{assignment.title}</h3>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === assignment._id ? null : assignment._id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: '#666', fontSize: 18 }}
                        >⋮</button>
                        {openMenu === assignment._id && (
                          <div style={{
                            position: 'absolute', right: 0, top: '100%', zIndex: 50,
                            background: 'white', border: '1px solid #e0e0e0', borderRadius: 8,
                            boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 140, overflow: 'hidden'
                          }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleView(assignment._id); }}
                              style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                            >View Assignment</button>
                            <button
                              onClick={(e) => handleDelete(assignment._id, e)}
                              style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#E84A2F' }}
                            >Delete</button>
                          </div>
                        )}
                      </div>
                    </div>

                    <StatusBadge status={assignment.status} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: '#666' }}>
                      <span><strong>Assigned on</strong> : {formatDate(assignment.createdAt)}</span>
                      {assignment.dueDate && <span><strong>Due</strong> : {formatDate(assignment.dueDate)}</span>}
                    </div>

                    {assignment.status === 'processing' && (
                      <div style={{ marginTop: 8 }}>
                        <div className="progress-bar">
                          <div className="progress-fill animate-pulse" style={{ width: '60%' }} />
                        </div>
                        <p style={{ fontSize: 11, color: '#e65100', marginTop: 4 }}>Generating question paper...</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Floating create btn */}
              <Link href="/assignments/create" className="desktop-floating-create">
                <button className="btn-primary" style={{ borderRadius: 24, padding: '12px 32px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', fontSize: 14 }}>
                  <span style={{ fontSize: 18, fontWeight: 600 }}>+</span> Create Assignment
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Close menus on outside click */}
      {openMenu && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setOpenMenu(null)} />
      )}
      {/* Mobile Floating Action Button (FAB) */}
      <Link href="/assignments/create" className="mobile-fab">
        +
      </Link>
      <MobileBottomNav />
    </div>
  );
}

function StatusBadge({ status }: { status: Assignment['status'] }) {
  const map = {
    completed: { label: 'Completed', cls: 'status-completed' },
    processing: { label: 'Processing...', cls: 'status-processing' },
    failed: { label: 'Failed', cls: 'status-failed' },
    pending: { label: 'Pending', cls: 'status-pending' },
  };
  const s = map[status] || map.pending;
  return <span className={`status-badge ${s.cls}`}>{s.label}</span>;
}

function EmptyIllustration() {
  return (
    <svg width="220" height="180" viewBox="0 0 220 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background soft shadow ellipse */}
      <ellipse cx="110" cy="155" rx="80" ry="16" fill="#F0F1F3" />
      
      {/* Document Sheet */}
      <rect x="65" y="25" width="90" height="115" rx="8" fill="white" stroke="#D2D6DC" strokeWidth="2.5" />
      {/* Document content lines */}
      <rect x="78" y="42" width="45" height="5" rx="2.5" fill="#E5E7EB" />
      <rect x="78" y="56" width="64" height="4" rx="2" fill="#F3F4F6" />
      <rect x="78" y="68" width="60" height="4" rx="2" fill="#F3F4F6" />
      <rect x="78" y="80" width="50" height="4" rx="2" fill="#F3F4F6" />
      <rect x="78" y="92" width="35" height="4" rx="2" fill="#F3F4F6" />

      {/* Decorative card mockup in top-right behind */}
      <rect x="140" y="38" width="30" height="20" rx="4" fill="#F3F4F6" stroke="#E5E7EB" strokeWidth="1.5" />
      <circle cx="148" cy="48" r="3" fill="#D1D5DB" />
      <rect x="156" y="46" width="10" height="4" rx="2" fill="#E5E7EB" />

      {/* Aesthetic hand-drawn spiral line on left */}
      <path d="M55 25 C45 35 48 55 60 48 C68 42 60 28 45 42" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" fill="none" />
      
      {/* Magnifying Glass Frame and Handle */}
      {/* Handle */}
      <line x1="126" y1="126" x2="148" y2="148" stroke="#A78BFA" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="126" y1="126" x2="148" y2="148" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" />
      
      {/* Outer lens frame */}
      <circle cx="108" cy="108" r="32" fill="#EEF2F6" stroke="#C3B5FD" strokeWidth="4.5" />
      <circle cx="108" cy="108" r="28" fill="white" />
      
      {/* Red Circle with white X inside (mock error badge) */}
      <circle cx="108" cy="108" r="16" fill="#EF4444" />
      <path d="M102 102 L114 114 M114 102 L102 114" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Aesthetic blue stars around illustration */}
      {/* Star 1 */}
      <path d="M48 108 L50 102 L56 100 L50 98 L48 92 L46 98 L40 100 L46 102 Z" fill="#60A5FA" />
      {/* Star 2 */}
      <path d="M168 114 L170 110 L174 109 L170 108 L168 104 L166 108 L162 109 L166 110 Z" fill="#3B82F6" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  );
}

function SearchIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  );
}
