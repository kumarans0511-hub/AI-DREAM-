import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../services/api';
import MemoryInspectorDrawer from '../components/MemoryInspectorDrawer';
import {
  Search, RefreshCw, ArrowRight, Database, Zap, Filter,
  Plus, Send, Tag, ShieldCheck, Check, AlertCircle, Sparkles, Layers,
  ChevronDown, SlidersHorizontal
} from 'lucide-react';

function ImportanceBar({ value }) {
  if (value == null) return <span className="mono text-xs text-gray-400">—</span>;
  const pct = Math.min(100, (value / 10) * 100);
  const color = value >= 8 ? 'bg-emerald-700' : value >= 5 ? 'bg-emerald-500' : 'bg-gray-400';
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-2 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="mono text-xs font-bold text-gray-900">{value}/10</span>
    </div>
  );
}

export default function MemoryExplorer() {
  const [query, setQuery]               = useState('');
  const [memories, setMemories]         = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [selectedCat, setSelectedCat]   = useState('All');
  const [selected, setSelected]         = useState(null);
  const [sortBy, setSortBy]             = useState('default');
  const [minImportance, setMinImportance] = useState(0);

  // Quick add memory state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newText, setNewText]           = useState('');
  const [adding, setAdding]             = useState(false);
  const [addMsg, setAddMsg]             = useState(null);

  const fetchMemories = useCallback(async (q = '') => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (!q || q.trim() === '') {
        data = await api.getAllMemories();
      } else {
        data = await api.getMemories(q);
      }
      setMemories(data.memories || []);
    } catch (e) {
      setError('Failed to connect to memory backend.');
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMemories('');
  }, [fetchMemories]);

  const handleSearch = (e) => {
    if (e.key === 'Enter') fetchMemories(query);
  };

  /* ── Dynamic Category Extraction ── */
  const categoryCounts = useMemo(() => {
    const counts = { All: memories.length };
    memories.forEach(m => {
      const cat = m.category || 'General';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [memories]);

  const categories = useMemo(() => Object.keys(categoryCounts), [categoryCounts]);

  /* ── Filtered and sorted memories ── */
  const visible = useMemo(() => {
    return memories
      .filter(m => {
        const matchesCategory = selectedCat === 'All' || (m.category || 'General').toLowerCase() === selectedCat.toLowerCase();
        const matchesImportance = (m.importance || 5) >= minImportance;
        return matchesCategory && matchesImportance;
      })
      .sort((a, b) => {
        if (sortBy === 'importance-desc') return (b.importance || 0) - (a.importance || 0);
        if (sortBy === 'importance-asc')  return (a.importance || 0) - (b.importance || 0);
        if (sortBy === 'category')        return (a.category || '').localeCompare(b.category || '');
        if (sortBy === 'length')          return (b.memory || '').length - (a.memory || '').length;
        return 0;
      });
  }, [memories, selectedCat, minImportance, sortBy]);

  /* ── Quick memory extraction handler ── */
  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!newText.trim()) return;
    setAdding(true);
    setAddMsg(null);
    try {
      const res = await api.chat(newText);
      const newItems = res?.new_memories?.length || 0;
      setAddMsg({
        ok: true,
        text: newItems > 0 ? `Extracted & stored ${newItems} new memory!` : 'Processed through pipeline.',
      });
      setNewText('');
      await fetchMemories('');
      setTimeout(() => setShowAddModal(false), 1500);
    } catch {
      setAddMsg({ ok: false, text: 'Extraction failed. Make sure backend is running.' });
    } finally {
      setAdding(false);
    }
  };

  const avgScore = memories.length > 0
    ? (memories.reduce((s, m) => s + (m.importance || 0), 0) / memories.length).toFixed(1)
    : '0';

  return (
    <>
      <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full h-full animate-fade-in-up">

        {/* ── Header ── */}
        <header className="flex flex-wrap items-start justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Memory Explorer
              </h1>
              <span className="badge-ok text-xs">
                <Database size={13} />
                {memories.length} Stored Items
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Interactive semantic search and cognitive inspection of ChromaDB long-term memory.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus size={15} />
              Add / Extract Memory
            </button>
            <button
              onClick={() => fetchMemories(query)}
              className="btn-ghost text-xs py-2 px-3"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </header>

        {/* ── Top Summary Stats Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
          <div className="surface-card p-3.5 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <Database size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Total Memories</p>
              <p className="text-xl font-bold text-gray-900">{memories.length}</p>
            </div>
          </div>

          <div className="surface-card p-3.5 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Avg Importance</p>
              <p className="text-xl font-bold text-gray-900">{avgScore} <span className="text-xs text-gray-400 font-normal">/ 10</span></p>
            </div>
          </div>

          <div className="surface-card p-3.5 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <Tag size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Categories</p>
              <p className="text-xl font-bold text-gray-900">{categories.length - 1}</p>
            </div>
          </div>

          <div className="surface-card p-3.5 flex items-center gap-3 bg-white">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 flex items-center justify-center font-bold">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">High Priority (≥7)</p>
              <p className="text-xl font-bold text-gray-900">{memories.filter(m => (m.importance || 0) >= 7).length}</p>
            </div>
          </div>
        </div>

        {/* ── Search Bar & Filter Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3 shrink-0 w-full">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearch}
              placeholder="Search memories via semantic query… (press Enter)"
              className="dream-input pl-10 h-11 w-full text-xs"
            />
          </div>
          <button
            onClick={() => fetchMemories(query)}
            className="btn-primary h-11 px-6 text-xs"
          >
            Search
          </button>
          {query && (
            <button
              onClick={() => { setQuery(''); fetchMemories(''); }}
              className="btn-ghost h-11 px-4 text-xs"
            >
              Clear
            </button>
          )}
          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="dream-select text-xs h-11 px-3 w-44 bg-white border border-gray-200 text-gray-800 font-semibold"
          >
            <option value="default">Sort: Default Order</option>
            <option value="importance-desc">Importance: High → Low</option>
            <option value="importance-asc">Importance: Low → High</option>
            <option value="category">Category (A–Z)</option>
            <option value="length">Memory Length</option>
          </select>
        </div>

        {/* ── Dynamic Category Filter Chips ── */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 shrink-0 custom-scrollbar">
          {categories.map(cat => {
            const isActive = selectedCat === cat;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full shrink-0 transition-all border flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
          <span className="ml-auto shrink-0 mono text-xs font-semibold text-gray-400 pl-4 pr-2 border-l border-gray-200">
            {visible.length} of {memories.length} results
          </span>
        </div>

        {/* ── Memory Stream / List ── */}
        <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium border text-red-700 bg-red-50 border-red-200 flex items-center justify-between">
              <span>{error}</span>
              <button onClick={() => fetchMemories(query)} className="underline text-xs">Retry</button>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton rounded-2xl h-24" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="surface-card p-16 flex flex-col items-center justify-center text-center bg-white rounded-2xl">
              <Database className="mb-3 text-gray-300" size={44} strokeWidth={1.5} />
              <p className="text-base font-bold text-gray-800">
                {memories.length === 0 ? 'No memories stored in ChromaDB' : 'No memories match this filter'}
              </p>
              <p className="text-xs text-gray-500 max-w-sm mt-1">
                {memories.length === 0
                  ? 'Use the "+ Add / Extract Memory" button or the Conversation tab to begin memory ingestion.'
                  : 'Try selecting "All" or clearing your search term.'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 pb-6">
              {visible.map((mem, i) => (
                <MemoryCard key={i} mem={mem} onClick={() => setSelected(mem)} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── Quick Add / Extraction Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="surface-card p-6 max-w-lg w-full bg-white rounded-2xl shadow-2xl animate-fade-in-up flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Extract & Store Memory</h3>
                  <p className="text-xs text-gray-500">Runs through LLM extraction & ImportanceScorer</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMemory} className="flex flex-col gap-3">
              <textarea
                rows={4}
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Enter facts or conversational dialogue... (e.g. 'I am moving to San Francisco next month and starting my new job at OpenAI.')"
                className="dream-input text-xs p-3 w-full resize-none"
                autoFocus
              />

              {addMsg && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  addMsg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800'
                }`}>
                  {addMsg.ok ? <Check size={14} /> : <AlertCircle size={14} />}
                  {addMsg.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-ghost text-xs px-4 py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !newText.trim()}
                  className="btn-primary text-xs px-5 py-2 flex items-center gap-1.5"
                >
                  {adding ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                  {adding ? 'Extracting…' : 'Extract & Store'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Memory Inspector Drawer */}
      <MemoryInspectorDrawer memory={selected} onClose={() => setSelected(null)} />
    </>
  );
}

function MemoryCard({ mem, onClick }) {
  const category = mem.category || 'General';
  const isHigh = (mem.importance || 0) >= 8;

  return (
    <button
      onClick={onClick}
      className="surface-card p-4 flex flex-col sm:flex-row gap-4 text-left w-full transition-all duration-200 cursor-pointer group hover:border-emerald-300 hover:shadow-md bg-white rounded-2xl border border-gray-100"
    >
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <p className="text-sm font-semibold text-gray-900 leading-relaxed">
          "{mem.memory}"
        </p>
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-200">
            {category}
          </span>
          <ImportanceBar value={mem.importance} />
          {isHigh && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              ⚡ High Cognitive Priority
            </span>
          )}
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-end sm:justify-center text-gray-400 group-hover:text-emerald-700 transition-colors pr-2 pl-4">
        <span className="text-xs font-semibold mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Inspect</span>
        <ArrowRight size={16} />
      </div>
    </button>
  );
}
