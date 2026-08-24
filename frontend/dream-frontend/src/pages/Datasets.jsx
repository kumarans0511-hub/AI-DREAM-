import React, { useState, useEffect, useCallback } from 'react';
import {
  Database, BookOpen, ArrowUpRight, RefreshCw, ChevronLeft, ChevronRight,
  Filter, ExternalLink, FileText, Brain, Clock, Layers, Tag, CheckCircle2,
  HelpCircle, Sparkles, Download, Search, Info
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';

/* ── Color palette ── */
const PIE_COLORS  = ['#1A5632', '#2EA76D', '#86EFAC', '#F59E0B', '#3B82F6', '#8B5CF6'];
const TYPE_LABELS = {
  'temporal-reasoning':        'Temporal Reasoning',
  'multi-session':             'Multi-Session',
  'knowledge-update':          'Knowledge Update',
  'single-session-preference': 'Single-Session Pref.',
  'single-session-assistant':  'Single-Session Asst.',
  'single-session-user':       'Single-Session User',
};

const CATEGORY_DESCS = {
  'Single-hop Temporal': 'Questions resolving a single time-anchored event across dialog history.',
  'Multi-hop Temporal':  'Complex multi-step temporal dependencies spanning multiple sessions.',
  'Open-ended':          'Free-form summarization and behavioral synthesis across sessions.',
  'Adversarial':         'Probing questions with decoy or contradictory information.',
};

export default function Datasets() {
  const [info, setInfo]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // Active dataset tab
  const [activeDs, setActiveDs] = useState('locomo'); // 'locomo' | 'longmemeval'

  // Samples state
  const [samples, setSamples]               = useState([]);
  const [samplesLoading, setSamplesLoading] = useState(false);
  const [total, setTotal]                   = useState(0);
  const [offset, setOffset]                 = useState(0);
  const [lmeFilter, setLmeFilter]           = useState('');
  const [searchQuery, setSearchQuery]       = useState('');
  const PAGE = 12;

  /* ── Fetch info ── */
  const fetchInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/datasets/info');
      if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load dataset metadata`);
      const data = await res.json();
      setInfo(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  /* ── Fetch samples ── */
  const fetchSamples = useCallback(async (ds, off, filter) => {
    setSamplesLoading(true);
    try {
      let url;
      if (ds === 'locomo') {
        url = `/datasets/locomo/samples?limit=${PAGE}&offset=${off}`;
      } else {
        url = `/datasets/longmemeval/samples?limit=${PAGE}&offset=${off}${filter ? `&question_type=${filter}` : ''}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSamples(data.samples || []);
      setTotal(data.total || 0);
    } catch {
      setSamples([]);
    } finally {
      setSamplesLoading(false);
    }
  }, []);

  useEffect(() => {
    setOffset(0);
    setLmeFilter('');
    setSearchQuery('');
    fetchSamples(activeDs, 0, '');
  }, [activeDs, fetchSamples]);

  const handlePage = (dir) => {
    const next = offset + dir * PAGE;
    if (next < 0 || next >= total) return;
    setOffset(next);
    fetchSamples(activeDs, next, lmeFilter);
  };

  const applyFilter = (f) => {
    const next = f === lmeFilter ? '' : f;
    setLmeFilter(next);
    setOffset(0);
    fetchSamples('longmemeval', 0, next);
  };

  /* ── Filtered samples by text search ── */
  const filteredSamples = samples.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.question && s.question.toLowerCase().includes(q)) ||
      (s.category && s.category.toLowerCase().includes(q)) ||
      (s.question_type && s.question_type.toLowerCase().includes(q)) ||
      (s.session_id && s.session_id.toLowerCase().includes(q))
    );
  });

  /* ── Chart data ── */
  const locomoChartData = info
    ? Object.entries(info.locomo.categories).map(([name, value]) => ({ name, value }))
    : [];

  const lmeChartData = info
    ? Object.entries(info.longmemeval.question_types).map(([name, value]) => ({
        name: TYPE_LABELS[name] || name,
        value,
        raw: name,
      }))
    : [];

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full animate-fade-in-up">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Benchmark Datasets
            </h1>
            <span className="badge-ok text-xs">
              <CheckCircle2 size={13} />
              Mounted & Active
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Comprehensive long-term memory benchmarks integrated into DREAM evaluation suite.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchInfo} className="btn-ghost">
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div
          className="px-4 py-3 rounded-xl text-sm font-medium border flex items-center justify-between"
          style={{ background: '#FEF2F2', color: '#991B1B', borderColor: '#FECACA' }}
        >
          <span>{error}</span>
          <button onClick={fetchInfo} className="underline text-xs font-semibold">Retry</button>
        </div>
      )}

      {/* ── Benchmark Overview Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2].map(i => <div key={i} className="skeleton h-64 rounded-xl" />)}
        </div>
      ) : info && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* LoCoMo Card */}
          <div
            className="surface-card p-6 flex flex-col gap-5 cursor-pointer transition-all hover:shadow-lg"
            onClick={() => setActiveDs('locomo')}
            style={{
              border: activeDs === 'locomo' ? '2.5px solid var(--brand-dark)' : '1px solid var(--border)',
              background: activeDs === 'locomo' ? '#FBFCFB' : 'var(--bg-card)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: 'var(--brand-dark)', color: 'white' }}
                >
                  <BookOpen size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>LoCoMo</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--brand-light)', color: 'var(--brand-dark)' }}>
                      Multi-Session QA
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {info.locomo.file} · {info.locomo.size_mb} MB
                  </p>
                </div>
              </div>
              <a
                href={info.locomo.source}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-2 rounded-xl border hover:bg-gray-50 text-gray-500"
                title="View Paper"
              >
                <ExternalLink size={15} />
              </a>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {info.locomo.description}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <StatItem label="Dialog Sessions" value={info.locomo.sessions} sub="Full narratives" accent="#D1FAE5" />
              <StatItem label="Total QA Pairs" value={info.locomo.total_qa.toLocaleString()} sub="Verified queries" accent="#D1FAE5" />
              <StatItem label="Dialog Turns" value={info.locomo.total_turns} sub="Multi-party turns" accent="#D1FAE5" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                Category Breakdown
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(info.locomo.categories).map(([cat, count]) => (
                  <span
                    key={cat}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-dark)]" />
                    <span style={{ color: 'var(--text-primary)' }}>{cat}:</span>
                    <strong style={{ color: 'var(--brand-dark)' }}>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* LongMemEval Card */}
          <div
            className="surface-card p-6 flex flex-col gap-5 cursor-pointer transition-all hover:shadow-lg"
            onClick={() => setActiveDs('longmemeval')}
            style={{
              border: activeDs === 'longmemeval' ? '2.5px solid #2563EB' : '1px solid var(--border)',
              background: activeDs === 'longmemeval' ? '#F8FAFC' : 'var(--bg-card)',
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ background: '#2563EB', color: 'white' }}
                >
                  <Database size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>LongMemEval</h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                      Oracle Split
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {info.longmemeval.file} · {info.longmemeval.size_mb} MB
                  </p>
                </div>
              </div>
              <a
                href={info.longmemeval.source}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="p-2 rounded-xl border hover:bg-gray-50 text-gray-500"
                title="View Paper"
              >
                <ExternalLink size={15} />
              </a>
            </div>

            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {info.longmemeval.description}
            </p>

            <div className="grid grid-cols-3 gap-3">
              <StatItem label="Questions" value={info.longmemeval.questions} sub="Evaluated items" accent="#EFF6FF" />
              <StatItem label="Avg Haystack" value={`${info.longmemeval.avg_sessions} sess`} sub="Context depth" accent="#EFF6FF" />
              <StatItem label="Question Types" value={Object.keys(info.longmemeval.question_types).length} sub="Task taxonomies" accent="#EFF6FF" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2.5" style={{ color: 'var(--text-muted)' }}>
                Question Taxonomy
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(info.longmemeval.question_types).map(([type, count]) => (
                  <span
                    key={type}
                    className="text-xs font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                    style={{ background: 'var(--bg-base)', border: '1px solid var(--border)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    <span style={{ color: 'var(--text-primary)' }}>{TYPE_LABELS[type] || type}:</span>
                    <strong style={{ color: '#1D4ED8' }}>{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Visual Analytics Row ── */}
      {info && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LoCoMo bar chart */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  LoCoMo Question Category Distribution
                </h3>
                <p className="text-xs text-[var(--text-muted)]">1,382 question items classified by difficulty</p>
              </div>
              <span className="badge-ok text-[11px]">10 Sessions</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={locomoChartData} margin={{ top: 10, right: 10, left: -15, bottom: 25 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6B7280', fontSize: 11 }}
                  angle={-10}
                  textAnchor="end"
                  dy={6}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <div className="surface-card px-3 py-2 text-xs shadow-lg">
                        <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                        <div className="font-bold text-sm" style={{ color: 'var(--brand-dark)' }}>
                          {payload[0].value} questions ({Math.round(payload[0].value / info.locomo.total_qa * 100)}%)
                        </div>
                        <div className="text-[10px] mt-1 text-gray-500 max-w-[200px]">
                          {CATEGORY_DESCS[label]}
                        </div>
                      </div>
                    ) : null
                  }
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {locomoChartData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* LongMemEval pie chart */}
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  LongMemEval Question Types
                </h3>
                <p className="text-xs text-[var(--text-muted)]">500 benchmark items with gold standard answers</p>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: '#EFF6FF', color: '#1D4ED8' }}>
                Oracle Split
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0" style={{ width: 170, height: 170 }}>
                <PieChart width={170} height={170}>
                  <Pie
                    data={lmeChartData}
                    cx={85}
                    cy={85}
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {lmeChartData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={val => [`${val} questions`]} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>500</span>
                  <span className="text-[9px] text-gray-500">Queries</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 flex-1 w-full">
                {lmeChartData.map((d, i) => (
                  <div key={d.raw} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{d.name}</span>
                    </div>
                    <span className="mono font-semibold ml-2" style={{ color: 'var(--text-primary)' }}>
                      {d.value} <span className="text-[10px] text-gray-400">({Math.round(d.value / 500 * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Interactive Sample Browser ── */}
      <div className="surface-card p-6 flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Dataset Sample Browser
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {total.toLocaleString()} total items
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Click any question row to expand the gold answer, evidence, and session metadata
            </p>
          </div>

          {/* Dataset switcher tabs */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveDs('locomo')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeDs === 'locomo'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              LoCoMo ({info?.locomo.total_qa || 1382})
            </button>
            <button
              onClick={() => setActiveDs('longmemeval')}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeDs === 'longmemeval'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              LongMemEval ({info?.longmemeval.questions || 500})
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeDs === 'locomo' ? 'LoCoMo' : 'LongMemEval'} questions or categories…`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="dream-input pl-10 text-xs py-2 w-full"
            />
          </div>
        </div>

        {/* LME Category filter pills */}
        {activeDs === 'longmemeval' && info && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <Filter size={13} className="text-gray-400 mr-1" />
            <FilterPill active={lmeFilter === ''} onClick={() => applyFilter('')}>All</FilterPill>
            {Object.keys(info.longmemeval.question_types).map(t => (
              <FilterPill key={t} active={lmeFilter === t} onClick={() => applyFilter(t)}>
                {TYPE_LABELS[t] || t}
              </FilterPill>
            ))}
          </div>
        )}

        {/* Samples list */}
        <div className="flex flex-col gap-2.5 min-h-[300px]">
          {samplesLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))
          ) : filteredSamples.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Database size={36} className="text-gray-300 mb-2" strokeWidth={1.5} />
              <p className="text-sm font-semibold text-gray-700">No matching questions found</p>
              <p className="text-xs text-gray-400 mt-1">Try clearing the search or category filters</p>
            </div>
          ) : (
            filteredSamples.map((s, i) => (
              <SampleRow key={i} sample={s} dataset={activeDs} />
            ))
          )}
        </div>

        {/* Pagination bar */}
        <div className="flex items-center justify-between border-t border-[var(--border)] pt-4">
          <span className="text-xs text-gray-500 font-medium">
            Showing {offset + 1}–{Math.min(offset + PAGE, total)} of {total.toLocaleString()} questions
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePage(-1)}
              disabled={offset === 0 || samplesLoading}
              className="btn-ghost py-1.5 px-3 text-xs disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Prev
            </button>
            <button
              onClick={() => handlePage(1)}
              disabled={offset + PAGE >= total || samplesLoading}
              className="btn-ghost py-1.5 px-3 text-xs disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── Subcomponents ── */
function StatItem({ label, value, sub, accent }) {
  return (
    <div className="flex flex-col p-3 rounded-xl" style={{ background: accent || 'var(--bg-base)' }}>
      <span className="text-[11px] font-semibold text-gray-600">{label}</span>
      <span className="text-xl font-bold my-0.5 text-gray-900">{value}</span>
      <span className="text-[10px] text-gray-500">{sub}</span>
    </div>
  );
}

function FilterPill({ children, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-semibold px-3 py-1 rounded-full transition-all border ${
        active
          ? 'bg-gray-900 text-white border-gray-900'
          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
      }`}
    >
      {children}
    </button>
  );
}

function SampleRow({ sample, dataset }) {
  const [expanded, setExpanded] = useState(false);

  if (dataset === 'locomo') {
    return (
      <div
        className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-all cursor-pointer shadow-sm"
        onClick={() => setExpanded(e => !e)}
        style={{ borderLeft: '4px solid var(--brand-dark)' }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 flex-1">
            <span className="text-xs text-gray-400 font-mono mt-0.5 shrink-0">Q:</span>
            <p className="text-sm font-semibold text-gray-900 leading-snug">
              {sample.question}
            </p>
          </div>
          <span className="text-[10px] font-bold shrink-0 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
            {sample.category}
          </span>
        </div>

        {expanded ? (
          <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-col gap-2.5 animate-fade-in">
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-emerald-700 font-mono mt-0.5 shrink-0">Answer:</span>
              <p className="text-sm font-medium text-gray-800">
                {Array.isArray(sample.answer) ? sample.answer.join(', ') : sample.answer}
              </p>
            </div>
            {sample.evidence?.length > 0 && (
              <div className="flex items-start gap-3 text-xs text-gray-500">
                <span className="font-bold text-gray-400 shrink-0">Evidence Nodes:</span>
                <span className="font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                  {sample.evidence.join(', ')}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                Session ID: {sample.session_id}
              </span>
              {sample.multi_modal && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                  Multi-Modal Reference
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
            <span className="font-mono text-[11px]">Session: {sample.session_id}</span>
            <span className="text-[11px] text-emerald-700 font-semibold hover:underline">Click to view answer ↓</span>
          </div>
        )}
      </div>
    );
  }

  // LongMemEval
  return (
    <div
      className="p-4 rounded-xl border border-gray-100 bg-white hover:border-gray-300 transition-all cursor-pointer shadow-sm"
      onClick={() => setExpanded(e => !e)}
      style={{ borderLeft: '4px solid #2563EB' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 flex-1">
          <span className="text-xs text-blue-400 font-mono mt-0.5 shrink-0">Q:</span>
          <p className="text-sm font-semibold text-gray-900 leading-snug">
            {sample.question}
          </p>
        </div>
        <span className="text-[10px] font-bold shrink-0 px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
          {TYPE_LABELS[sample.question_type] || sample.question_type}
        </span>
      </div>

      {expanded ? (
        <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-col gap-2.5 animate-fade-in">
          <div className="flex items-start gap-3">
            <span className="text-xs font-bold text-blue-700 font-mono mt-0.5 shrink-0">Answer:</span>
            <p className="text-sm font-medium text-gray-800">{sample.answer}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-gray-500">
            {sample.question_date && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                📅 Date: {sample.question_date}
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
              Haystack: {sample.num_sessions} session{sample.num_sessions !== 1 ? 's' : ''}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-500">
              ID: {sample.question_id}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-xs text-gray-400 mt-2">
          <span className="font-mono text-[11px]">{sample.num_sessions} Haystack Session(s)</span>
          <span className="text-[11px] text-blue-700 font-semibold hover:underline">Click to view answer ↓</span>
        </div>
      )}
    </div>
  );
}
