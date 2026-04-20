import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { getLeads, getLead, createLead, updateLead, deleteLead, addLeadNote, generateFollowup } from '../api'
import type { Lead, LeadNote } from '../types'
import './Leads.css'

const STAGES = [
  { key: 'new', label: 'New', color: '#60a5fa' },
  { key: 'contacted', label: 'Contacted', color: '#a78bfa' },
  { key: 'meeting_booked', label: 'Meeting Booked', color: '#fbbf24' },
  { key: 'client', label: 'Client', color: '#4ade80' },
  { key: 'closed', label: 'Closed', color: '#6b7280' },
]

const SERVICE_OPTIONS = [
  'Social Media Automation', 'Lead Generation AI', 'Email Marketing AI',
  'Customer Service AI', 'Content Creation', 'AI Consulting', 'Custom AI Integration', 'Other',
]

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return 'yesterday'
  return `${days}d ago`
}

export default function Leads() {
  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [selectedLead, setSelectedLead] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const qc = useQueryClient()

  const { data: leads = [] } = useQuery({ queryKey: ['leads', search], queryFn: () => getLeads({ search: search || undefined }) })
  const { data: leadDetail } = useQuery({ queryKey: ['lead', selectedLead], queryFn: () => getLead(selectedLead!), enabled: !!selectedLead })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => updateLead(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); qc.invalidateQueries({ queryKey: ['lead', selectedLead] }) },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteLead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setSelectedLead(null) },
  })

  // Group leads by stage
  const byStage = STAGES.reduce<Record<string, Lead[]>>((acc, s) => {
    acc[s.key] = leads.filter(l => l.status === s.key)
    return acc
  }, {})

  // Filter from URL param
  const urlStatus = searchParams.get('status')

  return (
    <div className="leads-page">
      <div className="leads-header">
        <div>
          <h1>Pipeline</h1>
          <p className="leads-sub">{leads.length} leads in your consultation pipeline</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="leads-search" placeholder="Search leads..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn-primary-dark" onClick={() => setShowAdd(true)}>+ Add Lead</button>
        </div>
      </div>

      <div className="kanban">
        {STAGES.filter(s => !urlStatus || s.key === urlStatus).map(stage => (
          <div key={stage.key} className="kanban-col">
            <div className="kanban-col-header">
              <div className="kanban-col-title">{stage.label}</div>
              <div className="kanban-col-count" style={{ background: stage.color + '22', color: stage.color }}>
                {byStage[stage.key].length}
              </div>
            </div>
            <div className="kanban-cards">
              {byStage[stage.key].length === 0 && (
                <div className="kanban-empty">No leads</div>
              )}
              {byStage[stage.key].map(lead => (
                <div
                  key={lead.id}
                  className={`lead-card ${selectedLead === lead.id ? 'selected' : ''}`}
                  onClick={() => setSelectedLead(selectedLead === lead.id ? null : lead.id)}
                >
                  <div className="lc-top">
                    <div className="lc-avatar" style={{ borderColor: stage.color }}>
                      {lead.name[0].toUpperCase()}
                    </div>
                    <div className="lc-info">
                      <div className="lc-name">{lead.name}</div>
                      <div className="lc-company">{lead.company || 'Independent'}</div>
                    </div>
                  </div>
                  {lead.service_interest && (
                    <div className="lc-tag">{lead.service_interest}</div>
                  )}
                  {lead.business_type && (
                    <div className="lc-biz">{lead.business_type}</div>
                  )}
                  <div className="lc-footer">
                    <span className="lc-source">{lead.source.replace('_', ' ')}</span>
                    <span className="lc-time">{timeAgo(lead.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lead detail panel */}
      {selectedLead && leadDetail && (
        <LeadPanel
          lead={leadDetail}
          onClose={() => setSelectedLead(null)}
          onUpdate={data => updateMutation.mutate({ id: leadDetail.id, data })}
          onDelete={() => deleteMutation.mutate(leadDetail.id)}
          onRefresh={() => qc.invalidateQueries({ queryKey: ['lead', selectedLead] })}
        />
      )}

      {/* Add lead modal */}
      {showAdd && (
        <AddLeadModal
          onSave={async data => { await createLead(data); qc.invalidateQueries({ queryKey: ['leads'] }); setShowAdd(false) }}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  )
}

function LeadPanel({ lead, onClose, onUpdate, onDelete, onRefresh }: {
  lead: Lead & { lead_notes?: LeadNote[] }
  onClose: () => void
  onUpdate: (d: Partial<Lead>) => void
  onDelete: () => void
  onRefresh: () => void
}) {
  const [note, setNote] = useState('')
  const [followupEmail, setFollowupEmail] = useState('')
  const [generating, setGenerating] = useState(false)
  const [addingNote, setAddingNote] = useState(false)

  const handleAddNote = async () => {
    if (!note.trim()) return
    setAddingNote(true)
    await addLeadNote(lead.id, note)
    setNote('')
    onRefresh()
    setAddingNote(false)
  }

  const handleFollowup = async () => {
    setGenerating(true)
    setFollowupEmail('')
    try {
      const { email } = await generateFollowup(lead.id)
      setFollowupEmail(email)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="lead-panel-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="lead-panel">
        <div className="lp-header">
          <div className="lp-title-row">
            <div className="lp-avatar">{lead.name[0].toUpperCase()}</div>
            <div>
              <div className="lp-name">{lead.name}</div>
              <div className="lp-company">{lead.company || 'Independent'}</div>
            </div>
          </div>
          <button className="lp-close" onClick={onClose}>✕</button>
        </div>

        <div className="lp-body">
          {/* Status */}
          <div className="lp-field">
            <label>Pipeline Stage</label>
            <select value={lead.status} onChange={e => onUpdate({ status: e.target.value as Lead['status'] })} className="lp-select">
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>

          {/* Contact info */}
          <div className="lp-section">
            <div className="lp-section-title">Contact Info</div>
            {lead.email && <div className="lp-contact-row"><span>📧</span> <a href={`mailto:${lead.email}`}>{lead.email}</a></div>}
            {lead.phone && <div className="lp-contact-row"><span>📱</span> <a href={`tel:${lead.phone}`}>{lead.phone}</a></div>}
            {lead.website && <div className="lp-contact-row"><span>🌐</span> <a href={lead.website} target="_blank" rel="noopener noreferrer">{lead.website}</a></div>}
          </div>

          {/* Business details */}
          <div className="lp-section">
            <div className="lp-section-title">Business Details</div>
            {lead.service_interest && <div className="lp-detail-row"><span>AI Interest</span><span>{lead.service_interest}</span></div>}
            {lead.business_type && <div className="lp-detail-row"><span>Business Type</span><span>{lead.business_type}</span></div>}
            <div className="lp-detail-row"><span>Source</span><span>{lead.source.replace('_', ' ')}</span></div>
          </div>

          {/* AI Follow-up */}
          <div className="lp-section">
            <div className="lp-section-title">AI Follow-up</div>
            <button className="lp-ai-btn" onClick={handleFollowup} disabled={generating}>
              {generating ? '✦ Generating...' : '✦ Generate Follow-up Email'}
            </button>
            {followupEmail && (
              <div className="lp-email-output">
                <pre>{followupEmail}</pre>
                <button className="lp-copy-btn" onClick={() => navigator.clipboard.writeText(followupEmail)}>Copy to clipboard</button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="lp-section">
            <div className="lp-section-title">Notes</div>
            <div className="lp-note-input-row">
              <input
                className="lp-note-input"
                placeholder="Add a note..."
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddNote() }}
              />
              <button className="lp-note-btn" onClick={handleAddNote} disabled={addingNote || !note.trim()}>Add</button>
            </div>
            <div className="lp-notes-list">
              {!lead.lead_notes?.length && <div className="lp-no-notes">No notes yet</div>}
              {lead.lead_notes?.map(n => (
                <div key={n.id} className="lp-note">
                  <div className="lp-note-content">{n.content}</div>
                  <div className="lp-note-meta">{n.source} · {new Date(n.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          <button className="lp-delete-btn" onClick={() => { if (confirm(`Delete ${lead.name}?`)) onDelete() }}>Delete Lead</button>
        </div>
      </div>
    </div>
  )
}

function AddLeadModal({ onSave, onClose }: { onSave: (d: Partial<Lead>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Lead>>({ status: 'new', source: 'manual' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.name) return
    setSaving(true)
    await onSave(form)
    setSaving(false)
  }

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        <div className="modal-header">
          <h2>Add Lead</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <div className="form-row-2">
            <label><span>Name *</span><input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="John Smith" /></label>
            <label><span>Company</span><input value={form.company || ''} onChange={e => set('company', e.target.value)} placeholder="Smith Plumbing LLC" /></label>
          </div>
          <div className="form-row-2">
            <label><span>Email</span><input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="john@smithplumbing.com" /></label>
            <label><span>Phone</span><input value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="(732) 555-1234" /></label>
          </div>
          <div className="form-row-2">
            <label>
              <span>Business Type</span>
              <input value={form.business_type || ''} onChange={e => set('business_type', e.target.value)} placeholder="Plumbing, Restaurant, Law Firm..." />
            </label>
            <label>
              <span>AI Service Interest</span>
              <select value={form.service_interest || ''} onChange={e => set('service_interest', e.target.value)}>
                <option value="">Select service...</option>
                {SERVICE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          </div>
          <div className="form-row-2">
            <label>
              <span>Pipeline Stage</span>
              <select value={form.status || 'new'} onChange={e => set('status', e.target.value)}>
                {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </label>
            <label>
              <span>Website</span>
              <input value={form.website || ''} onChange={e => set('website', e.target.value)} placeholder="smithplumbing.com" />
            </label>
          </div>
          <label>
            <span>Notes</span>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} placeholder="How did they reach out? What do they need?" />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost-modal" onClick={onClose}>Cancel</button>
          <button className="btn-primary-dark" onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Saving...' : 'Add Lead'}</button>
        </div>
      </div>
    </div>
  )
}
