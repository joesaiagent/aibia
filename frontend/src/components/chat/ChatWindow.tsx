import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { getAuthHeaders } from '../../api/client'
import './ChatWindow.css'

interface Message { role: 'user' | 'assistant'; content: string }
interface Conversation { id: string; title: string; messages: Message[] }

const SUGGESTIONS = [
  { icon: '📈', label: 'Grow my business', prompt: 'What are the most effective ways to grow a growing business?' },
  { icon: '📣', label: 'Marketing help', prompt: 'Help me create a simple marketing plan for my growing business.' },
  { icon: '💰', label: 'Finance advice', prompt: 'What financial metrics should I track as a growing business owner?' },
  { icon: '🤝', label: 'Customer service', prompt: 'How do I handle difficult customers professionally?' },
  { icon: '📦', label: 'Inventory tips', prompt: 'How should I manage inventory for a small retail business?' },
  { icon: '⚙️', label: 'Operations', prompt: 'How can I streamline operations in my growing business?' },
]

export default function ChatWindow() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const activeConversation = conversations.find(c => c.id === activeId) ?? null
  const messages = activeConversation?.messages ?? []

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const newChat = () => { setActiveId(null); setInput('') }

  const sendMessage = async (text = input) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    setInput('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    setLoading(true)

    const userMsg: Message = { role: 'user', content: trimmed }
    let convId = activeId

    if (!convId) {
      convId = crypto.randomUUID()
      setConversations(prev => [{ id: convId!, title: trimmed.slice(0, 40), messages: [userMsg] }, ...prev])
      setActiveId(convId)
    } else {
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg] } : c))
    }

    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, { role: 'assistant', content: '' }] } : c))

    try {
      const authHeaders = await getAuthHeaders()
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ message: trimmed, conversation_id: convId }),
      })
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        for (const line of decoder.decode(value).split('\n')) {
          if (!line.startsWith('data: ')) continue
          const chunk = JSON.parse(line.slice(6))
          if (chunk.type === 'delta') {
            setConversations(prev => prev.map(c => {
              if (c.id !== convId) return c
              const msgs = [...c.messages]
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + chunk.text }
              return { ...c, messages: msgs }
            }))
          }
        }
      }
    } catch {
      setConversations(prev => prev.map(c => {
        if (c.id !== convId) return c
        const msgs = [...c.messages]
        msgs[msgs.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
        return { ...c, messages: msgs }
      }))
    } finally { setLoading(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  return (
    <div className="chat-layout">
      <div className="chat-sidebar">
        <div className="chat-sidebar-header">
          <span>Conversations</span>
          <button onClick={newChat} title="New chat">+</button>
        </div>
        <div className="chat-conv-list">
          {conversations.length === 0 ? <p className="no-convs">No conversations yet</p> : (
            conversations.map(c => (
              <button key={c.id} className={`chat-conv-item ${c.id === activeId ? 'active' : ''}`} onClick={() => setActiveId(c.id)}>
                {c.title}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="chat-main">
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div className="chat-welcome">
              <div className="chat-welcome-logo">✦</div>
              <h2>What can I help with?</h2>
              <p>Ask anything about your business</p>
              <div className="chat-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="chat-suggestion" onClick={() => sendMessage(s.prompt)}>
                    <span>{s.icon}</span> {s.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, i) => (
                <div key={i} className={`chat-msg ${msg.role}`}>
                  {msg.role === 'assistant' && <div className="chat-avatar">✦</div>}
                  <div className="chat-bubble">
                    {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                  </div>
                </div>
              ))}
              {loading && messages[messages.length - 1]?.content === '' && (
                <div className="chat-msg assistant">
                  <div className="chat-avatar">✦</div>
                  <div className="chat-bubble typing"><span /><span /><span /></div>
                </div>
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="chat-input-wrap">
          <div className="chat-input-box">
            <textarea ref={textareaRef} value={input} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Message aibia..." rows={1} disabled={loading} />
            <button onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L8 15M8 1L3 6M8 1L13 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
          <p className="chat-hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
