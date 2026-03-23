import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getApprovals, approveItem, rejectItem } from '../api'
import type { ApprovalItem } from '../types'
import './Approvals.css'

const TYPE_ICONS: Record<string, string> = {
  email_send: '📧', social_post: '📣', lead_create: '👤', lead_update: '✏️',
}

export default function Approvals() {
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reviewNote, setReviewNote] = useState('')
  const [selected, setSelected] = useState<ApprovalItem | null>(null)
  const qc = useQueryClient()

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['approvals', statusFilter],
    queryFn: () => getApprovals(statusFilter),
    refetchInterval: 5000,
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => approveItem(id, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approvals'] }); qc.invalidateQueries({ queryKey: ['pending-count'] }); setSelected(null) },
  })
  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => rejectItem(id, note),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['approvals'] }); qc.invalidateQueries({ queryKey: ['pending-count'] }); setSelected(null) },
  })

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1>Approvals</h1>
          <p>Review actions before they execute</p>
        </div>
        <div className="tab-group">
          {['pending', 'approved', 'rejected'].map(s => (
            <button key={s} className={`tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      {isLoading ? <div className="page-loading">Loading...</div> : (
        <div className="approvals-list">
          {items.length === 0 ? (
            <div className="empty-state">
              <p>{statusFilter === 'pending' ? 'No pending approvals. Run the agent to generate actions.' : `No ${statusFilter} items.`}</p>
            </div>
          ) : items.map(item => (
            <div key={item.id} className={`approval-card ${item.status}`} onClick={() => setSelected(item)}>
              <div className="approval-type-icon">{TYPE_ICONS[item.type] || '📋'}</div>
              <div className="approval-body">
                <div className="approval-title">{item.title}</div>
                {item.description && <div className="approval-desc">{item.description}</div>}
                <div className="approval-meta">
                  <span className={`status-badge ${item.status}`}>{item.status}</span>
                  <span className="approval-time">{new Date(item.created_at).toLocaleString()}</span>
                </div>
              </div>
              {item.status === 'pending' && (
                <div className="approval-quick-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-approve" onClick={() => approveMutation.mutate({ id: item.id })}>Approve</button>
                  <button className="btn-reject" onClick={() => rejectMutation.mutate({ id: item.id })}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal wide" onClick={e => e.stopPropagation()}>
            <h2>{TYPE_ICONS[selected.type]} {selected.title}</h2>
            <div className="payload-view">
              <pre>{JSON.stringify(selected.payload, null, 2)}</pre>
            </div>
            {selected.status === 'pending' && (
              <>
                <label className="note-label">
                  <span>Note (optional)</span>
                  <input value={reviewNote} onChange={e => setReviewNote(e.target.value)} placeholder="Add a reviewer note..." />
                </label>
                <div className="modal-actions">
                  <button className="btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
                  <button className="btn-reject-full" onClick={() => rejectMutation.mutate({ id: selected.id, note: reviewNote })}>Reject</button>
                  <button className="btn-approve-full" onClick={() => approveMutation.mutate({ id: selected.id, note: reviewNote })}>✓ Approve & Execute</button>
                </div>
              </>
            )}
            {selected.status !== 'pending' && (
              <div className="modal-actions">
                <button className="btn-ghost" onClick={() => setSelected(null)}>Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
