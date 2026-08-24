import React, { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';

const TABS = ['Model', 'Memory', 'Scheduler', 'Consolidation', 'Forgetting'];

export default function Settings() {
  const [tab, setTab] = useState('Model');
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [sysStatus, setSysStatus] = useState(null);

  // Fetch from /settings, not /api/settings
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/settings');
      if (res.ok) setSettings(await res.json());
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/system/status');
      if (res.ok) setSysStatus(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchSettings();
    fetchStatus();
  }, [fetchSettings, fetchStatus]);

  const handleChange = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch('/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        setSaveMsg({ ok: true, text: 'Settings saved successfully.' });
        fetchSettings(); // Refresh
      } else {
        throw new Error('Save failed');
      }
    } catch (e) {
      setSaveMsg({ ok: false, text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full h-full p-8 animate-fade-in-up">
        <div className="skeleton h-8 w-40 rounded mb-2" />
        <div className="skeleton h-12 w-full rounded" />
        <div className="skeleton h-96 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-[1000px] mx-auto w-full h-full animate-fade-in-up">

      <header className="flex flex-wrap items-start justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1 text-[var(--text-primary)]">Configuration</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Tune the cognitive parameters of the DREAM framework
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !settings}
          className="btn-primary px-5"
        >
          {saving ? (
            <>
              <Save className="animate-spin" size={16} />
              Saving…
            </>
          ) : (
            <>
              <Save size={16} />
              Save Changes
            </>
          )}
        </button>
      </header>

      {saveMsg && (
        <div className={`px-4 py-3 rounded text-sm font-medium border ${saveMsg.ok ? 'text-[var(--text-primary)] bg-[var(--bg-surface)] border-[var(--border)]' : 'text-red-600 bg-red-50 border-red-200'}`}>
          {saveMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 shrink-0 border-b border-[var(--border)] pb-0">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-sm font-medium transition-all duration-150 rounded-t -mb-px border border-b-0"
            style={{
              color: tab === t ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderColor: tab === t ? 'var(--border)' : 'transparent',
              background: tab === t ? 'var(--bg-surface)' : 'transparent',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-6 pb-8">
        
        {tab === 'Model' && settings && (
          <Section title="Model Configuration" desc="Core LLM and embedding settings">
            <StringField label="Primary LLM" value={settings.primary_llm} onChange={v => handleChange('primary_llm', v)} 
              helperText="LLM for conversational fallback and standard memory tasks (Ollama: llama3.1:latest)" />
            <StringField label="Reflection LLM" value="gemini-3.1-pro-preview" onChange={() => {}} disabled={true}
              helperText="LLM for high-level pattern synthesis during Dream Cycles (Gemini)" />
            <StringField label="Embedding Model" value={settings.embedding_model} onChange={v => handleChange('embedding_model', v)} />
            <NumberField label="Temperature" value={settings.temperature} onChange={v => handleChange('temperature', v)} step={0.1} />
            <NumberField label="Max Tokens" value={settings.max_tokens} onChange={v => handleChange('max_tokens', v)} />
            
            {/* System Status info panel */}
            {sysStatus && (
              <div className="col-span-full mt-4 p-4 rounded bg-[var(--bg-surface)] border border-[var(--border)] flex flex-wrap gap-6">
                <StatusItem label="Backend" status={sysStatus.backend} />
                <StatusItem label="Ollama" status={sysStatus.ollama} />
                <StatusItem label="ChromaDB" status={sysStatus.chromadb} />
              </div>
            )}
          </Section>
        )}

        {tab === 'Memory' && settings && (
          <Section title="Retrieval Settings" desc="How memories are fetched during conversation">
            <StringField label="Storage Engine" value={settings.memory_storage_engine} onChange={v => handleChange('memory_storage_engine', v)} />
            <NumberField label="Retrieval Top K" value={settings.retrieval_top_k} onChange={v => handleChange('retrieval_top_k', v)} />
            <NumberField label="Similarity Threshold" value={settings.similarity_threshold} onChange={v => handleChange('similarity_threshold', v)} step={0.01} />
            <NumberField label="Max Context Memories" value={settings.max_context_memories} onChange={v => handleChange('max_context_memories', v)} />
          </Section>
        )}

        {tab === 'Scheduler' && settings && (
          <Section title="Dream Scheduler" desc="Background cognitive cycle timing">
            <ToggleField label="Automatic Dreaming" value={settings.automatic_dreaming} onChange={v => handleChange('automatic_dreaming', v)} />
            <ToggleField label="Dry Run Mode" value={settings.dry_run_mode} onChange={v => handleChange('dry_run_mode', v)} 
              desc="If enabled, cycles run without committing DB changes" />
            <NumberField label="Interval (Seconds)" value={settings.consolidation_interval_seconds} onChange={v => handleChange('consolidation_interval_seconds', v)} />
            <StringField label="Reflection Frequency" value={settings.reflection_frequency} onChange={v => handleChange('reflection_frequency', v)} />
          </Section>
        )}

        {tab === 'Consolidation' && settings && (
          <Section title="Consolidation Engine" desc="How memories are clustered and merged">
            <StringField label="Strategy" value={settings.consolidation_strategy} onChange={v => handleChange('consolidation_strategy', v)} />
            <NumberField label="Importance Threshold" value={settings.memory_importance_threshold} onChange={v => handleChange('memory_importance_threshold', v)} step={0.01} />
          </Section>
        )}

        {tab === 'Forgetting' && settings && (
          <Section title="Memory Decay" desc="Ebbinghaus-inspired forgetting mechanics">
            <ToggleField label="Enable Decay" value={settings.enable_memory_decay} onChange={v => handleChange('enable_memory_decay', v)} />
            <ToggleField label="Archive Forgotten" value={settings.archive_forgotten_memories} onChange={v => handleChange('archive_forgotten_memories', v)} />
            <NumberField label="Decay Rate" value={settings.decay_rate} onChange={v => handleChange('decay_rate', v)} step={0.01} />
            <NumberField label="Minimum Strength" value={settings.minimum_memory_strength} onChange={v => handleChange('minimum_memory_strength', v)} step={0.01} />
          </Section>
        )}

      </main>
    </div>
  );
}

function Section({ title, desc, children }) {
  return (
    <div className="surface-card p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>
        {desc && <p className="text-xs mt-1 text-[var(--text-secondary)]">{desc}</p>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {children}
      </div>
    </div>
  );
}

function StringField({ label, value, onChange, disabled, helperText }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[var(--text-primary)]">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="dream-input h-10 w-full disabled:bg-[var(--bg-base)] disabled:text-[var(--text-muted)] disabled:cursor-not-allowed"
      />
      {helperText && <span className="text-[10px] text-[var(--text-muted)]">{helperText}</span>}
    </div>
  );
}

function NumberField({ label, value, onChange, step = 1 }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-[var(--text-primary)]">{label}</label>
      <input
        type="number"
        step={step}
        value={value ?? ''}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="dream-input h-10 w-full mono"
      />
    </div>
  );
}

function ToggleField({ label, value, onChange, desc }) {
  return (
    <div className="flex flex-col justify-center gap-1 h-full">
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold cursor-pointer text-[var(--text-primary)]" onClick={() => onChange(!value)}>
          {label}
        </label>
        <button
          onClick={() => onChange(!value)}
          className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
          style={{ background: value ? 'var(--text-primary)' : 'var(--border)' }}
        >
          <span
            className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
            style={{ transform: value ? 'translateX(24px)' : 'translateX(4px)', background: value ? 'var(--bg-base)' : 'white' }}
          />
        </button>
      </div>
      {desc && <p className="text-xs text-[var(--text-muted)]">{desc}</p>}
    </div>
  );
}

function StatusItem({ label, status }) {
  const isOnline = status === 'Online' || status === 'Running';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-secondary)]">{label}</span>
      <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: isOnline ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        <span className="w-2 h-2 rounded-full" style={{ background: isOnline ? 'var(--text-primary)' : 'var(--border-hover)' }} />
        {status || 'Unknown'}
      </span>
    </div>
  );
}
