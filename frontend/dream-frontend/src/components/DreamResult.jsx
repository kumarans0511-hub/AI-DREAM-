import { useState } from "react"

function DreamResult({ dreamStatus, onStatusRefresh }) {
  const [triggerLoading, setTriggerLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function handleTrigger() {
    setTriggerLoading(true)
    setResult(null)

    try {
      const res = await fetch("/dream/trigger", { method: "POST" })

      if (res.ok) {
        const data = await res.json()
        setResult(data)
        // Refresh parent's dream status
        if (onStatusRefresh) onStatusRefresh()
      }
    } catch (err) {
      setResult({ status: "error", error: err.message })
    } finally {
      setTriggerLoading(false)
    }
  }

  return (
    <div className="dream-result">
      <div className="dream-result-header">
        <h3 className="panel-title">🌙 Dream Engine</h3>
        <button
          className="dream-trigger-btn"
          onClick={handleTrigger}
          disabled={triggerLoading}
        >
          {triggerLoading ? "Running..." : "▶ Run Dream Cycle"}
        </button>
      </div>

      {/* Status Fields */}
      {dreamStatus && (
        <div className="dream-status-grid">
          <div className="dream-field">
            <span className="dream-field-label">Status</span>
            <span
              className={`dream-field-value ${
                dreamStatus.is_running ? "running" : ""
              }`}
            >
              {dreamStatus.is_running ? "● Running" : "○ Idle"}
            </span>
          </div>
          <div className="dream-field">
            <span className="dream-field-label">Interval</span>
            <span className="dream-field-value">
              {dreamStatus.interval_seconds}s
            </span>
          </div>
          <div className="dream-field">
            <span className="dream-field-label">Dry Run</span>
            <span className="dream-field-value">
              {dreamStatus.dry_run ? "✓ Safe Mode" : "✗ Live"}
            </span>
          </div>
          <div className="dream-field">
            <span className="dream-field-label">Last Run</span>
            <span className="dream-field-value">
              {dreamStatus.last_run_time
                ? new Date(dreamStatus.last_run_time).toLocaleTimeString()
                : "Never"}
            </span>
          </div>
        </div>
      )}

      {/* Latest Result */}
      {result && (
        <div className="dream-latest">
          <h4 className="dream-latest-title">Latest Dream Result</h4>

          <div className="dream-result-stats">
            {result.memories_processed !== undefined && (
              <div className="dream-result-stat">
                <span className="drs-value">{result.memories_processed}</span>
                <span className="drs-label">Processed</span>
              </div>
            )}
            {result.groups_found !== undefined && (
              <div className="dream-result-stat">
                <span className="drs-value">{result.groups_found}</span>
                <span className="drs-label">Groups</span>
              </div>
            )}
            {result.insights_generated !== undefined && (
              <div className="dream-result-stat">
                <span className="drs-value">
                  {result.insights_generated.length}
                </span>
                <span className="drs-label">Insights</span>
              </div>
            )}
            {result.stored !== undefined && (
              <div className="dream-result-stat">
                <span className="drs-value">{result.stored.length}</span>
                <span className="drs-label">Stored</span>
              </div>
            )}
          </div>

          {/* Insight Details */}
          {result.insights_generated &&
            result.insights_generated.length > 0 && (
              <div className="dream-insights">
                <h5>Generated Insights</h5>
                {result.insights_generated.map((insight, i) => (
                  <div key={i} className="dream-insight-card">
                    <p className="dream-insight-text">
                      {insight.memory}
                    </p>
                    <div className="dream-insight-meta">
                      <span className="dream-insight-sources">
                        Sources: {insight.source_memories?.join(" + ")}
                      </span>
                      <span className="dream-insight-score">
                        ⚡ {insight.importance}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          {result.status === "error" && (
            <div className="dream-error">
              <p>Error: {result.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DreamResult
