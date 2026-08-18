const STAGES = [
  {
    icon: "💬",
    label: "User Input",
    desc: "Raw message received",
  },
  {
    icon: "🔍",
    label: "Memory Extraction",
    desc: "LLM extracts factual memories",
  },
  {
    icon: "⚡",
    label: "Importance Scoring",
    desc: "Score 1–10 via LLM evaluation",
  },
  {
    icon: "🧭",
    label: "Decision Engine",
    desc: "STORE or DISCARD threshold",
  },
  {
    icon: "🔗",
    label: "Consolidation",
    desc: "Duplicate / Update / Related / New",
  },
  {
    icon: "🗄️",
    label: "Long-Term Memory",
    desc: "ChromaDB vector storage",
  },
]

function CognitiveTimeline() {
  return (
    <div className="timeline">
      <h3 className="panel-title">Cognitive Pipeline</h3>
      <div className="timeline-track">
        {STAGES.map((stage, i) => (
          <div key={i} className="timeline-item">
            <div className="timeline-connector">
              <div className="timeline-dot">{stage.icon}</div>
              {i < STAGES.length - 1 && <div className="timeline-line" />}
            </div>
            <div className="timeline-content">
              <div className="timeline-label">{stage.label}</div>
              <div className="timeline-desc">{stage.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CognitiveTimeline
