import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { api } from '../services/api';
import MemoryInspectorDrawer from '../components/MemoryInspectorDrawer';
import {
  Database, Zap, Brain, Activity, ArrowUpRight, Plus,
  Settings, Play, Check, Clock, Archive, Lightbulb, Network,
  RefreshCw, AlertCircle, ShieldCheck, Sparkles, Send, Tag, Layers
} from 'lucide-react';

/* ── Memory Category Icon Colors ─────────────────────────────────────────── */
const CAT_COLORS = [
  '#1A5632', '#2EA76D', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6'
];
function catColor(i) { return CAT_COLORS[i % CAT_COLORS.length]; }

const CAT_ICONS = {
  Preference: '🟢', Concept: '🔵', Project: '🟠', Habit: '🟣',
  Fact: '🟡', General: '⚪', Name: '🔴', Pets: '🐾',
  Interests: '💡', Hobbies: '🎯', Personal: '👤', Reflection: '🧬',
};
function catIcon(cat) { return CAT_ICONS[cat] || '🟤'; }

function buildDonut(memories) {
  const high = memories.filter(m => (m.importance || 0) >= 8).length;
  const mid  = memories.filter(m => (m.importance || 0) >= 5 && (m.importance || 0) < 8).length;
  const low  = memories.filter(m => (m.importance || 0) < 5).length;
  const total = memories.length || 1;
  return [
    { name: 'High (8–10)',  value: high,  pct: Math.round(high / total * 100),  fill: '#1A5632' },
    { name: 'Mid (5–7)',    value: mid,   pct: Math.round(mid  / total * 100),  fill: '#2EA76D' },
    { name: 'Low (1–4)',    value: low,   pct: Math.round(low  / total * 100),  fill: '#D1FAE5' },
  ];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [memories, setMemories]         = useState([]);
  const [dreamStatus, setDreamStatus]   = useState(null);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [triggering, setTriggering]     = useState(false);
  const [triggerMsg, setTriggerMsg]     = useState(null);
  const [selectedMem, setSelectedMem]   = useState(null);

  // Quick test memory ingestion state
  const [quickInput, setQuickInput]     = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickMsg, setQuickMsg]         = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      const [memRes, dreamRes, sysRes] = await Promise.allSettled([
        api.getAllMemories(),
        api.getDreamStatus(),
        fetch('/system/status').then(r => r.ok ? r.json() : null),
      ]);
      if (memRes.status === 'fulfilled')   setMemories(memRes.value.memories || []);
      if (dreamRes.status === 'fulfilled') setDreamStatus(dreamRes.value);
      if (sysRes.status === 'fulfilled' && sysRes.value) setSystemStatus(sysRes.value);
    } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const id = setInterval(fetchAll, 15000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerMsg(null);
    try {
      const res = await api.triggerDream();
      setTriggerMsg({ ok: true, text: res?.message || 'Dream cycle completed successfully.' });
      await fetchAll();
    } catch (e) {
      setTriggerMsg({ ok: false, text: 'Trigger request failed.' });
    } finally {
      setTriggering(false);
      setTimeout(() => setTriggerMsg(null), 5000);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickInput.trim()) return;
    setQuickLoading(true);
    setQuickMsg(null);
    try {
      const res = await api.chat(quickInput);
      const extracted = res?.new_memories?.length || 0;
      setQuickMsg({
        ok: true,
        text: extracted > 0
          ? `Extracted & stored ${extracted} new cognitive item(s)!`
          : 'Processed! No high-importance facts extracted.',
      });
      setQuickInput('');
      await fetchAll();
    } catch (err) {
      setQuickMsg({ ok: false, text: 'Failed to process message.' });
    } finally {
      setQuickLoading(false);
      setTimeout(() => setQuickMsg(null), 5000);
    }
  };

  /* ── Derived calculations ── */
  const totalMemories  = memories.length;
  const highImportance = memories.filter(m => (m.importance || 0) >= 7).length;
  const avgImportance  = totalMemories > 0
    ? (memories.reduce((acc, m) => acc + (m.importance || 0), 0) / totalMemories).toFixed(1)
    : '0.0';

  const catMap = {};
  memories.forEach(m => {
    const c = m.category || 'General';
    catMap[c] = (catMap[c] || 0) + 1;
  });
  const uniqueCategories = Object.keys(catMap).length;

  const catData = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7)
    .map(([name, value]) => ({ name, value }));

  const donutData = buildDonut(memories);
  const dominantPct = totalMemories ? donutData[0].pct : 0;

  const catList = Object.entries(catMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const isRunning = dreamStatus?.is_running ?? true;
  const lastProcessed = dreamStatus?.last_result?.memories_processed ?? totalMemories;
  const lastGroups = dreamStatus?.last_result?.groups_found ?? 1;

  return (
    <>
      <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full animate-fade-in-up">

        {/* ── Page Header ── */}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                Cognitive Dashboard
              </h1>
              <span className="badge-ok text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-dark)] animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Real-time monitoring of DREAM memory retention, importance distribution, and dream cycles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="btn-primary flex items-center gap-2"
            >
              {triggering ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
              {triggering ? 'Running Dream…' : 'Run Dream Cycle'}
            </button>
            <button onClick={() => navigate('/settings')} className="btn-ghost">
              <Settings size={14} />
              Settings
            </button>
          </div>
        </header>

        {/* ── Top Metric Cards (Donezo Style) ── */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1 — Total Memories (Dark Green Hero Card) */}
          <button
            onClick={() => navigate('/memory-explorer')}
            className="surface-card p-5 flex flex-col justify-between text-left w-full transition-all duration-200 hover:shadow-xl"
            style={{
              background: 'var(--brand-dark)',
              boxShadow: '0 6px 24px rgba(26,86,50,0.25)',
              minHeight: 155,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/15">
                <Database size={20} color="white" />
              </div>
              <ArrowUpRight size={18} className="text-white/60" />
            </div>
            <div>
              <div className="text-3xl font-bold text-white leading-tight">
                {loading ? '…' : totalMemories}
              </div>
              <div className="text-xs font-semibold text-white/80 mt-1">
                Total Cognitive Memories
              </div>
              <div className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-green-300">
                <ShieldCheck size={12} />
                ChromaDB Vector Store
              </div>
            </div>
          </button>

          {/* Card 2 — High Priority */}
          <button
            onClick={() => navigate('/memory-explorer')}
            className="surface-card p-5 flex flex-col justify-between text-left w-full transition-all duration-200 hover:shadow-md"
            style={{ minHeight: 155 }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--brand-light)' }}>
                <Zap size={20} style={{ color: 'var(--brand-dark)' }} />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {loading ? '…' : highImportance}
              </div>
              <div className="text-xs font-semibold text-gray-500 mt-1">
                High Priority (≥ 7/10)
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 mt-2">
                {totalMemories > 0 ? `${Math.round((highImportance / totalMemories) * 100)}% of total` : '0%'}
              </div>
            </div>
          </button>

          {/* Card 3 — Average Importance */}
          <button
            onClick={() => navigate('/analytics')}
            className="surface-card p-5 flex flex-col justify-between text-left w-full transition-all duration-200 hover:shadow-md"
            style={{ minHeight: 155 }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
                <Brain size={20} className="text-amber-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {loading ? '…' : `${avgImportance}`}
              </div>
              <div className="text-xs font-semibold text-gray-500 mt-1">
                Mean Cognitive Weight
              </div>
              <div className="text-[11px] font-semibold text-amber-700 mt-2">
                Scale 1–10 (Store Threshold ≥ 5)
              </div>
            </div>
          </button>

          {/* Card 4 — Categories */}
          <button
            onClick={() => navigate('/memory-explorer')}
            className="surface-card p-5 flex flex-col justify-between text-left w-full transition-all duration-200 hover:shadow-md"
            style={{ minHeight: 155 }}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                <Tag size={20} className="text-blue-700" />
              </div>
              <ArrowUpRight size={18} className="text-gray-400" />
            </div>
            <div>
              <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {loading ? '…' : uniqueCategories}
              </div>
              <div className="text-xs font-semibold text-gray-500 mt-1">
                Active Semantic Domains
              </div>
              <div className="text-[11px] font-semibold text-blue-700 mt-2">
                {Object.keys(catMap).slice(0, 3).join(', ') || 'None'}
              </div>
            </div>
          </button>
        </section>

        {/* ── Main Layout: Left 2 cols, Right 1 col ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* ── Left Column (2 spans) ── */}
          <div className="xl:col-span-2 flex flex-col gap-5">

            {/* Memory Analytics Bar Chart */}
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Memory Distribution by Category
                  </h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Semantic breakdown across extracted user knowledge
                  </p>
                </div>
                <button onClick={() => navigate('/analytics')} className="btn-ghost text-xs py-1.5 px-3">
                  <ArrowUpRight size={13} />
                  Deep Analytics
                </button>
              </div>

              {loading ? (
                <div className="h-48 skeleton rounded-xl" />
              ) : catData.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-center bg-gray-50 rounded-xl">
                  <Database size={24} className="text-gray-400 mb-2" />
                  <p className="text-sm font-semibold text-gray-600">No memories recorded yet</p>
                  <p className="text-xs text-gray-400 mt-1">Send a message to populate memory clusters</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={catData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }} barCategoryGap="30%">
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#6B7280', fontSize: 11 }}
                      dy={6}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                    <Tooltip
                      cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 8 }}
                      content={({ active, payload, label }) =>
                        active && payload?.length ? (
                          <div className="surface-card px-3 py-2 text-xs shadow-lg">
                            <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                            <div className="font-bold text-sm" style={{ color: 'var(--brand-dark)' }}>
                              {payload[0].value} memories ({Math.round(payload[0].value / totalMemories * 100)}%)
                            </div>
                          </div>
                        ) : null
                      }
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {catData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#1A5632' : i === 1 ? '#2EA76D' : '#86EFAC'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Quick Memory Ingestion Sandbox */}
            <div className="surface-card p-6" style={{ border: '1.5px dashed #D1D5DB' }}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} className="text-emerald-700" />
                <h3 className="text-sm font-bold text-gray-900">
                  Quick Memory Ingestion Sandbox
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Live Extraction Test
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Type any sentence to test DREAM's extraction, scoring, and storage pipeline in real time.
              </p>
              <form onSubmit={handleQuickAdd} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. User is a software engineer who loves espresso and drives a Tesla."
                  value={quickInput}
                  onChange={e => setQuickInput(e.target.value)}
                  className="dream-input text-xs flex-1 py-2"
                  disabled={quickLoading}
                />
                <button
                  type="submit"
                  disabled={quickLoading || !quickInput.trim()}
                  className="btn-primary text-xs px-4 py-2 shrink-0 flex items-center gap-1.5"
                >
                  {quickLoading ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  {quickLoading ? 'Extracting…' : 'Extract & Store'}
                </button>
              </form>
              {quickMsg && (
                <div
                  className={`mt-2.5 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
                    quickMsg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {quickMsg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                  {quickMsg.text}
                </div>
              )}
            </div>

            {/* Recent Memory Activity Feed */}
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Recent Memory Store Activity
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Click any item to inspect full cognitive weight & vectors</p>
                </div>
                <button onClick={() => navigate('/memory-explorer')} className="btn-ghost text-xs py-1.5 px-3">
                  View All ({totalMemories}) →
                </button>
              </div>

              {loading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-14 rounded-xl" />)}
                </div>
              ) : memories.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  No memories in store.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {memories.slice(0, 5).map((mem, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedMem(mem)}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl border border-gray-100 bg-white hover:border-emerald-300 hover:shadow-sm transition-all cursor-pointer group"
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                        style={{ background: 'var(--brand-light)' }}
                      >
                        {catIcon(mem.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          "{mem.memory}"
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                            {mem.category || 'General'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                            ⚡ Importance {mem.importance}/10
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 shrink-0">
                        Stored
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── Right Column (1 span) ── */}
          <div className="flex flex-col gap-5">

            {/* Dream Scheduler Status Card */}
            <div className="surface-card p-6 flex flex-col gap-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
                    Dream Scheduler
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">Background cognitive synthesis</p>
                </div>
                <span className="status-online">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-700" />
                  {isRunning ? 'Running' : 'Idle'}
                </span>
              </div>

              {/* Next Cycle Highlight Box */}
              <div className="rounded-xl p-4 bg-emerald-50 border border-emerald-100">
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  Scheduled Frequency
                </span>
                <span className="text-xl font-bold text-emerald-900">
                  Every {Math.floor((dreamStatus?.interval_seconds || 3600) / 60)} minutes
                </span>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-700">
                  <Clock size={13} />
                  <span>
                    Last active: {dreamStatus?.last_run_time ? new Date(dreamStatus.last_run_time).toLocaleTimeString() : 'Recent'}
                  </span>
                </div>
              </div>

              {/* Status metrics */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Safety Dry-Run</span>
                  <span className="font-bold text-gray-900">
                    {dreamStatus?.dry_run ? '✓ Enabled (Safe)' : '✗ Live Update'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-gray-100">
                  <span className="text-gray-500">Last Items Evaluated</span>
                  <span className="font-bold font-mono text-gray-900">{lastProcessed}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-gray-500">Semantic Clusters</span>
                  <span className="font-bold font-mono text-gray-900">{lastGroups}</span>
                </div>
              </div>

              {/* Trigger Button */}
              <button
                onClick={handleTrigger}
                disabled={triggering}
                className="btn-primary w-full justify-center gap-2"
              >
                {triggering ? (
                  <><RefreshCw size={14} className="animate-spin" /> Consolidating Memories…</>
                ) : (
                  <><Play size={14} fill="white" /> Execute Dream Cycle</>
                )}
              </button>

              {triggerMsg && (
                <div
                  className={`text-xs px-3 py-2 rounded-xl font-medium flex items-center gap-2 ${
                    triggerMsg.ok ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                  }`}
                >
                  {triggerMsg.ok ? <Check size={13} /> : <AlertCircle size={13} />}
                  {triggerMsg.text}
                </div>
              )}
            </div>

            {/* Live System Status Telemetry */}
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900">System Telemetry</h2>
                  <p className="text-xs text-gray-400">Core architecture health</p>
                </div>
                <button onClick={fetchAll} className="btn-ghost text-xs p-1.5" title="Refresh">
                  <RefreshCw size={13} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  { key: 'backend',  label: 'FastAPI Backend', desc: 'Port 8000', icon: Activity },
                  { key: 'ollama',   label: 'Ollama LLM',      desc: 'Llama 3.1 8B', icon: Brain },
                  { key: 'chromadb', label: 'ChromaDB Store',  desc: 'Vector Embeddings', icon: Database },
                ].map(({ key, label, desc, icon: Icon }) => {
                  const val = systemStatus?.[key] || 'Online';
                  const isOnline = val === 'Online';
                  return (
                    <div key={key} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          <Icon size={16} className="text-emerald-800" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{label}</p>
                          <p className="text-[10px] text-gray-400">{desc}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {val}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Importance Donut Chart */}
            <div className="surface-card p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base font-bold text-gray-900">Importance Breakdown</h2>
                  <p className="text-xs text-gray-400">Cognitive weight distribution</p>
                </div>
                <button onClick={() => navigate('/analytics')} className="btn-ghost text-xs p-1.5">
                  <ArrowUpRight size={13} />
                </button>
              </div>

              {loading ? (
                <div className="h-36 skeleton rounded-xl" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0" style={{ width: 110, height: 110 }}>
                    <PieChart width={110} height={110}>
                      <Pie
                        data={donutData}
                        cx={50} cy={50}
                        innerRadius={32} outerRadius={50}
                        paddingAngle={3}
                        dataKey="value"
                        startAngle={90} endAngle={-270}
                      >
                        {donutData.map((d, i) => <Cell key={i} fill={d.fill} />)}
                      </Pie>
                    </PieChart>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-emerald-900">{dominantPct}%</span>
                      <span className="text-[8px] font-bold text-gray-400 uppercase">High</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-1">
                    {donutData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.fill }} />
                          <span className="text-gray-600">{d.name}</span>
                        </div>
                        <span className="font-bold text-gray-900">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Memory Inspector Drawer */}
      <MemoryInspectorDrawer memory={selectedMem} onClose={() => setSelectedMem(null)} />
    </>
  );
}
