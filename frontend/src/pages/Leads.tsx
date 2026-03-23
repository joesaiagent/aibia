import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeads, createLead, updateLead, deleteLead } from '../api'
import type { Lead } from '../types'
import './Leads.css'

const STATUS_COLORS: Record<string, string> = {
  new: '#7c6ff7', contacted: '#60a5fa', qualified: '#4ade80', won: '#fbbf24', lost: '#f87171',
}

export default function Leads() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editLead, setEditLead] = useState<Lead | null>(null)
  const qc = useQueryClient()

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', search, statusFilter],
    queryFn: () => getLeads({ search: search || undefined, status: statusFilter || undefined }),
  })

  const createMutation = useMutation({ mutationFn: createLead, onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setShowForm(false) } })
  const updateMutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<Lead> }) => updateLead(id, data), onSuccess: () => { qc.invalidateQueries({ queryKey: ['leads'] }); setEditLead(null) } })
  const deleteMutation = useMutation({ mutationFn: deleteLead, onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }) })

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1>Leads</h1>
          <p>{leads.length} prospects</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Lead</button>
      </div>

      <div className="filters">
        <input className="search-input" placeholder="Search by name, company, email..." value={search} onChange={e => setSearch(e.target.value)} />
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['new', 'contacted', 'qualified', 'won', 'lost'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {isLoading ? <div className="page-loading">Loading...</div> : (
        <div className="leads-table">
          <div className="table-header">
            <span>Name</span><span>Company</span><span>Email</span><span>Status</span><span>Source</span><span></span>
          </div>
          {leads.length === 0 ? (
            <div className="empty-state">
              <p>No leads yet. Add one manually or run the agent to find prospects.</p>
            </div>
          ) : leads.map(lead => (
            <div key={lead.id} className="table-row">
              <span className="lead-name">{lead.name}</span>
              <span className="lead-company">{lead.company || '—'}</span>
              <span className="lead-email">{lead.email || '—'}</span>
              <span>
                <select
                  className="status-select"
                  value={lead.status}
                  style={{ color: STATUS_COLORS[lead.status] }}
                  onChange={e => updateMutation.mutate({ id: lead.id, data: { status: e.target.value as Lead['status'] } })}
                >
                  {['new', 'contacted', 'qualified', 'won', 'lost'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </span>
              <span className="lead-source">{lead.source}</span>
              <span className="row-actions">
                <button className="btn-ghost" onClick={() => setEditLead(lead)}>Edit</button>
                <button className="btn-danger" onClick={() => deleteMutation.mutate(lead.id)}>Delete</button>
              </span>
            </div>
          ))}
        </div>
      )}

      {(showForm || editLead) && (
        <LeadForm
          lead={editLead}
          onSave={data => editLead ? updateMutation.mutate({ id: editLead.id, data }) : createMutation.mutate(data)}
          onClose={() => { setShowForm(false); setEditLead(null) }}
        />
      )}
    </div>
  )
}

function LeadForm({ lead, onSave, onClose }: { lead: Lead | null; onSave: (d: Partial<Lead>) => void; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Lead>>(lead || { status: 'new', source: 'manual' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{lead ? 'Edit Lead' : 'Add Lead'}</h2>
        <div className="form-grid">
          {[['name','Name *'],['company','Company'],['email','Email'],['phone','Phone'],['website','Website'],['linkedin_url','LinkedIn URL']].map(([k, l]) => (
            <label key={k}>
              <span>{l}</span>
              <input value={(form as Record<string,string>)[k] || ''} onChange={e => set(k, e.target.value)} />
            </label>
          ))}
          <label>
            <span>Status</span>
            <select value={form.status || 'new'} onChange={e => set('status', e.target.value)}>
              {['new','contacted','qualified','won','lost'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="full-width">
            <span>Notes</span>
            <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)} rows={3} />
          </label>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave(form)} disabled={!form.name}>Save</button>
        </div>
      </div>
    </div>
  )
}
