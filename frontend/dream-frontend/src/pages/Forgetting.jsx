import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import {
  RefreshCw, AlertTriangle, Archive, Hourglass, ShieldCheck,
  Zap, ArrowDownRight, CheckCircle2, Filter, Search, Info, HelpCircle
} from 'lucide-react';

function decayScore(mem) {
  const imp = mem.importance ?? 5;
  return Math.max(0, Math.min(1, 1 - (imp / 10)));
}

function retentionState(score) {
  if (score <= 0.2) return { label: 'Permanent Anchor', bg: '#D1FAE5', text: '#065F46', desc: 'Protected from decay' };
  if (score <= 0.4) return { label: 'Active Retention',  bg: '#ECFDF5', text: '#047857', desc: 'High recall strength' };
  if (score <= 0.6) return { label: 'Stable',            bg: '#EFF6FF', text: '#1D4ED8', desc: 'Normal half-life' };
  if (score <= 0.8) return { label: 'Decay Risk',        bg: '#FEF3C7', text: '#92400E', desc: 'Candidate for consolidation' };
  return                   { label: 'Archive Candidate',bg: '#FEE2E2', text: '#991B1B', desc: 'Low cognitive significance' };
}

const SORT_OPTIONS = [
  { value: 'decay-desc', label: 'Decay Risk: High → Low' },
  { value: 'decay-asc',  label: 'Decay Risk: Low → High' },
  { value: 'imp-desc',   label: 'Importance: High → Low' },
  { value: 'category',   label: 'Category (A–Z)' },
];

export default function Forgetting() {
  const [memories, setMemories]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [sort, setSort]                 = useState('decay-desc');
  const [filterState, setFilterState]   = useState('All');
  const [search, setSearch]             = useState('');

  const fetchMemories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getAllMemories();
      setMemories(data.memories || []);
    } catch {
      setError('Failed to load memory store telemetry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const withDecay = useMemo(() => {
    return memories.map(m => {
      const d = decayScore(m);
      return {
        ...m,
        _decay: d,
        _decayPct: Math.round(d * 100),
        _retention: retentionState(d),
      };
    });
  }, [memories]);

  const sorted = useMemo(() => {
    return [...withDecay]
      .filter(m => {
        const matchesFilter = filterState === 'All' || m._retention.label === filterState;
        const matchesSearch = !search || m.memory.toLowerCase().includes(search.toLowerCase()) || (m.category || '').toLowerCase().includes(search.toLowerCase());
        return matchesFilter && matchesSearch;
      })
      .sort((a, b) => {
        if (sort === 'decay-desc') return b._decay - a._decay;
        if (sort === 'decay-asc')  return a._decay - b._decay;
        if (sort === 'imp-desc')   return (b.importance ?? 5) - (a.importance ?? 5);
        if (sort === 'category')   return (a.category || '').localeCompare(b.category || '');
        return 0;
      });
  }, [withDecay, filterState, search, sort]);

  const states = ['All', 'Permanent Anchor', 'Active Retention', 'Stable', 'Decay Risk', 'Archive Candidate'];

  const permanentCount = withDecay.filter(m => m._retention.label === 'Permanent Anchor').length;
  const decayRiskCount = withDecay.filter(m => m._retention.label === 'Decay Risk' || m._retention.label === 'Archive Candidate').length;

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full h-full animate-fade-in-up">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Forgetting & Decay Engine
            </h1>
            <span className="badge-ok text-xs">
              <Hourglass size={13} />
              Ebbinghaus Half-Life Model
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Cognitive stability analysis and memory retention health modeled against cognitive weight thresholds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchMemories} className="btn-ghost text-xs py-2 px-3">
            <RefreshCw size={14} />
            Refresh Telemetry
          </button>
        </div>
      </header>

      {/* ── Top Summary Stats Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Monitored</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">{memories.length} items</p>
          <span className="text-[10px] text-gray-500 font-semibold mt-1">ChromaDB live vector store</span>
        </div>

        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Permanent Anchors</span>
          <p className="text-2xl font-bold text-emerald-900 mt-2">{permanentCount}</p>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1">Zero decay risk (Imp ≥ 8)</span>
        </div>

        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Decay Risk Candidates</span>
          <p className="text-2xl font-bold text-amber-900 mt-2">{decayRiskCount}</p>
          <span className="text-[10px] text-amber-700 font-semibold mt-1">Subject to consolidation</span>
        </div>

        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Half-Life Formula</span>
          <p className="text-base font-bold font-mono text-gray-900 mt-2">R = e^(-t / S)</p>
          <span className="text-[10px] text-purple-700 font-semibold mt-1">S ∝ Cognitive Importance</span>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
        <div className="relative flex-1 w-full">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search memory items by content or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="dream-input pl-10 text-xs py-2 w-full"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          className="dream-select text-xs h-10 px-3 w-52 bg-white border border-gray-200 text-gray-800 font-semibold"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* ── State Filter Chips ── */}
      <div className="flex flex-wrap gap-2 shrink-0">
        {states.map(s => {
          const count = s === 'All' ? withDecay.length : withDecay.filter(m => m._retention.label === s).length;
          const isActive = filterState === s;
          return (
            <button
              key={s}
              onClick={() => setFilterState(s)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all border flex items-center gap-1.5 ${
                isActive
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              <span>{s}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Table / Stream ── */}
      <main className="flex-1 min-h-0 surface-card bg-white rounded-2xl border border-gray-100 overflow-hidden flex flex-col shadow-sm">
        {/* Table header */}
        <div className="px-6 py-3.5 grid grid-cols-12 gap-4 shrink-0 border-b border-gray-100 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
          <span className="col-span-5">Memory Document</span>
          <span className="col-span-2">Domain</span>
          <span className="col-span-2 text-center">Cognitive Score</span>
          <span className="col-span-2 text-center">Decay Risk</span>
          <span className="col-span-1 text-center">State</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-gray-50">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-4 grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5 skeleton h-4 rounded" />
                <div className="col-span-2 skeleton h-4 rounded" />
                <div className="col-span-2 skeleton h-4 rounded" />
                <div className="col-span-2 skeleton h-4 rounded" />
                <div className="col-span-1 skeleton h-4 rounded" />
              </div>
            ))
          ) : sorted.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Hourglass size={36} className="text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-700">No memories match this decay filter</p>
            </div>
          ) : (
            sorted.map((mem, i) => (
              <div
                key={i}
                className="px-6 py-3.5 grid grid-cols-12 gap-4 items-center hover:bg-gray-50/80 transition-colors"
              >
                {/* Memory content */}
                <div className="col-span-5 flex flex-col gap-0.5 min-w-0 pr-2">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    "{mem.memory}"
                  </span>
                </div>

                {/* Category */}
                <div className="col-span-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {mem.category || 'General'}
                  </span>
                </div>

                {/* Importance score */}
                <div className="col-span-2 text-center">
                  <span className="mono text-xs font-bold text-gray-900">
                    {mem.importance ?? '—'}/10
                  </span>
                </div>

                {/* Decay bar */}
                <div className="col-span-2 flex flex-col gap-1 items-center px-2">
                  <div className="w-full h-2 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                    <div
                      className={`h-full rounded-full ${
                        mem._decayPct > 50 ? 'bg-amber-500' : 'bg-emerald-600'
                      }`}
                      style={{ width: `${mem._decayPct}%` }}
                    />
                  </div>
                  <span className="mono text-[10px] text-gray-500 font-semibold">{mem._decayPct}% risk</span>
                </div>

                {/* State badge */}
                <div className="col-span-1 flex justify-center">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ background: mem._retention.bg, color: mem._retention.text }}
                  >
                    {mem._retention.label}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
