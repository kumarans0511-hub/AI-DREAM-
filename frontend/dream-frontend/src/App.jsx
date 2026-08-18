import { useState, useEffect } from "react"
import "./App.css"
import StatsCards from "./components/StatsCards"
import CognitiveTimeline from "./components/CognitiveTimeline"
import ChatPage from "./components/ChatPage"
import MemorySearch from "./components/MemorySearch"
import ReflectionPanel from "./components/ReflectionPanel"
import DreamResult from "./components/DreamResult"

function App() {
  const [memories, setMemories] = useState([])
  const [dreamStatus, setDreamStatus] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    setLoading(true)

    try {
      const [memRes, dreamRes] = await Promise.all([
        fetch("/memories?query=user memories personal preferences"),
        fetch("/dream/status"),
      ])

      if (memRes.ok) {
        const data = await memRes.json()
        setMemories(data.memories || [])
      }

      if (dreamRes.ok) {
        setDreamStatus(await dreamRes.json())
      }
    } catch {
      // Best-effort fetch
    } finally {
      setLoading(false)
    }
  }

  async function refreshDreamStatus() {
    try {
      const res = await fetch("/dream/status")
      if (res.ok) {
        setDreamStatus(await res.json())
      }
    } catch {
      // Silently fail
    }
    // Also refresh memories after a dream cycle
    try {
      const res = await fetch("/memories?query=user memories personal preferences")
      if (res.ok) {
        const data = await res.json()
        setMemories(data.memories || [])
      }
    } catch {
      // Silently fail
    }
  }

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="topbar">
        <div className="topbar-left">
          <span className="topbar-brand">🧠 DREAM</span>
          <span className="topbar-tagline">
            Dynamic Recall &amp; Evolving AI Memory
          </span>
        </div>
        <div className="topbar-right">
          <button
            className="topbar-refresh"
            onClick={fetchDashboardData}
            disabled={loading}
          >
            ↻ Refresh
          </button>
          <span className="topbar-status">● System Online</span>
        </div>
      </header>

      {/* ── Stats Bar ── */}
      <section className="stats-section">
        <StatsCards
          memories={memories}
          dreamStatus={dreamStatus}
          loading={loading}
        />
      </section>

      {/* ── Main 3-Column Layout ── */}
      <div className="dashboard-grid">
        {/* Left Column */}
        <aside className="col-left">
          <CognitiveTimeline />
        </aside>

        {/* Center Column */}
        <main className="col-center">
          <ChatPage />
        </main>

        {/* Right Column */}
        <aside className="col-right">
          <MemorySearch />
          <ReflectionPanel memories={memories} />
        </aside>
      </div>

      {/* ── Bottom: Dream Engine ── */}
      <section className="bottom-section">
        <DreamResult
          dreamStatus={dreamStatus}
          onStatusRefresh={refreshDreamStatus}
        />
      </section>
    </div>
  )
}

export default App