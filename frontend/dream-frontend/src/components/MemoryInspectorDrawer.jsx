import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function MemoryInspectorDrawer({ memory, onClose }) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const isOpen = Boolean(memory);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-[100] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.1)',
          backdropFilter: 'blur(2px)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Drawer panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Memory Inspector"
        className="fixed top-0 right-0 bottom-0 z-[101] flex flex-col custom-scrollbar overflow-y-auto"
        style={{
          width: 'clamp(320px, 38vw, 500px)',
          background: 'var(--bg-base)',
          borderLeft: '1px solid var(--border)',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.06)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 300ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {memory && (
          <>
            {/* Header */}
            <div className="flex items-start justify-between p-6 border-b border-[var(--border)] shrink-0 bg-[var(--bg-surface)]">
              <div>
                <div className="section-label mb-1 text-[var(--text-secondary)]">Memory Inspector</div>
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  {memory.category || 'General'}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded transition-all hover:bg-[var(--bg-elevated)]"
                style={{ color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
                aria-label="Close inspector"
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 flex flex-col gap-6">

              {/* Memory text */}
              <div className="surface-card p-5">
                <div className="section-label mb-3">Memory Content</div>
                <p className="text-sm leading-relaxed font-medium text-[var(--text-primary)]">
                  "{memory.memory || 'No content available'}"
                </p>
              </div>

              {/* Key facts */}
              <div className="surface-card p-5 flex flex-col gap-4">
                <div className="section-label">Metadata</div>

                <Row label="Category" value={memory.category} />
                <Row label="Importance Score" value={
                  memory.importance != null
                    ? <ImportanceBar value={memory.importance} />
                    : null
                } rawValue={memory.importance != null ? `${memory.importance}/10` : null} />
                <Row label="Status" value={
                  <span className="badge-ok">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-primary)]" />
                    Active
                  </span>
                } />
                <Row label="Distance" value={
                  memory.distance != null
                    ? <span className="mono text-xs font-semibold text-[var(--text-primary)]">{memory.distance.toFixed(4)}</span>
                    : null
                } />
                <Row label="Confidence" value={
                  memory.confidence != null
                    ? `${Math.round(memory.confidence * 100)}%`
                    : null
                } />
              </div>

              {/* Timestamps */}
              {(memory.created_at || memory.last_retrieved) && (
                <div className="surface-card p-5 flex flex-col gap-3">
                  <div className="section-label">Timeline</div>
                  {memory.created_at && (
                    <Row label="Created" value={new Date(memory.created_at).toLocaleString()} />
                  )}
                  {memory.last_retrieved && (
                    <Row label="Last Retrieved" value={new Date(memory.last_retrieved).toLocaleString()} />
                  )}
                </div>
              )}

              {/* Raw metadata if present */}
              {memory.metadata && Object.keys(memory.metadata).length > 0 && (
                <div className="surface-card p-5">
                  <div className="section-label mb-3">Raw Metadata</div>
                  <pre className="mono text-[10px] overflow-x-auto custom-scrollbar text-[var(--text-secondary)]">
                    {JSON.stringify(memory.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Decision badge if present */}
              {memory.decision && (
                <div className="surface-card p-5 flex flex-col gap-2">
                  <div className="section-label">Decision Engine</div>
                  <span className="text-xs font-bold uppercase tracking-widest px-2 py-1 rounded w-fit badge-ok">
                    {memory.decision}
                  </span>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

function Row({ label, value, rawValue }) {
  const display = rawValue ?? value;
  if (display == null) return null;
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs font-medium shrink-0 text-[var(--text-secondary)]">{label}</span>
      {typeof value === 'string' || typeof value === 'number' || value == null ? (
        <span className="text-xs font-semibold text-right text-[var(--text-primary)]">
          {display === null || display === undefined || display === '' ? 'Not available' : String(display)}
        </span>
      ) : (
        <div className="flex items-center gap-2">
          {rawValue && <span className="mono text-[10px] font-semibold text-[var(--text-primary)]">{rawValue}</span>}
          {value}
        </div>
      )}
    </div>
  );
}

function ImportanceBar({ value }) {
  const pct = Math.min(100, Math.max(0, (value / 10) * 100));
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full overflow-hidden bg-[var(--border)]">
        <div className="h-full rounded-full transition-all duration-500 bg-[var(--text-primary)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
