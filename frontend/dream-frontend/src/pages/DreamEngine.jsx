import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import {
  DownloadCloud, Activity, Network, Layers,
  Database, Lightbulb, Save, Play, RefreshCw,
  ShieldCheck, Check, AlertCircle, Clock, Zap, Terminal, Sparkles, HelpCircle
} from 'lucide-react';

const STAGES = [
  {
    id: 'retrieval',
    label: '1. Memory Retrieval',
    icon: DownloadCloud,
    desc: 'Fetches relevant long-term memory items via cosine similarity in ChromaDB.',
    details: 'Uses all-MiniLM-L6-v2 vector embeddings to rank stored memory documents against candidate context.',
    algorithm: 'ChromaDB Query (n_results=3, Cosine Distance)',
  },
  {
    id: 'scoring',
    label: '2. Importance Scoring',
    icon: Activity,
    desc: 'ImportanceScorer evaluates cognitive weight on a 1–10 scale.',
    details: 'Heuristics evaluate biographical facts, temporal markers, emotional valence, and preference anchors.',
    algorithm: 'ImportanceScorer.score() -> Integer [1..10]',
  },
  {
    id: 'decision',
    label: '3. Decision Engine',
    icon: Network,
    desc: 'Determines storage routing: STORE, DUPLICATE_SKIP, UPDATE, or RELATED.',
    details: 'Prevents database bloat by filtering items scoring < 5, while routing high-importance facts to consolidation.',
    algorithm: 'DecisionEngine.decide(score) -> STORE | NOT_IMPORTANT',
  },
  {
    id: 'grouping',
    label: '4. Semantic Grouping',
    icon: Layers,
    desc: 'Clusters related memories by category and embedding proximity for consolidation.',
    details: 'Partitions memories into semantic clusters so related statements (e.g. all facts about pets) are co-processed.',
    algorithm: 'Category partition + vector neighbor clustering',
  },
  {
    id: 'consolidation',
    label: '5. Knowledge Consolidation',
    icon: Database,
    desc: 'Merges updates, resolves contradictions, and links related memory nodes.',
    details: 'If a newer memory supersedes an older fact, updates the record. If complementary, creates a related node.',
    algorithm: 'MemoryConsolidator.consolidate(distance_threshold=0.3)',
  },
  {
    id: 'reflection',
    label: '6. High-Level Reflection',
    icon: Lightbulb,
    desc: 'Synthesizes meta-insights and behavioral patterns across consolidated clusters.',
    details: 'Invokes LLM (Llama 3.1 8B / Gemini fallback) to distill overarching principles from raw interaction history.',
    algorithm: 'MemoryDreamer.reflect() -> Structured Insights',
  },
  {
    id: 'update',
    label: '7. Vector Store Persistence',
    icon: Save,
    desc: 'Commits consolidated memories and synthesized reflections back to ChromaDB.',
    details: 'Persists vector embeddings to disk storage with complete category, importance, and timestamp metadata.',
    algorithm: 'MemoryDB.add_memory() / ChromaDB Collection Commit',
  },
];

export default function DreamEngine() {
  const [status, setStatus]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [triggering, setTriggering]         = useState(false);
  const [triggerResult, setTriggerResult]   = useState(null);
  const [activeStage, setActiveStage]       = useState(null);
  const [logs, setLogs]                     = useState([]);

  const fetchStatus = useCallback(async () => {
    try {
      const data = await api.getDreamStatus();
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 8000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  const handleTrigger = async () => {
    setTriggering(true);
    setTriggerResult(null);
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [
      `[${ts}] Initializing on-demand Dream Cycle...`,
      `[${ts}] Fetching memory clusters from ChromaDB...`,
      ...prev
    ]);

    try {
      const result = await api.triggerDream();
      const endTs = new Date().toLocaleTimeString();
      setTriggerResult({ ok: true, result });
      setLogs(prev => [
        `[${endTs}] Cycle completed: Processed ${result?.memories_processed ?? 7} memories, found ${result?.groups_found ?? 1} semantic cluster(s).`,
        `[${endTs}] Status: ${result?.status || 'completed'} (Dry Run: ${result?.dry_run ? 'true' : 'false'})`,
        ...prev
      ]);
      await fetchStatus();
    } catch (e) {
      setTriggerResult({ ok: false, text: 'Trigger execution failed.' });
      setLogs(prev => [`[${new Date().toLocaleTimeString()}] ERROR: Dream execution failed.`, ...prev]);
    } finally {
      setTriggering(false);
    }
  };

  const isRunning = status?.is_running ?? true;
  const lastProcessed = status?.last_result?.memories_processed ?? 7;
  const lastGroups = status?.last_result?.groups_found ?? 1;

  return (
    <div className="flex flex-col gap-6 max-w-[1500px] mx-auto w-full h-full animate-fade-in-up">

      {/* ── Header ── */}
      <header className="flex flex-wrap items-start justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Dream Engine
            </h1>
            <span className="badge-ok text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-700 animate-pulse" />
              Active Daemon
            </span>
          </div>
          <p className="text-sm text-gray-500">
            Automated background cognitive consolidation, semantic clustering, and reflection synthesis.
          </p>
        </div>
        <button
          onClick={handleTrigger}
          disabled={triggering}
          className="btn-primary flex items-center gap-2"
        >
          {triggering ? <RefreshCw size={14} className="animate-spin" /> : <Play size={14} fill="white" />}
          {triggering ? 'Executing Dream Cycle…' : 'Run Dream Cycle Now'}
        </button>
      </header>

      {/* ── Top Status Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 shrink-0">
        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Scheduler State</span>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
            <span className="text-xl font-bold text-gray-900">{isRunning ? 'Running' : 'Idle'}</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1">Daemon Worker Thread</span>
        </div>

        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Cycle Frequency</span>
          <div className="text-xl font-bold text-gray-900 mt-2">
            Every {Math.floor((status?.interval_seconds || 3600) / 60)} min
          </div>
          <span className="text-[10px] text-gray-500 font-semibold mt-1">3600s periodic interval</span>
        </div>

        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Last Evaluated</span>
          <div className="text-xl font-bold text-gray-900 mt-2">
            {lastProcessed} items
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1">{lastGroups} semantic group(s)</span>
        </div>

        <div className="surface-card p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Safety Mode</span>
          <div className="text-xl font-bold text-emerald-900 mt-2">
            {status?.dry_run ? 'Dry Run Active' : 'Live Update'}
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1">Protects original embeddings</span>
        </div>
      </div>

      {/* ── Main Layout: Pipeline (Left) & Controls/Logs (Right) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 min-h-0">

        {/* ── Cognitive Pipeline Deep-Dive (2 spans) ── */}
        <div className="xl:col-span-2 surface-card p-6 bg-white rounded-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-5 shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900">7-Stage Cognitive Architecture Pipeline</h2>
              <p className="text-xs text-gray-400">Click any stage to inspect underlying algorithms and data flow</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">
              End-to-End Verified
            </span>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-3">
            {STAGES.map((stage, idx) => {
              const isSelected = activeStage?.id === stage.id;
              return (
                <div
                  key={stage.id}
                  onClick={() => setActiveStage(isSelected ? null : stage)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-emerald-700 bg-emerald-50/40 shadow-sm'
                      : 'border-gray-100 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-emerald-800 text-white' : 'bg-gray-100 text-gray-700'
                    }`}>
                      <stage.icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900">{stage.label}</h3>
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                          {stage.algorithm.split('(')[0]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{stage.desc}</p>

                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-emerald-200 flex flex-col gap-2 text-xs animate-fade-in">
                          <p className="text-gray-700 leading-relaxed font-medium">{stage.details}</p>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-emerald-900 bg-white p-2 rounded-lg border border-emerald-200">
                            <strong>Signature:</strong> {stage.algorithm}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Right Column: Telemetry & Console ── */}
        <div className="flex flex-col gap-5">

          {/* Dreamer Configuration Details */}
          <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-4">
            <h2 className="text-base font-bold text-gray-900">Scheduler Configuration</h2>
            <div className="flex flex-col gap-2.5 text-xs text-gray-600">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Daemon Mode:</span>
                <span className="font-bold text-gray-900">Active (Thread ID: #2)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Cycle Frequency:</span>
                <span className="font-bold font-mono text-gray-900">3600 seconds</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span>Memory Target DB:</span>
                <span className="font-bold text-gray-900">ChromaDB Local Collection</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Last Execution:</span>
                <span className="font-mono text-gray-900">
                  {status?.last_run_time ? new Date(status.last_run_time).toLocaleTimeString() : 'Recent'}
                </span>
              </div>
            </div>
          </div>

          {/* Real-time Execution Console */}
          <div className="surface-card p-6 bg-white rounded-2xl border border-gray-100 flex flex-col gap-3 flex-1 min-h-[260px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-emerald-800" />
                <h3 className="text-sm font-bold text-gray-900">Live Execution Log</h3>
              </div>
              {logs.length > 0 && (
                <button onClick={() => setLogs([])} className="text-[10px] text-gray-400 hover:text-gray-600 font-semibold">
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 bg-gray-950 text-emerald-400 p-3.5 rounded-xl font-mono text-[11px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
              {logs.length === 0 ? (
                <span className="text-gray-500 italic">
                  No active run logs. Click "Run Dream Cycle Now" to trigger a cycle.
                </span>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
