function StatusCard({ icon, label, value, accent }) {
  return (
    <div className="status-card">
      <div className="status-card-icon">{icon}</div>
      <div className="status-card-body">
        <span className="status-card-value" style={accent ? { color: accent } : {}}>
          {value}
        </span>
        <span className="status-card-label">{label}</span>
      </div>
    </div>
  )
}

export default StatusCard
