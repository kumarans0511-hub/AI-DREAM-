import { useState } from "react"

function MemorySearch() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  async function handleSearch(event) {
    event.preventDefault()

    if (query.trim() === "" || loading) return

    setLoading(true)
    setSearched(true)

    try {
      const res = await fetch(
        `/memories?query=${encodeURIComponent(query.trim())}`
      )

      if (res.ok) {
        const data = await res.json()
        setResults(data.memories || [])
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="memory-search">
      <h3 className="panel-title">🔍 Memory Search</h3>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          className="search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask DREAM what it remembers..."
          disabled={loading}
        />
        <button className="search-btn" type="submit" disabled={loading}>
          {loading ? "..." : "Search"}
        </button>
      </form>

      {loading && (
        <p className="search-loading">Searching memory vectors...</p>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="search-empty">No matching memories found.</p>
      )}

      {!loading && results.length > 0 && (
        <div className="search-results">
          {results.map((mem, i) => (
            <div key={i} className="search-card">
              <p className="search-card-text">{mem.memory}</p>
              <div className="search-card-meta">
                <span className="search-card-category">{mem.category}</span>
                <span className="search-card-score">⚡ {mem.importance}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MemorySearch
