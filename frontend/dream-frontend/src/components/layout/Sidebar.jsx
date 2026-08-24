import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import {
  LayoutDashboard, Database, Network, Brain,
  Lightbulb, Archive, Activity, MessageSquare, Settings,
  Pin, PinOff, Zap, BarChart2
} from 'lucide-react';

const NAV_GROUPS = [
  {
    label: 'MENU',
    items: [
      { name: 'Dashboard',       path: '/',               icon: LayoutDashboard, badge: null },
      { name: 'Memory Explorer', path: '/memory-explorer', icon: Database,        badge: null },
      { name: 'Memory Graph',    path: '/memory-graph',    icon: Network,         badge: null },
      { name: 'Analytics',       path: '/analytics',       icon: Activity,        badge: null },
      { name: 'Datasets',        path: '/datasets',        icon: BarChart2,        badge: null },
      { name: 'Conversation',    path: '/conversation',    icon: MessageSquare,   badge: '12+' },
    ],
  },
  {
    label: 'GENERAL',
    items: [
      { name: 'Dream Engine',    path: '/dream-engine',   icon: Brain,    badge: null },
      { name: 'Reflections',     path: '/reflections',    icon: Lightbulb,badge: null },
      { name: 'Forgetting',      path: '/forgetting',     icon: Archive,  badge: null },
      { name: 'Settings',        path: '/settings',       icon: Settings, badge: null },
    ],
  },
];

export default function Sidebar() {
  const { pinned, hovered, setHovered, toggle } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const isExpanded = pinned || hovered;

  return (
    <>
      {/* Mobile overlay */}
      {isExpanded && !pinned && (
        <div
          className="fixed inset-0 z-[49] lg:hidden"
          onClick={() => setHovered(false)}
        />
      )}

      <nav
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: isExpanded ? 'var(--sidebar-w-expanded)' : 'var(--sidebar-w-collapsed)',
          transition: 'width var(--sidebar-transition)',
          zIndex: 50,
          overflow: 'hidden',
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
          boxShadow: isExpanded ? '4px 0 30px rgba(0,0,0,0.04)' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
        aria-label="Main navigation"
      >
        {/* ── Logo ── */}
        <div
          className="flex items-center px-4 py-5 shrink-0 cursor-pointer"
          style={{ minHeight: 72, gap: 12 }}
          onClick={() => navigate('/')}
        >
          <div
            className="shrink-0 flex items-center justify-center rounded-xl"
            style={{
              width: 36,
              height: 36,
              background: 'var(--brand-dark)',
              color: 'white',
            }}
          >
            <Brain size={18} strokeWidth={2.5} />
          </div>
          <div
            className="overflow-hidden whitespace-nowrap"
            style={{
              opacity: isExpanded ? 1 : 0,
              width: isExpanded ? 'auto' : 0,
              transition: 'opacity 200ms ease, width 250ms ease',
            }}
          >
            <div className="text-base font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
              DREAM
            </div>
            <div className="text-[11px] font-medium" style={{ color: 'var(--text-muted)' }}>
              Cognitive Console
            </div>
          </div>
        </div>

        {/* ── Navigation groups ── */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-2 px-3">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-5">
              {/* Group label (only when expanded) */}
              <div
                className="px-1 mb-2 overflow-hidden whitespace-nowrap"
                style={{
                  opacity: isExpanded ? 1 : 0,
                  transition: 'opacity 150ms ease',
                  height: isExpanded ? undefined : 0,
                }}
              >
                <span className="section-label">{group.label}</span>
              </div>

              {group.items.map((item) => {
                const isActive = item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={!isExpanded ? item.name : undefined}
                    className="block my-0.5"
                  >
                    <div
                      className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                      style={{ justifyContent: isExpanded ? 'flex-start' : 'center' }}
                    >
                      <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                        <item.icon size={17} strokeWidth={isActive ? 2.5 : 2} />
                      </span>
                      <span
                        className="overflow-hidden whitespace-nowrap text-sm flex-1"
                        style={{
                          opacity: isExpanded ? 1 : 0,
                          maxWidth: isExpanded ? 160 : 0,
                          transition: 'opacity 150ms ease, max-width 250ms ease',
                        }}
                      >
                        {item.name}
                      </span>
                      {/* Badge */}
                      {item.badge && isExpanded && (
                        <span className="badge-count shrink-0">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </div>

        {/* ── Footer: Bottom Card + Pin ── */}
        <div className="shrink-0 px-3 pb-4 flex flex-col gap-3">

          {/* Dark green status card */}
          {isExpanded && (
            <div
              className="rounded-xl p-4 flex flex-col gap-3"
              style={{
                background: 'linear-gradient(135deg, var(--brand-dark) 0%, #113F24 100%)',
              }}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center">
                  <Zap size={14} color="white" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">DREAM System</div>
                  <div className="text-[10px] text-green-200">All systems operational</div>
                </div>
              </div>
              <div
                className="w-full text-center text-xs font-semibold rounded-lg py-1.5 cursor-pointer transition-all"
                style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
                onClick={() => navigate('/settings')}
              >
                View Status
              </div>
            </div>
          )}

          {/* Pin/unpin button */}
          <button
            onClick={toggle}
            className="sidebar-nav-item w-full"
            style={{ justifyContent: isExpanded ? 'flex-start' : 'center' }}
            title={pinned ? 'Collapse sidebar' : 'Pin sidebar open'}
          >
            <span className="shrink-0 w-5 h-5 flex items-center justify-center">
              {pinned ? <PinOff size={15} strokeWidth={2} /> : <Pin size={15} strokeWidth={2} />}
            </span>
            <span
              className="overflow-hidden whitespace-nowrap text-xs font-medium"
              style={{
                opacity: isExpanded ? 1 : 0,
                maxWidth: isExpanded ? 160 : 0,
                transition: 'opacity 150ms ease, max-width 250ms ease',
              }}
            >
              {pinned ? 'Collapse sidebar' : 'Pin sidebar'}
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
