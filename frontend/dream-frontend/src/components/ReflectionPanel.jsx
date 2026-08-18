function ReflectionPanel({ memories }) {
  const reflections = memories.filter((m) => m.category === "Reflection")

  return (
    <div className="reflection-panel">
      <h3 className="panel-title">🧬 Reflections</h3>
      <p className="panel-desc">
        Higher-level insights synthesized during dream cycles.
      </p>

      {reflections.length === 0 && (
        <div className="panel-empty">
          <p>No reflections generated yet.</p>
          <p className="panel-hint">
            Run a dream cycle to synthesize insights from stored memories.
          </p>
        </div>
      )}

      {reflections.length > 0 && (
        <div className="reflection-list">
          {reflections.map((ref, i) => (
            <div key={i} className="reflection-card">
              <p className="reflection-text">{ref.memory}</p>
              <div className="reflection-meta">
                <span className="reflection-badge">Reflection</span>
                <span className="reflection-score">⚡ {ref.importance}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default ReflectionPanel
