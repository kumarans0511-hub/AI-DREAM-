function StatsCards({ memories, dreamStatus, loading }) {
  const totalMemories = memories.length
  const importantMemories = memories.filter((m) => m.importance >= 7).length
  const reflectionCount = memories.filter(
    (m) => m.category === "Reflection"
  ).length

  const isRunning = dreamStatus && dreamStatus.is_running

  const cards = [
    {
      icon: "🗄️",
      label: "Total Memories",
      value: loading ? "—" : totalMemories,
      color: "#67d8a9",
    },
    {
      icon: "⚡",
      label: "Important",
      value: loading ? "—" : importantMemories,
      color: "#f0b429",
    },
    {
      icon: "🧬",
      label: "Reflections",
      value: loading ? "—" : reflectionCount,
      color: "#a78bfa",
    },
    {
      icon: "🌙",
      label: "Dream Engine",
      value: loading ? "—" : isRunning ? "Active" : "Idle",
      color: isRunning ? "#67d8a9" : "#666",
      dot: true,
    },
  ]

  return (
    <div className="stats-cards">
      {cards.map((card, i) => (
        <div key={i} className="stat-card">
          <div className="stat-icon">{card.icon}</div>
          <div className="stat-body">
            <div className="stat-value" style={{ color: card.color }}>
              {card.dot && (
                <span
                  className="stat-dot"
                  style={{ background: card.color }}
                />
              )}
              {card.value}
            </div>
            <div className="stat-label">{card.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards
