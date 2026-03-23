import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import type { AgentEvent } from '../types'
import './AgentRun.css'

interface AgentStep {
  id: number
  event: AgentEvent
}

const TASK_SUGGESTIONS = [
  'Find 5 leads for a coffee shop in Austin, Texas and draft outreach emails for each',
  'Search for small restaurant owners in Miami and create a prospect list',
  'Draft a LinkedIn post about the benefits of AI for small businesses',
  'Find potential leads for a hair salon and draft Instagram posts to attract new customers',
]

export default function AgentRun() {
  const [task, setTask] = useState('')
  const [steps, setSteps] = useState<AgentStep[]>([])
  const [running, setRunning] = useState(false)
  const [approvalCount, setApprovalCount] = useState(0)
  const stepIdRef = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [steps])

  const runTask = async (taskText = task) => {
    const trimmed = taskText.trim()
    if (!trimmed || running) return
    setTask('')
    setSteps([])
    setRunning(true)
    setApprovalCount(0)

    // streaming text step id
    let streamingId: number | null = null

    try {
      const res = await fetch('http://localhost:8000/api/agent/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: trimmed }),
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const event: AgentEvent = JSON.parse(line.slice(6))

          if (event.type === 'text_delta') {
            // Append to existing streaming step or create a new one
            if (streamingId === null) {
              streamingId = stepIdRef.current++
              setSteps(prev => [...prev, { id: streamingId!, event: { type: 'text', content: event.content } }])
            } else {
              setSteps(prev => prev.map(s =>
                s.id === streamingId
                  ? { ...s, event: { type: 'text', content: (s.event as { type: 'text'; content: string }).content + event.content } }
                  : s
              ))
            }
          } else {
            // Non-delta event: close the streaming step
            if (event.type !== 'text') streamingId = null
            if (event.type === 'approval_created') setApprovalCount(c => c + 1)
            if (event.type !== 'text') {
              setSteps(prev => [...prev, { id: stepIdRef.current++, event }])
            }
          }
        }
      }
    } catch (e) {
      setSteps(prev => [...prev, { id: stepIdRef.current++, event: { type: 'error', message: String(e) } }])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="page agent-page">
      <div className="page-header">
        <h1>Agent</h1>
        <p>Give aibia a task and watch it work autonomously</p>
      </div>

      {steps.length === 0 && !running && (
        <div className="agent-welcome">
          <div className="agent-welcome-icon">✦</div>
          <h2>What should aibia do?</h2>
          <p>Describe a business task. The agent will search, research, and take actions — queuing anything that needs your approval before it runs.</p>
          <div className="task-suggestions">
            {TASK_SUGGESTIONS.map((s, i) => (
              <button key={i} className="task-suggestion" onClick={() => runTask(s)}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {steps.length > 0 && (
        <div className="agent-steps">
          {approvalCount > 0 && (
            <div className="approval-notice">
              ✅ {approvalCount} action{approvalCount > 1 ? 's' : ''} queued for your approval — <a href="/approvals">Review in Approvals</a>
            </div>
          )}
          {steps.map(({ id, event }) => <AgentStepCard key={id} event={event} />)}
          {running && (
            <div className="agent-step thinking">
              <div className="step-dot pulse" />
              <span>Agent is working...</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      <div className="agent-input-area">
        <input
          type="text"
          value={task}
          onChange={e => setTask(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && runTask()}
          placeholder="Give aibia a task..."
          disabled={running}
        />
        <button onClick={() => runTask()} disabled={running || !task.trim()}>
          {running ? '...' : 'Run'}
        </button>
      </div>
    </div>
  )
}

function AgentStepCard({ event }: { event: AgentEvent }) {
  const [expanded, setExpanded] = useState(false)

  if (event.type === 'text') {
    return (
      <div className="agent-step text-step">
        <div className="step-avatar">✦</div>
        <div className="step-content markdown-content">
          <ReactMarkdown>{event.content}</ReactMarkdown>
        </div>
      </div>
    )
  }

  if (event.type === 'tool_start') {
    return (
      <div className="agent-step tool-step" onClick={() => setExpanded(e => !e)}>
        <div className="step-dot tool" />
        <div className="step-content">
          <div className="tool-header">
            <span className="tool-name">🔧 {event.tool}</span>
            <span className="tool-toggle">{expanded ? '▲' : '▼'}</span>
          </div>
          {expanded && (
            <pre className="tool-json">{JSON.stringify(event.input, null, 2)}</pre>
          )}
        </div>
      </div>
    )
  }

  if (event.type === 'tool_result') {
    return (
      <div className="agent-step result-step" onClick={() => setExpanded(e => !e)}>
        <div className="step-dot result" />
        <div className="step-content">
          <div className="tool-header">
            <span className="tool-name">✓ {event.tool} result</span>
            <span className="tool-toggle">{expanded ? '▲' : '▼'}</span>
          </div>
          {expanded && (
            <pre className="tool-json">{JSON.stringify(event.result, null, 2)}</pre>
          )}
        </div>
      </div>
    )
  }

  if (event.type === 'approval_created') {
    return (
      <div className="agent-step approval-step">
        <div className="step-dot approval" />
        <div className="step-content">
          <span>📋 Queued for approval: <strong>{event.title}</strong></span>
        </div>
      </div>
    )
  }

  if (event.type === 'done') {
    return (
      <div className="agent-step done-step">
        <div className="step-dot done" />
        <span>Task complete</span>
      </div>
    )
  }

  if (event.type === 'error') {
    return (
      <div className="agent-step error-step">
        <div className="step-dot error" />
        <span>Error: {event.message}</span>
      </div>
    )
  }

  return null
}
