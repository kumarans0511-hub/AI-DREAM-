import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useSidebar } from '../../context/SidebarContext';
import {
  Search, Bell, Mail, X, ExternalLink, Brain, Moon, Zap,
  AlertCircle, CheckCircle, Settings, LogOut, User, ChevronDown,
  Inbox, Send, Star, Clock, Shield, AlertTriangle
} from 'lucide-react';

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */
const USER_EMAIL = 'kumarans0511@gmail.com';
const USER_NAME  = 'Kumaran Senthil';
const USER_INITIALS = 'KS';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60)   return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ─────────────────────────────────────────
   Static seed data (augmented with live events)
───────────────────────────────────────── */
const SEED_NOTIFICATIONS = [
  {
    id: 'n1', type: 'memory', icon: Brain, color: '#1A5632',
    title: 'Memory Extracted',
    body: 'New memory stored: "Kumaran owns a dog named Simba"',
    time: new Date(Date.now() - 4 * 60 * 1000).toISOString(), read: false,
  },
  {
    id: 'n2', type: 'dream', icon: Moon, color: '#7C3AED',
    title: 'Dream Cycle Completed',
    body: '7 memories processed · 1 semantic group formed',
    time: new Date(Date.now() - 38 * 60 * 1000).toISOString(), read: false,
  },
  {
    id: 'n3', type: 'eval', icon: Zap, color: '#D97706',
    title: 'LongMemEval Smoke Test',
    body: 'Smoke test passed · 118 vectors persisted in evaluation DB',
    time: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), read: true,
  },
  {
    id: 'n4', type: 'system', icon: CheckCircle, color: '#059669',
    title: 'Ollama Online',
    body: 'llama3.1:8b connected at localhost:11434',
    time: new Date(Date.now() - 5 * 3600 * 1000).toISOString(), read: true,
  },
  {
    id: 'n5', type: 'system', icon: Shield, color: '#0369A1',
    title: 'ChromaDB Healthy',
    body: 'Vector store responding · 118 documents indexed',
    time: new Date(Date.now() - 8 * 3600 * 1000).toISOString(), read: true,
  },
];

const SEED_EMAILS = [
  {
    id: 'e1', from: 'DREAM System <noreply@dream.ai>', subject: 'Dream Cycle Report',
    preview: 'Your nightly dream cycle processed 7 memories and formed 1 semantic cluster…',
    time: new Date(Date.now() - 40 * 60 * 1000).toISOString(), read: false, starred: false,
  },
  {
    id: 'e2', from: 'Evaluation Engine <eval@dream.ai>', subject: 'LongMemEval Smoke Test Passed ✓',
    preview: 'The LongMemEval smoke test completed successfully with 118 memories persisted…',
    time: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), read: false, starred: true,
  },
  {
    id: 'e3', from: 'Memory Extractor <memory@dream.ai>', subject: 'New Memories This Session',
    preview: 'Today\'s session extracted facts about Simba, motorsports interests, and personal preferences…',
    time: new Date(Date.now() - 6 * 3600 * 1000).toISOString(), read: true, starred: false,
  },
  {
    id: 'e4', from: 'Analytics <analytics@dream.ai>', subject: 'Weekly Cognitive Summary',
    preview: 'This week: 23 memories stored, 4 dream cycles, retention score 87%…',
    time: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), read: true, starred: false,
  },
];

/* ─────────────────────────────────────────
   Notification Panel
───────────────────────────────────────── */
function NotificationPanel({ notifications, onMarkRead, onMarkAllRead, onClose }) {
  const unread = notifications.filter(n => !n.read).length;
  return (
    <div className="topbar-dropdown" style={{ width: 380 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: 'var(--brand-primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: 'var(--brand-dark)' }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <button onClick={onMarkAllRead}
              className="text-[11px] hover:underline transition-opacity"
              style={{ color: 'var(--brand-primary)' }}>
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight: 380, overflowY: 'auto' }} className="custom-scrollbar">
        {notifications.map(n => {
          const Icon = n.icon;
          return (
            <div key={n.id}
              className="flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-black/5"
              style={{
                background: n.read ? 'transparent' : 'rgba(26,86,50,0.04)',
                borderBottom: '1px solid var(--border)',
              }}
              onClick={() => onMarkRead(n.id)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${n.color}18` }}>
                <Icon size={14} style={{ color: n.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full shrink-0 mt-1"
                      style={{ background: 'var(--brand-primary)' }} />
                  )}
                </div>
                <p className="text-[12px] mt-0.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
                  {n.body}
                </p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
                  <Clock size={9} className="inline mr-1" />{timeAgo(n.time)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 text-center" style={{ borderTop: '1px solid var(--border)' }}>
        <button className="text-[12px] font-medium hover:underline" style={{ color: 'var(--brand-primary)' }}>
          View all activity →
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Mail Panel
───────────────────────────────────────── */
function MailPanel({ emails, onToggleStar, onMarkRead, onClose }) {
  const [tab, setTab] = useState('inbox');
  const unread = emails.filter(e => !e.read).length;
  const starred = emails.filter(e => e.starred);
  const shown = tab === 'starred' ? starred : emails;

  return (
    <div className="topbar-dropdown" style={{ width: 400 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Mail size={15} style={{ color: 'var(--brand-primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Inbox</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
              style={{ background: 'var(--brand-dark)' }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a href={`https://mail.google.com/mail/u/0/?to=${USER_EMAIL}`}
            target="_blank" rel="noreferrer"
            className="text-[11px] flex items-center gap-1 hover:underline"
            style={{ color: 'var(--brand-primary)' }}>
            Open Gmail <ExternalLink size={10} />
          </a>
          <button onClick={onClose} className="hover:opacity-70 transition-opacity">
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b" style={{ borderColor: 'var(--border)' }}>
        {[
          { key: 'inbox', label: 'Inbox', icon: Inbox },
          { key: 'starred', label: 'Starred', icon: Star },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium transition-colors"
            style={{
              color: tab === t.key ? 'var(--brand-primary)' : 'var(--text-muted)',
              borderBottom: tab === t.key ? '2px solid var(--brand-primary)' : '2px solid transparent',
            }}>
            <t.icon size={12} />{t.label}
          </button>
        ))}
      </div>

      {/* Email list */}
      <div style={{ maxHeight: 340, overflowY: 'auto' }} className="custom-scrollbar">
        {shown.length === 0 ? (
          <div className="py-8 text-center text-[12px]" style={{ color: 'var(--text-muted)' }}>
            No messages
          </div>
        ) : shown.map(e => (
          <div key={e.id}
            className="px-4 py-3 cursor-pointer hover:bg-black/5 transition-colors"
            style={{
              background: e.read ? 'transparent' : 'rgba(26,86,50,0.04)',
              borderBottom: '1px solid var(--border)',
            }}
            onClick={() => onMarkRead(e.id)}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{e.from}</p>
                <p className="text-[13px] font-semibold mt-0.5 truncate" style={{ color: 'var(--text-primary)' }}>
                  {!e.read && <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 mb-0.5"
                    style={{ background: 'var(--brand-primary)' }} />}
                  {e.subject}
                </p>
                <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }}>
                  {e.preview}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                  {timeAgo(e.time)}
                </span>
                <button onClick={ev => { ev.stopPropagation(); onToggleStar(e.id); }}
                  className="hover:opacity-80 transition-opacity">
                  <Star size={12}
                    style={{ color: e.starred ? '#D97706' : 'var(--text-muted)',
                             fill: e.starred ? '#D97706' : 'none' }} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer compose button */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <a href={`https://mail.google.com/mail/?view=cm&to=${USER_EMAIL}`}
          target="_blank" rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--brand-dark)' }}>
          <Send size={12} /> Compose in Gmail
        </a>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Sign-Out Confirmation Modal
───────────────────────────────────────── */
function SignOutModal({ onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 999, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
      <div className="surface-card p-8 flex flex-col items-center gap-5 text-center" style={{ maxWidth: 380, width: '90%', animation: 'fadeInUp 0.2s ease' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(220,38,38,0.1)' }}>
          <AlertTriangle size={26} style={{ color: '#dc2626' }} />
        </div>
        <div>
          <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Sign out of DREAM?</h2>
          <p className="text-[13px] mt-1.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Your session will end and all unsaved sandbox inputs will be lost.
            Your memories and cognitive data remain safely stored.
          </p>
        </div>
        <div className="w-full flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: 'var(--bg-base)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: '#dc2626' }}>
            <LogOut size={14} className="inline mr-1.5" />Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Profile Dropdown
───────────────────────────────────────── */
function ProfileDropdown({ onClose, navigate, onSignOut }) {
  const menuItems = [
    { icon: User,     label: 'My Profile',    action: () => { onClose(); navigate('/profile'); } },
    { icon: Settings, label: 'Settings',      action: () => { onClose(); navigate('/settings'); } },
    { icon: Brain,    label: 'Memory Explorer', action: () => { onClose(); navigate('/memory-explorer'); } },
    { icon: Shield,   label: 'System Status', action: () => { onClose(); navigate('/analytics'); } },
  ];

  return (
    <div className="topbar-dropdown" style={{ width: 280 }}>
      {/* User card */}
      <div className="px-4 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white"
            style={{ background: 'var(--brand-dark)' }}>
            {USER_INITIALS}
          </div>
          <div>
            <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>{USER_NAME}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{USER_EMAIL}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#22c55e' }} />
              <span className="text-[10px]" style={{ color: '#22c55e' }}>DREAM Admin · Online</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border)', gap: 4 }}>
        {[
          { label: 'Memories', value: '7+' },
          { label: 'Cycles', value: '1' },
          { label: 'Score', value: '87%' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <p className="text-[14px] font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
            <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Menu */}
      <div className="py-2">
        {menuItems.map(item => (
          <button key={item.label} onClick={item.action}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-black/5 transition-colors"
          >
            <item.icon size={14} style={{ color: 'var(--brand-primary)' }} />
            <span className="text-[13px]" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout */}
      <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium transition-colors hover:opacity-90"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626' }}
          onClick={() => { onClose(); onSignOut(); }}>
          <LogOut size={13} /> Sign Out
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Layout
───────────────────────────────────────── */
const MainLayout = () => {
  const { pinned, hovered } = useSidebar();
  const isExpanded = pinned || hovered;
  const navigate = useNavigate();

  const [openPanel, setOpenPanel] = useState(null); // 'mail' | 'bell' | 'profile' | null
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const [emails, setEmails] = useState(SEED_EMAILS);
  const [showSignOut, setShowSignOut] = useState(false);
  const panelRef = useRef(null);

  const handleSignOut = () => {
    // Clear any session state here if needed
    setShowSignOut(false);
    // Redirect to a logged-out state (reload to dashboard with session cleared)
    navigate('/');
    window.location.reload();
  };

  const unreadNotif = notifications.filter(n => !n.read).length;
  const unreadMail  = emails.filter(e => !e.read).length;

  const toggle = (panel) => setOpenPanel(prev => prev === panel ? null : panel);
  const close  = useCallback(() => setOpenPanel(null), []);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) close();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [close]);

  /* Live notification polling — every 60s append a new event from /dream/status */
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/dream/status');
        if (!res.ok) return;
        const data = await res.json();
        const lr = data?.last_result;
        if (lr?.status === 'completed' && lr?.memories_processed > 0) {
          setNotifications(prev => {
            const id = `live-${Date.now()}`;
            if (prev.some(n => n.body.includes(`${lr.memories_processed} memories`))) return prev;
            return [{
              id, type: 'dream', icon: Moon, color: '#7C3AED',
              title: 'Dream Cycle Completed',
              body: `${lr.memories_processed} memories processed · ${lr.groups_found} group(s) formed`,
              time: data.last_run_time || new Date().toISOString(), read: false,
            }, ...prev];
          });
        }
      } catch (_) { /* silent */ }
    };
    poll();
    const t = setInterval(poll, 60_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>
      {showSignOut && (
        <SignOutModal onCancel={() => setShowSignOut(false)} onConfirm={handleSignOut} />
      )}
      <Sidebar />

      <div
        className="flex-1 flex flex-col min-w-0 h-full overflow-hidden"
        style={{
          marginLeft: isExpanded ? 'var(--sidebar-w-expanded)' : 'var(--sidebar-w-collapsed)',
          transition: 'margin-left var(--sidebar-transition)',
        }}
      >
        {/* ── Top Navigation Bar ── */}
        <header
          className="shrink-0 flex items-center justify-between px-8 py-4"
          style={{
            background: 'var(--bg-base)',
            borderBottom: '1px solid var(--border)',
            height: 68,
            position: 'relative',
            zIndex: 50,
          }}
        >
          {/* Search */}
          <div
            className="topbar-search cursor-pointer hover:border-green-300 transition-colors"
            onClick={() => navigate('/memory-explorer')}
            title="Search memories"
          >
            <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Search memories…</span>
            <span
              className="ml-auto mono text-[11px] px-1.5 py-0.5 rounded"
              style={{ background: 'var(--border)', color: 'var(--text-muted)', flexShrink: 0 }}
            >
              ⌘K
            </span>
          </div>

          {/* Right actions + panels anchor */}
          <div className="flex items-center gap-3 relative" ref={panelRef}>

            {/* ── Mail Button ── */}
            <div className="relative">
              <button
                onClick={() => toggle('mail')}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: openPanel === 'mail' ? 'var(--brand-dark)' : 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
                title={`Mail · ${USER_EMAIL}`}
              >
                <Mail size={16} style={{ color: openPanel === 'mail' ? 'white' : 'var(--text-secondary)' }} />
              </button>
              {unreadMail > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: 'var(--brand-dark)', border: '2px solid var(--bg-base)' }}>
                  {unreadMail}
                </span>
              )}
              {openPanel === 'mail' && (
                <div className="absolute right-0 mt-2" style={{ top: '100%', zIndex: 100 }}>
                  <MailPanel
                    emails={emails}
                    onToggleStar={id => setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e))}
                    onMarkRead={id => setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e))}
                    onClose={close}
                  />
                </div>
              )}
            </div>

            {/* ── Bell Button ── */}
            <div className="relative">
              <button
                onClick={() => toggle('bell')}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{
                  background: openPanel === 'bell' ? 'var(--brand-dark)' : 'var(--bg-card)',
                  border: '1px solid var(--border)',
                }}
                title="Notifications"
              >
                <Bell size={16} style={{ color: openPanel === 'bell' ? 'white' : 'var(--text-secondary)' }} />
              </button>
              {unreadNotif > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
                  style={{ background: '#dc2626', border: '2px solid var(--bg-base)' }}>
                  {unreadNotif}
                </span>
              )}
              {openPanel === 'bell' && (
                <div className="absolute right-0 mt-2" style={{ top: '100%', zIndex: 100 }}>
                  <NotificationPanel
                    notifications={notifications}
                    onMarkRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
                    onMarkAllRead={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
                    onClose={close}
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-7 w-px" style={{ background: 'var(--border)' }} />

            {/* ── Profile Button ── */}
            <div className="relative">
              <button
                onClick={() => toggle('profile')}
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl transition-all hover:bg-black/5"
                title="Profile"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white"
                  style={{ background: 'var(--brand-dark)' }}>
                  {USER_INITIALS}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-sm font-semibold leading-tight" style={{ color: 'var(--text-primary)' }}>
                    {USER_NAME}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    {USER_EMAIL}
                  </span>
                </div>
                <ChevronDown size={13} style={{
                  color: 'var(--text-muted)',
                  transform: openPanel === 'profile' ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s',
                }} />
              </button>

              {openPanel === 'profile' && (
                <div className="absolute right-0 mt-2" style={{ top: '100%', zIndex: 100 }}>
                  <ProfileDropdown onClose={close} navigate={navigate} onSignOut={() => setShowSignOut(true)} />
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar" style={{ padding: '28px 32px' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
