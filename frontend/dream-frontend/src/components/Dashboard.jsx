import { useState, useEffect } from "react"
import StatusCard from "./StatusCard"
import MemoryPipeline from "./MemoryPipeline"

function Dashboard() {
  const [memories, setMemories] = useState([])
  const [dreamStatus, setDreamStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [triggerResult, setTriggerResult] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)

    try {
      const [memRes, dreamRes] = await Promise.all([
        fetch("/memories/all"),
        fetch("/dream/status"),
      ])

      if (memRes.ok) {
        const memData = await memRes.json()
        setMemories(memData.memories || [])
      }

      if (dreamRes.ok) {
        const dreamData = await dreamRes.json()
        setDreamStatus(dreamData)
      }
    } catch {
      // Dashboard is best-effort
    } finally {
      setLoading(false)
    }
  }

  async function handleTriggerDream() {
    setTriggerLoading(true)
    setTriggerResult(null)

    try {
      const res = await fetch("/dream/trigger", { method: "POST" })

      if (res.ok) {
        const data = await res.json()
        setTriggerResult(data)
        // Refresh dream status after trigger
        const statusRes = await fetch("/dream/status")
        if (statusRes.ok) {
          setDreamStatus(await statusRes.json())
        }
      }
    } catch (err) {
      setTriggerResult({ status: "error", error: err.message })
    } finally {
      setTriggerLoading(false)
    }
  }

  // Computed stats
  const totalMemories = memories.length
  const importantMemories = memories.filter((m) => m.importance >= 7).length
  const reflections = memories.filter((m) => m.category === "Reflection")
  const reflectionCount = reflections.length

  // Group memories by category
  const grouped = {}
  for (const mem of memories) {
    const cat = mem.category || "Uncategorized"
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(mem)
  }

  return (
    <div className="dashboard">
      {/* Hero Section */}
      <section className="dash-hero">
        <div className="dash-hero-text">
          <h1>🧠 DREAM</h1>
          <p className="dash-subtitle">
            Dynamic Recall &amp; Evolving AI Memory
          </p>
          <p className="dash-desc">
            AI-powered memory system with extraction, importance scoring,
            consolidation, and dream-based reflection.
          </p>
        </div>
        <button className="dash-refresh" onClick={fetchData} disabled={loading}>
          {loading ? "Refreshing..." : "↻ Refresh"}
        </button>
      </section>

      {/* Status Cards */}
      <section className="dash-cards">
        <StatusCard
          icon="🗄️"
          label="Total Memories"
          value={loading ? "—" : totalMemories}
        />
        <StatusCard
          icon="⚡"
          label="Important (≥7)"
          value={loading ? "—" : importantMemories}
          accent="#f0b429"
        />
        <StatusCard
          icon="🧬"
          label="Reflections"
          value={loading ? "—" : reflectionCount}
          accent="#a78bfa"
        />
        <StatusCard
          icon="🌙"
          label="Dream Scheduler"
          value={
            loading || !dreamStatus
              ? "—"
              : dreamStatus.is_running
                ? "● Active"
                : "○ Stopped"
          }
          accent={
            dreamStatus && dreamStatus.is_running ? "#67d8a9" : "#929292"
          }
        />
      </section>

      {/* Memory Overview */}
      <section className="dash-section">
        <h2>Memory Overview</h2>

        {loading && <p className="dash-loading">Loading memories...</p>}

        {!loading && memories.length === 0 && (
          <p className="dash-empty">
            No memories stored yet. Use the Chat tab to add memories.
          </p>
        )}

        {!loading && memories.length > 0 && (
          <div className="dash-memory-groups">
            {Object.entries(grouped).map(([category, mems]) => (
              <div key={category} className="dash-memory-group">
                <h3 className="dash-group-title">
                  <span className="dash-group-badge">{category}</span>
                  <span className="dash-group-count">{mems.length}</span>
                </h3>
                <div className="dash-memory-list">
                  {mems.map((mem, i) => (
                    <div key={i} className="dash-memory-card">
                      <p className="dash-memory-text">{mem.memory}</p>
                      <span className="dash-memory-score">
                        ⚡ {mem.importance}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dream Engine + Pipeline Row */}
      <div className="dash-row">
        {/* Dream Engine */}
        <section className="dash-section dash-dream-engine">
          <h2>Dream Engine</h2>

          {dreamStatus ? (
            <div className="dash-dream-info">
              <div className="dash-dream-field">
                <span className="dash-field-label">Status</span>
                <span
                  className={`dash-field-value ${dreamStatus.is_running ? "active" : ""
                    }`}
                >
                  {dreamStatus.is_running ? "● Running" : "○ Stopped"}
                </span>
              </div>
              <div className="dash-dream-field">
                <span className="dash-field-label">Interval</span>
                <span className="dash-field-value">
                  {dreamStatus.interval_seconds}s
                </span>
              </div>
              <div className="dash-dream-field">
                <span className="dash-field-label">Dry Run</span>
                <span className="dash-field-value">
                  {dreamStatus.dry_run ? "✓ Enabled" : "✗ Disabled"}
                </span>
              </div>
              <div className="dash-dream-field">
                <span className="dash-field-label">Last Run</span>
                <span className="dash-field-value">
                  {dreamStatus.last_run_time || "Never"}
                </span>
              </div>
            </div>
          ) : (
            <p className="dash-loading">Loading status...</p>
          )}

          <button
            className="dash-trigger-btn"
            onClick={handleTriggerDream}
            disabled={triggerLoading}
          >
            {triggerLoading ? "Running..." : "▶ Run Dream Cycle"}
          </button>

          {triggerResult && (
            <div className="dash-trigger-result">
              <h4>Latest Result</h4>
              <pre>{JSON.stringify(triggerResult, null, 2)}</pre>
            </div>
          )}
        </section>

        {/* Memory Pipeline */}
        <section className="dash-section dash-pipeline-section">
          <h2>Memory Lifecycle</h2>
          <MemoryPipeline />
        </section>
      </div>

      {/* Reflections */}
      {reflections.length > 0 && (
        <section className="dash-section">
          <h2>🧬 Reflections</h2>
          <p className="dash-section-desc">
            Higher-level insights synthesized by the dream engine.
          </p>
          <div className="dash-reflections">
            {reflections.map((ref, i) => (
              <div key={i} className="dash-reflection-card">
                <p>{ref.memory}</p>
                <span className="dash-memory-score">⚡ {ref.importance}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default Dashboard
