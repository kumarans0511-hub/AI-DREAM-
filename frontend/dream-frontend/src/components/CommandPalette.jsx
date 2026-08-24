import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const COMMANDS = [
  { id: 'nav-dashboard',      label: 'Dashboard',           desc: 'Cognitive Command Center',       icon: '⌂',  path: '/' },
  { id: 'nav-memory-explorer',label: 'Memory Explorer',     desc: 'Search & inspect memories',      icon: '◉',  path: '/memory-explorer' },
  { id: 'nav-memory-graph',   label: 'Memory Graph',        desc: 'Visual memory map',              icon: '⌁',  path: '/memory-graph' },
  { id: 'nav-dream-engine',   label: 'Dream Engine',        desc: 'Cognitive pipeline control',     icon: '✦',  path: '/dream-engine' },
  { id: 'nav-reflections',    label: 'Reflections',         desc: 'Generated insights',             icon: '◇',  path: '/reflections' },
  { id: 'nav-forgetting',     label: 'Forgetting Engine',   desc: 'Memory decay visualization',     icon: '⧖',  path: '/forgetting' },
  { id: 'nav-analytics',      label: 'Analytics',           desc: 'Cognitive performance metrics',  icon: '▦',  path: '/analytics' },
  { id: 'nav-conversation',   label: 'Conversation',        desc: 'Chat with DREAM',                icon: '◫',  path: '/conversation' },
  { id: 'nav-settings',       label: 'Settings',            desc: 'Configure cognitive parameters', icon: '⚙',  path: '/settings' },
  { id: 'action-dream',       label: 'Trigger Dream Cycle', desc: 'Run cognitive consolidation now',icon: '▶',  action: 'trigger-dream' },
];

export default function CommandPalette({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const filtered = COMMANDS.filter(
    c =>
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.desc.toLowerCase().includes(query.toLowerCase())
  );

  // Reset when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTriggerResult(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const execute = useCallback(async (cmd) => {
    if (cmd.path) {
      navigate(cmd.path);
      onClose();
    } else if (cmd.action === 'trigger-dream') {
      setTriggering(true);
      try {
        const result = await api.triggerDream();
        setTriggerResult({ ok: true, msg: result?.message || 'Dream cycle triggered.' });
      } catch {
        setTriggerResult({ ok: false, msg: 'Failed to trigger dream cycle.' });
      } finally {
        setTriggering(false);
        setTimeout(onClose, 1800);
      }
    }
  }, [navigate, onClose]);

  const handleKey = (e) => {
    if (e.key === 'Escape') { onClose(); return; }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected(s => Math.min(s + 1, filtered.length - 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected(s => Math.max(s - 1, 0));
    }
    if (e.key === 'Enter' && filtered[selected]) {
      execute(filtered[selected]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-[560px] mx-4"
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(13, 18, 35, 0.95)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.15)',
        }}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 20 20" fill="none" stroke="rgba(148,163,184,0.8)" strokeWidth="1.8">
            <circle cx="8.5" cy="8.5" r="5.75" />
            <path d="m13 13 3.5 3.5" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
            placeholder="Search commands…"
            className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-slate-500"
            style={{ color: '#F1F5F9' }}
          />
          <kbd
            className="shrink-0 text-xs font-mono px-1.5 py-0.5 rounded"
            style={{ background: 'rgba(255,255,255,0.07)', color: '#64748B', border: '1px solid rgba(255,255,255,0.10)' }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto custom-scrollbar">
          {triggerResult ? (
            <div className={`mx-4 my-3 px-4 py-3 rounded-xl text-sm font-medium ${triggerResult.ok ? 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20' : 'text-red-400 bg-red-400/10 border border-red-400/20'}`}>
              {triggerResult.msg}
            </div>
          ) : triggering ? (
            <div className="flex items-center gap-3 px-5 py-4 text-sm text-slate-400">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
              </svg>
              Triggering Dream Cycle…
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-6 text-center text-sm text-slate-500">
              No commands match "{query}"
            </div>
          ) : (
            filtered.map((cmd, i) => (
              <button
                key={cmd.id}
                onClick={() => execute(cmd)}
                onMouseEnter={() => setSelected(i)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all duration-150"
                style={{
                  background: i === selected ? 'rgba(99,102,241,0.15)' : 'transparent',
                  borderLeft: i === selected ? '2px solid #6366F1' : '2px solid transparent',
                }}
              >
                <span className="w-7 h-7 flex items-center justify-center rounded-lg text-sm shrink-0"
                  style={{ background: 'rgba(99,102,241,0.12)', color: '#818CF8' }}>
                  {cmd.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: i === selected ? '#F1F5F9' : '#CBD5E1' }}>
                    {cmd.label}
                  </div>
                  <div className="text-xs" style={{ color: '#64748B' }}>{cmd.desc}</div>
                </div>
                {cmd.action && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(167,139,250,0.12)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.2)' }}>
                    action
                  </span>
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/08 flex items-center gap-4">
          <span className="text-xs" style={{ color: '#475569' }}>
            <kbd className="mono">↑↓</kbd> navigate · <kbd className="mono">↵</kbd> execute · <kbd className="mono">Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
