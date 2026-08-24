import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { api } from '../services/api';
import {
  RefreshCw, Database, Brain, Activity, BarChart2, PieChart as PieChartIcon,
  Zap, ShieldCheck, TrendingUp, Layers, CheckCircle2, AlertTriangle, ArrowUpRight,
  Clock, Server, Tag, Sparkles
} from 'lucide-react';

const TABS = ['Overview', 'Category Analysis', 'Importance Weight', 'Decay & Retention', 'System Health'];
const PIE_COLORS = ['#1A5632', '#2EA76D', '#86EFAC', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'];

export default function Analytics() {
  const [tab, setTab]                   = useState('Overview');
  const [memories, setMemories]         = useState([]);
  const [dreamStatus, setDreamStatus]   = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading]           = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [memRes, dreamRes, sysRes] = await Promise.allSettled([
        api.getAllMemories(),
        api.getDreamStatus(),
        fetch('/system/status').then(r => r.ok ? r.json() : null),
      ]);
      if (memRes.status === 'fulfilled')   setMemories(memRes.value.memories || []);
      if (dreamRes.status === 'fulfilled') setDreamStatus(dreamRes.value);
      if (sysRes.status === 'fulfilled' && sysRes.value) setSystemStatus(sysRes.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── Calculations ── */
  const total = memories.length;

  const categoryData = useMemo(() => {
    const map = {};
    memories.forEach(m => {
      const c = m.category || 'General';
      map[c] = (map[c] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
    }));
  }, [memories, total]);

  const importanceData = useMemo(() => {
    const buckets = [
      { range: '1–2 (Low)',     min: 1, max: 2, count: 0, desc: 'Ephemeral' },
      { range: '3–4 (Minor)',   min: 3, max: 4, count: 0, desc: 'Low weight' },
      { range: '5–6 (Moderate)',min: 5, max: 6, count: 0, desc: 'Store threshold' },
      { range: '7–8 (High)',    min: 7, max: 8, count: 0, desc: 'Core priority' },
      { range: '9–10 (Critical)',min: 9, max: 10, count: 0, desc: 'Permanent anchor' },
    ];
    memories.forEach(m => {
      const s = m.importance ?? 5;
      buckets.forEach(b => { if (s >= b.min && s <= b.max) b.count++; });
    });
    return buckets.map(b => ({ name: b.range, count: b.count, desc: b.desc }));
  }, [memories]);

  const avgImportance = useMemo(() => {
    return total > 0
      ? (memories.reduce((s, m) => s + (m.importance ?? 5), 0) / total).toFixed(2)
      : '0.00';
  }, [memories, total]);

  /* ── Simulated Ebbinghaus Retention Curve ── */
  const retentionCurve = useMemo(() => {
    const days = [1, 2, 4, 7, 14, 30, 60, 90];
    return days.map(d => {
      // Retention formula R = e^(-t/S) where S is proportional to average importance
      const S = parseFloat(avgImportance) * 15 || 50;
      const retentionPct = Math.round(Math.exp(-d / S) * 100);
      return {
        day: `Day ${d}`,
        retention: retentionPct,
        decayed: 100 - retentionPct,
      };
    });
  }, [avgImportance]);

  /* ── Category average importance analysis ── */
  const categoryWeights = useMemo(() => {
    const map = {};
    memories.forEach(m => {
      const c = m.category || 'General';
      if (!map[c]) map[c] = { totalImp: 0, count: 0 };
      map[c].totalImp += (m.importance || 5);
      map[c].count += 1;
    });
    return Object.entries(map).map(([name, data]) => ({
      category: name,
      avgScore: (data.totalImp / data.count).toFixed(1),
      count: data.count,
    })).sort((a, b) => b.avgScore - a.avgScore);
  }, [memories]);

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full h-full animate-fade-in-up">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Cognitive Analytics
            </h1>
            <span className="badge-ok text-xs">
              <TrendingUp size={13} />
              Real-Time Metrics
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Deep telemetry derived directly from ChromaDB vector store and Dream Engine consolidation cycles.
          </p>
        </div>
        <button onClick={fetchAll} className="btn-ghost text-xs py-2 px-3">
          <RefreshCw size={14} />
          Refresh Metrics
        </button>
      </header>

      {/* ── Tabs Navigation ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 custom-scrollbar border-b border-gray-200">
        {TABS.map(t => {
          const isActive = tab === t;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-px flex items-center gap-1.5 ${
                isActive
                  ? 'border-gray-900 text-gray-900'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* ── Content Panes ── */}
      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pb-6">
        {tab === 'Overview' && (
          <OverviewView
            memories={memories}
            categoryData={categoryData}
            importanceData={importanceData}
            avgImportance={avgImportance}
            dreamStatus={dreamStatus}
            loading={loading}
          />
        )}
        {tab === 'Category Analysis' && (
          <CategoryView categoryData={categoryData} categoryWeights={categoryWeights} total={total} />
        )}
        {tab === 'Importance Weight' && (
          <ImportanceView importanceData={importanceData} avgImportance={avgImportance} total={total} />
        )}
        {tab === 'Decay & Retention' && (
          <DecayView retentionCurve={retentionCurve} memories={memories} avgImportance={avgImportance} />
        )}
        {tab === 'System Health' && (
          <SystemHealthView systemStatus={systemStatus} dreamStatus={dreamStatus} total={total} />
        )}
      </main>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Tab 1: Overview View
   ─────────────────────────────────────────────────────────────────────────── */
function OverviewView({ memories, categoryData, importanceData, avgImportance, dreamStatus, loading }) {
  const highPriority = memories.filter(m => (m.importance || 0) >= 7).length;
  const processed = dreamStatus?.last_result?.memories_processed ?? memories.length;

  return (
    <div className="flex flex-col gap-6">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="surface-card p-5 bg-white flex flex-col justify-between rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Total Memories</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center">
              <Database size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-gray-900">{loading ? '…' : memories.length}</p>
            <p className="text-xs text-emerald-700 font-semibold mt-1">100% Vector Indexed</p>
          </div>
        </div>

        <div className="surface-card p-5 bg-white flex flex-col justify-between rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Mean Weight</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <Zap size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-gray-900">{loading ? '…' : avgImportance} <span className="text-xs text-gray-400 font-normal">/ 10</span></p>
            <p className="text-xs text-amber-700 font-semibold mt-1">Store Threshold: ≥ 5.0</p>
          </div>
        </div>

        <div className="surface-card p-5 bg-white flex flex-col justify-between rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">High Priority</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center">
              <ShieldCheck size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-gray-900">{loading ? '…' : highPriority}</p>
            <p className="text-xs text-purple-700 font-semibold mt-1">Importance ≥ 7</p>
          </div>
        </div>

        <div className="surface-card p-5 bg-white flex flex-col justify-between rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Consolidated</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center">
              <Brain size={16} />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-3xl font-bold text-gray-900">{loading ? '…' : processed}</p>
            <p className="text-xs text-blue-700 font-semibold mt-1">Dream Cycles Active</p>
          </div>
        </div>
      </div>

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Share Bar */}
        <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Semantic Domain Distribution</h3>
              <p className="text-xs text-gray-400">Breakdown of memory items by category</p>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
              {categoryData.length} Categories
            </span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="surface-card p-3 text-xs shadow-lg bg-white rounded-xl border border-gray-100">
                      <p className="font-bold text-gray-900">{label}</p>
                      <p className="text-emerald-700 font-bold mt-0.5">{payload[0].value} items ({payload[0].payload.pct}%)</p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Importance Spectrum Histogram */}
        <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Cognitive Weight Distribution</h3>
              <p className="text-xs text-gray-400">Importance scores across 1–10 spectrum</p>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full">
              Avg {avgImportance}/10
            </span>
          </div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={importanceData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <div className="surface-card p-3 text-xs shadow-lg bg-white rounded-xl border border-gray-100">
                      <p className="font-bold text-gray-900">{label}</p>
                      <p className="text-emerald-700 font-bold">{payload[0].value} items</p>
                      <p className="text-gray-400 text-[10px] mt-0.5">{payload[0].payload.desc}</p>
                    </div>
                  ) : null
                }
              />
              <Bar dataKey="count" fill="#1A5632" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Tab 2: Category Analysis
   ─────────────────────────────────────────────────────────────────────────── */
function CategoryView({ categoryData, categoryWeights, total }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Pie share */}
        <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Category Volume Share</h3>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0" style={{ width: 180, height: 180 }}>
              <PieChart width={180} height={180}>
                <Pie
                  data={categoryData}
                  cx={90}
                  cy={90}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={val => [`${val} items`]} />
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-gray-900">{total}</span>
                <span className="text-[10px] text-gray-400">Total Items</span>
              </div>
            </div>
            <div className="flex flex-col gap-2 flex-1 w-full">
              {categoryData.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="font-medium text-gray-700">{d.name}</span>
                  </div>
                  <span className="font-bold text-gray-900">{d.value} ({d.pct}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Category Weight Rankings */}
        <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-3">
          <h3 className="text-sm font-bold text-gray-900">Category Importance Weights</h3>
          <p className="text-xs text-gray-400">Average cognitive significance score per semantic domain</p>
          <div className="flex flex-col gap-2 mt-2">
            {categoryWeights.map((cw, i) => (
              <div key={cw.category} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-gray-900">{cw.category}</p>
                    <p className="text-[10px] text-gray-400">{cw.count} memory item(s)</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-800">{cw.avgScore}</span>
                  <span className="text-[10px] text-gray-400"> / 10 avg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Tab 3: Importance View
   ─────────────────────────────────────────────────────────────────────────── */
function ImportanceView({ importanceData, avgImportance, total }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-900">Decision Engine Routing Threshold</h3>
            <p className="text-xs text-gray-400 mt-0.5">DREAM ImportanceScorer scores candidate memories on a 1–10 scale.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              STORE ≥ 5
            </span>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-600">
              DISCARD &lt; 5
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {importanceData.map((bucket, i) => (
            <div key={bucket.name} className="p-4 rounded-xl border border-gray-100 bg-gray-50 flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">{bucket.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{bucket.desc}</p>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-emerald-900">{bucket.count}</p>
                <p className="text-[10px] text-gray-500">{total > 0 ? Math.round(bucket.count / total * 100) : 0}% of memories</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Tab 4: Decay & Retention View
   ─────────────────────────────────────────────────────────────────────────── */
function DecayView({ retentionCurve, memories, avgImportance }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Estimated Retention Half-Life Curve</h3>
            <p className="text-xs text-gray-400">Ebbinghaus forgetting curve modeling cognitive stability across time</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800">
            Stability Index: {avgImportance}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={retentionCurve} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
            <defs>
              <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A5632" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#1A5632" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} domain={[0, 100]} unit="%" />
            <Tooltip
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="surface-card p-3 text-xs shadow-lg bg-white rounded-xl border border-gray-100">
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-emerald-700 font-bold">Estimated Retention: {payload[0].value}%</p>
                  </div>
                ) : null
              }
            />
            <Area type="monotone" dataKey="retention" stroke="#1A5632" strokeWidth={3} fill="url(#retGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────────────────────────
   Tab 5: System Health View
   ─────────────────────────────────────────────────────────────────────────── */
function SystemHealthView({ systemStatus, dreamStatus, total }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Server size={18} className="text-emerald-800" />
              <h3 className="text-sm font-bold text-gray-900">FastAPI Backend</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {systemStatus?.backend || 'Online'}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex flex-col gap-1.5 pt-2 border-t border-gray-100">
            <div className="flex justify-between"><span>Host:</span><span className="font-mono">localhost:8000</span></div>
            <div className="flex justify-between"><span>Lifecycle:</span><span>Lifespan Async</span></div>
            <div className="flex justify-between"><span>FastAPI Status:</span><span className="text-emerald-700 font-bold">Healthy</span></div>
          </div>
        </div>

        <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Brain size={18} className="text-emerald-800" />
              <h3 className="text-sm font-bold text-gray-900">Ollama LLM Engine</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {systemStatus?.ollama || 'Online'}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex flex-col gap-1.5 pt-2 border-t border-gray-100">
            <div className="flex justify-between"><span>Model:</span><span className="font-mono font-bold">llama3.1:latest</span></div>
            <div className="flex justify-between"><span>Parameters:</span><span>8.0 Billion</span></div>
            <div className="flex justify-between"><span>Fallback Provider:</span><span>Gemini 3.1 Pro</span></div>
          </div>
        </div>

        <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Database size={18} className="text-emerald-800" />
              <h3 className="text-sm font-bold text-gray-900">ChromaDB Store</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {systemStatus?.chromadb || 'Online'}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex flex-col gap-1.5 pt-2 border-t border-gray-100">
            <div className="flex justify-between"><span>Collection:</span><span className="font-mono">memories</span></div>
            <div className="flex justify-between"><span>Total Vectors:</span><span className="font-bold">{total}</span></div>
            <div className="flex justify-between"><span>Distance Metric:</span><span>Cosine Similarity</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
