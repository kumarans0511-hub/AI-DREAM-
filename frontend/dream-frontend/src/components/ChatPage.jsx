import { useState } from "react"

function ChatPage() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hello! I'm DREAM. What would you like me to remember?",
    },
  ])

  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  async function sendMessage(event) {
    event.preventDefault()

    if (input.trim() === "" || loading) return

    const userText = input.trim()

    const userMessage = {
      role: "user",
      text: userText,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      const response = await fetch(
        `/chat?message=${encodeURIComponent(userText)}`
      )

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      const assistantMessage = {
        role: "assistant",
        text: data.assistant,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      const errorMessage = {
        role: "assistant",
        text: `Sorry, something went wrong: ${error.message}`,
      }

      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat-workspace">
      <h3 className="panel-title">💬 Chat Workspace</h3>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`chat-msg ${message.role}`}>
            <strong>
              {message.role === "assistant" ? "DREAM" : "You"}
            </strong>
            <p>{message.text}</p>
          </div>
        ))}

        {loading && (
          <div className="chat-msg assistant">
            <strong>DREAM</strong>
            <p className="thinking">Thinking...</p>
          </div>
        )}
      </div>

      <form className="chat-composer" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Message DREAM..."
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </form>
    </div>
  )
}

export default ChatPage
