import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCampaigns, getCampaign, createCampaign, updateCampaign, deleteCampaign, generateCampaignPosts, getLeads, approveItem, rejectItem } from '../api'
import type { Campaign, CampaignPost } from '../types'
import './Campaigns.css'

const PLATFORMS = ['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok']
const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', facebook: '👤', linkedin: '💼', twitter: '🐦', tiktok: '🎵',
}
const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280', active: '#4ade80', paused: '#fbbf24', completed: '#60a5fa',
}
const POST_STATUS_COLORS: Record<string, string> = {
  pending_approval: '#fbbf24', approved: '#4ade80', posted: '#60a5fa', draft: '#6b7280', failed: '#f87171',
}

export default function Campaigns() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showLaunch, setShowLaunch] = useState(false)
  const qc = useQueryClient()

  const { data: campaigns = [] } = useQuery({ queryKey: ['campaigns'], queryFn: getCampaigns })
  const { data: detail } = useQuery({ queryKey: ['campaign', selectedId], queryFn: () => getCampaign(selectedId!), enabled: !!selectedId })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Campaign> }) => updateCampaign(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); qc.invalidateQueries({ queryKey: ['campaign', selectedId] }) },
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['campaigns'] }); setSelectedId(null) },
  })
  const generateMutation = useMutation({
    mutationFn: generateCampaignPosts,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', selectedId] }),
  })
  const approveMutation = useMutation({
    mutationFn: (id: string) => approveItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', selectedId] }),
  })
  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaign', selectedId] }),
  })

  return (
    <div className="campaigns-page">
      <div className="campaigns-header">
        <div>
          <h1>Social Agent</h1>
          <p className="campaigns-sub">Launch and monitor social media campaigns for your clients</p>
        </div>
        <button className="btn-primary-dark" onClick={() => setShowLaunch(true)}>+ Launch Campaign</button>
      </div>

      <div className="campaigns-layout">
        {/* Campaign list */}
        <div className="campaigns-list">
          {campaigns.length === 0 && (
            <div className="campaigns-empty">
              <div className="ce-icon">📣</div>
              <div className="ce-title">No campaigns yet</div>
              <div className="ce-sub">Launch a social media campaign for one of your clients</div>
              <button className="btn-primary-dark" onClick={() => setShowLaunch(true)}>Launch Campaign</button>
            </div>
          )}
          {campaigns.map(c => (
            <div
              key={c.id}
              className={`campaign-row ${selectedId === c.id ? 'selected' : ''}`}
              onClick={() => setSelectedId(c.id)}
            >
              <div className="cr-top">
                <div className="cr-name">{c.name}</div>
                <div className="cr-status" style={{ color: STATUS_COLORS[c.status] }}>● {c.status}</div>
              </div>
              <div className="cr-client">{c.client_company || c.client_name || 'No client'}</div>
              <div className="cr-meta">
                <div className="cr-platforms">
                  {c.platforms.map(p => <span key={p}>{PLATFORM_ICONS[p] || p}</span>)}
                </div>
                <div className="cr-posts">{c.post_count} posts</div>
              </div>
            </div>
          ))}
        </div>

        {/* Campaign detail */}
        <div className="campaign-detail">
          {!selectedId && (
            <div className="cd-empty">
              <div>Select a campaign to view details</div>
            </div>
          )}
          {selectedId && detail && (
            <>
              <div className="cd-header">
                <div>
                  <div className="cd-name">{detail.name}</div>
                  <div className="cd-client">{detail.client_company || detail.client_name || 'No client assigned'}</div>
                </div>
                <div className="cd-header-actions">
                  <select
                    value={detail.status}
                    onChange={e => updateMutation.mutate({ id: detail.id, data: { status: e.target.value as Campaign['status'] } })}
                    className="cd-status-select"
                  >
                    {['draft', 'active', 'paused', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button className="cd-delete-btn" onClick={() => { if (confirm('Delete campaign?')) deleteMutation.mutate(detail.id) }}>Delete</button>
                </div>
              </div>

              {detail.campaign_brief && (
                <div className="cd-brief">
                  <div className="cd-brief-label">Campaign Brief</div>
                  <div className="cd-brief-text">{detail.campaign_brief}</div>
                </div>
              )}

              <div className="cd-platforms">
                {detail.platforms.map(p => (
                  <div key={p} className="cd-platform-badge">
                    {PLATFORM_ICONS[p]} {p}
                  </div>
                ))}
              </div>

              <div className="cd-generate">
                <button
                  className="cd-generate-btn"
                  onClick={() => generateMutation.mutate(detail.id)}
                  disabled={generateMutation.isPending}
                >
                  {generateMutation.isPending ? '✦ Generating posts...' : '✦ Generate AI Posts'}
                </button>
                <span className="cd-generate-hint">AI will write one post per platform based on your brief</span>
              </div>

              <div className="cd-posts-section">
                <div className="cd-posts-title">Posts ({detail.posts?.length ?? 0})</div>
                {!detail.posts?.length && (
                  <div className="cd-no-posts">No posts yet. Generate some with AI above.</div>
                )}
                {detail.posts?.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onApprove={() => post.approval_item_id && approveMutation.mutate(post.approval_item_id)}
                    onReject={() => post.approval_item_id && rejectMutation.mutate(post.approval_item_id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showLaunch && (
        <LaunchModal
          onSave={async data => {
            const c = await createCampaign(data)
            qc.invalidateQueries({ queryKey: ['campaigns'] })
            setSelectedId(c.id)
            setShowLaunch(false)
          }}
          onClose={() => setShowLaunch(false)}
        />
      )}
    </div>
  )
}

function PostCard({ post, onApprove, onReject }: { post: CampaignPost; onApprove: () => void; onReject: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="post-card">
      <div className="pc-header">
        <div className="pc-platform">{PLATFORM_ICONS[post.platform]} {post.platform}</div>
        <div className="pc-status" style={{ color: POST_STATUS_COLORS[post.status] }}>● {post.status.replace('_', ' ')}</div>
      </div>
      <div className={`pc-content ${expanded ? 'expanded' : ''}`} onClick={() => setExpanded(!expanded)}>
        {post.content}
      </div>
      {post.hashtags?.length > 0 && (
        <div className="pc-hashtags">{post.hashtags.map(h => `#${h}`).join(' ')}</div>
      )}
      {post.status === 'pending_approval' && (
        <div className="pc-actions">
          <button className="pc-approve" onClick={onApprove}>✓ Approve</button>
          <button className="pc-reject" onClick={onReject}>✕ Reject</button>
        </div>
      )}
    </div>
  )
}

function LaunchModal({ onSave, onClose }: { onSave: (d: Partial<Campaign>) => Promise<void>; onClose: () => void }) {
  const [form, setForm] = useState<Partial<Campaign & { platforms: string[] }>>({ platforms: [], status: 'draft' })
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const { data: clients = [] } = useQuery({
    queryKey: ['leads', '', 'client'],
    queryFn: () => getLeads({ status: 'client' }),
  })
  const { data: allLeads = [] } = useQuery({ queryKey: ['leads'], queryFn: () => getLeads() })

  const togglePlatform = (p: string) => {
    const current = form.platforms || []
    set('platforms', current.includes(p) ? current.filter(x => x !== p) : [...current, p])
  }

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
          <h2>Launch Campaign</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-form">
          <label>
            <span>Campaign Name *</span>
            <input value={form.name || ''} onChange={e => set('name', e.target.value)} placeholder="Spring Promo for Joe's Diner" />
          </label>
          <label>
            <span>Client</span>
            <select value={form.client_id || ''} onChange={e => set('client_id', e.target.value || undefined)}>
              <option value="">No client (general campaign)</option>
              {allLeads.map(l => <option key={l.id} value={l.id}>{l.name} — {l.company}</option>)}
            </select>
          </label>
          <div>
            <div className="modal-form-label">Platforms</div>
            <div className="platform-grid">
              {PLATFORMS.map(p => (
                <button
                  key={p}
                  type="button"
                  className={`platform-btn ${form.platforms?.includes(p) ? 'selected' : ''}`}
                  onClick={() => togglePlatform(p)}
                >
                  {PLATFORM_ICONS[p]} {p}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span>Campaign Brief</span>
            <textarea
              value={form.campaign_brief || ''}
              onChange={e => set('campaign_brief', e.target.value)}
              rows={4}
              placeholder="Describe the campaign goal, target audience, tone, and any specific promotions to highlight. The AI will use this to write posts."
            />
          </label>
          <div className="form-row-2">
            <label><span>Budget (optional)</span><input value={form.budget || ''} onChange={e => set('budget', e.target.value)} placeholder="$500/month" /></label>
            <label><span>Start Date</span><input type="date" value={form.start_date || ''} onChange={e => set('start_date', e.target.value)} /></label>
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-ghost-modal" onClick={onClose}>Cancel</button>
          <button className="btn-primary-dark" onClick={handleSave} disabled={saving || !form.name}>{saving ? 'Launching...' : 'Launch Campaign'}</button>
        </div>
      </div>
    </div>
  )
}
