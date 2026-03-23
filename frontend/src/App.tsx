import { useState, useRef, useEffect } from 'react'
import './App.css'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Conversation {
  id: string
  title: string
  messages: Message[]
}

const SUGGESTIONS = [
  { icon: '📈', label: 'Grow my business', prompt: 'What are the most effective ways to grow a small business?' },
  { icon: '📣', label: 'Marketing help', prompt: 'Help me create a simple marketing plan for my small business.' },
  { icon: '💰', label: 'Finance advice', prompt: 'What financial metrics should I track as a small business owner?' },
  { icon: '🤝', label: 'Customer service', prompt: 'How do I handle difficult customers professionally?' },
  { icon: '📦', label: 'Inventory tips', prompt: 'How should I manage inventory for a small retail business?' },
  { icon: '⚙️', label: 'Operations', prompt: 'How can I streamline operations in my small business?' },
]

function App() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find(c => c.id === activeId) ?? null
  const messages = activeConversation?.messages ?? []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const newChat = () => {
    setActiveId(null)
    setInput('')
  }

  const sendMessage = async (text = input) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'

    const userMsg: Message = { role: 'user', content: trimmed }

    let convId = activeId
    if (!convId) {
      convId = crypto.randomUUID()
      const newConv: Conversation = {
        id: convId,
        title: trimmed.slice(0, 40),
        messages: [userMsg],
      }
      setConversations(prev => [newConv, ...prev])
      setActiveId(convId)
    } else {
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c)
      )
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, conversation_id: convId }),
      })
      const data = await res.json()
      const assistantMsg: Message = { role: 'assistant', content: data.response }
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, assistantMsg] } : c)
      )
    } catch {
      setConversations(prev =>
        prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }] } : c)
      )
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const isEmpty = messages.length === 0

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">aibia</span>
          </div>
          <button className="new-chat-btn" onClick={newChat} title="New chat">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1v13M1 7.5h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="sidebar-section-label">Conversations</div>

        <nav className="conversation-list">
          {conversations.length === 0 ? (
            <p className="no-convs">No conversations yet</p>
          ) : (
            conversations.map(c => (
              <button
                key={c.id}
                className={`conv-item ${c.id === activeId ? 'active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <span className="conv-icon">💬</span>
                <span className="conv-title">{c.title}</span>
              </button>
            ))
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">J</div>
            <div>
              <div className="user-name">joesaiagent</div>
              <div className="user-plan">Free plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="main">
        <header className="main-header">
          <span className="main-title">{activeConversation?.title ?? 'New conversation'}</span>
          <div className="header-status">
            <span className="status-dot" />
            <span>aibia is online</span>
          </div>
        </header>

        <div className="messages-area">
          {isEmpty ? (
            <div className="welcome">
              <div className="welcome-logo">✦</div>
              <h1>Good day, what can I help with?</h1>
              <p>Your AI-powered business assistant. Ask about marketing, operations, finance, customers, and more.</p>
              <div className="suggestions-grid">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="suggestion-card" onClick={() => sendMessage(s.prompt)}>
                    <span className="suggestion-icon">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages">
              {messages.map((msg, i) => (
                <div key={i} className={`message ${msg.role}`}>
                  {msg.role === 'assistant' && (
                    <div className="msg-avatar">✦</div>
                  )}
                  <div className="msg-content">
                    {msg.role === 'assistant' && <div className="msg-sender">aibia</div>}
                    <div className="msg-bubble">{msg.content}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="message assistant">
                  <div className="msg-avatar">✦</div>
                  <div className="msg-content">
                    <div className="msg-sender">aibia</div>
                    <div className="msg-bubble typing">
                      <span /><span /><span />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        <div className="input-wrapper">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Message aibia..."
              rows={1}
              disabled={loading}
            />
            <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L8 15M8 1L3 6M8 1L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <p className="input-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </main>
    </div>
  )
}

export default App
