const PIPELINE_STEPS = [
  { icon: "💬", label: "User Input" },
  { icon: "🔍", label: "Memory Extraction" },
  { icon: "⚡", label: "Importance Scoring" },
  { icon: "🧭", label: "Decision Engine" },
  { icon: "🔗", label: "Consolidation" },
  { icon: "🗄️", label: "Long-Term Memory" },
  { icon: "🌙", label: "Dreaming" },
  { icon: "🧬", label: "Reflection" },
]

function MemoryPipeline() {
  return (
    <div className="pipeline">
      {PIPELINE_STEPS.map((step, index) => (
        <div key={index} className="pipeline-step-wrapper">
          <div className="pipeline-step">
            <span className="pipeline-icon">{step.icon}</span>
            <span className="pipeline-label">{step.label}</span>
          </div>
          {index < PIPELINE_STEPS.length - 1 && (
            <div className="pipeline-arrow">↓</div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MemoryPipeline
