import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../api'
import './Dashboard.css'

const STAGES = [
  { key: 'new', label: 'New', color: '#60a5fa' },
  { key: 'contacted', label: 'Contacted', color: '#a78bfa' },
  { key: 'meeting_booked', label: 'Meeting', color: '#fbbf24' },
  { key: 'client', label: 'Client', color: '#4ade80' },
  { key: 'closed', label: 'Closed', color: '#6b7280' },
]

const STATUS_COLORS: Record<string, string> = {
  new: '#60a5fa', contacted: '#a78bfa', meeting_booked: '#fbbf24', client: '#4ade80', closed: '#6b7280',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats, refetchInterval: 15000 })
  const navigate = useNavigate()
  const pipeline = stats?.leads.pipeline

  return (
    <div className="page dash-page">
      <div className="dash-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dash-sub">Your consultation pipeline overview</p>
        </div>
        <div className="dash-header-actions">
          <button className="btn-outline" onClick={() => navigate('/leads')}>+ Add Lead</button>
          <button className="btn-primary-dark" onClick={() => navigate('/campaigns')}>Launch Campaign</button>
        </div>
      </div>

      <div className="dash-stats">
        <div className="dash-stat-card" onClick={() => navigate('/leads')} style={{ cursor: 'pointer' }}>
          <div className="dsc-label">Total Leads</div>
          <div className="dsc-value">{stats?.leads.total ?? 0}</div>
          <div className="dsc-sub">{pipeline?.client ?? 0} active clients</div>
        </div>
        <div className="dash-stat-card" onClick={() => navigate('/campaigns')} style={{ cursor: 'pointer' }}>
          <div className="dsc-label">Active Campaigns</div>
          <div className="dsc-value">{stats?.campaigns.active ?? 0}</div>
          <div className="dsc-sub">{stats?.campaigns.total ?? 0} total</div>
        </div>
        <div className="dash-stat-card" onClick={() => navigate('/approvals')} style={{ cursor: 'pointer' }}>
          <div className="dsc-label">Pending Approval</div>
          <div className="dsc-value">{stats?.approvals.pending ?? 0}</div>
          {(stats?.approvals.pending ?? 0) > 0 && <div className="dsc-alert">Review needed</div>}
        </div>
        <div className="dash-stat-card">
          <div className="dsc-label">Posts Published</div>
          <div className="dsc-value">{stats?.posts.published ?? 0}</div>
          <div className="dsc-sub">all time</div>
        </div>
      </div>

      <div className="dash-section">
        <h2 className="dash-section-title">Consultation Pipeline</h2>
        <div className="pipeline-funnel">
          {STAGES.map((stage, i) => {
            const count = (pipeline as Record<string, number> | undefined)?.[stage.key] ?? 0
            return (
              <div key={stage.key} className="funnel-stage">
                <div className="funnel-bar" onClick={() => navigate(`/leads?status=${stage.key}`)}>
                  <div className="funnel-fill" style={{ background: stage.color, opacity: count === 0 ? 0.15 : 0.2 }} />
                  <div className="funnel-count" style={{ color: stage.color }}>{count}</div>
                </div>
                <div className="funnel-label">{stage.label}</div>
                {i < STAGES.length - 1 && <div className="funnel-arrow">›</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="dash-section">
        <div className="dash-section-header">
          <h2 className="dash-section-title">Recent Leads</h2>
          <button className="btn-link" onClick={() => navigate('/leads')}>View all →</button>
        </div>
        {!stats?.recent_leads?.length ? (
          <div className="dash-empty">No leads yet. <button className="btn-link" onClick={() => navigate('/leads')}>Add your first →</button></div>
        ) : (
          <div className="recent-leads">
            {stats.recent_leads.map(lead => (
              <div key={lead.id} className="recent-lead-row" onClick={() => navigate('/leads')}>
                <div className="rl-avatar">{lead.name[0].toUpperCase()}</div>
                <div className="rl-info">
                  <div className="rl-name">{lead.name}</div>
                  <div className="rl-company">{lead.company || 'Independent'}</div>
                </div>
                {lead.service_interest && <div className="rl-interest">{lead.service_interest}</div>}
                <div className="rl-status" style={{ color: STATUS_COLORS[lead.status] }}>{lead.status.replace('_', ' ')}</div>
                <div className="rl-time">{timeAgo(lead.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="dash-section">
        <h2 className="dash-section-title">Quick Actions</h2>
        <div className="quick-actions">
          {[
            { icon: '👥', label: 'View Pipeline', desc: 'Manage consultation leads', path: '/leads' },
            { icon: '📣', label: 'Social Agent', desc: 'Launch & monitor campaigns', path: '/campaigns' },
            { icon: '✅', label: 'Review Queue', desc: 'Approve pending posts', path: '/approvals' },
            { icon: '💬', label: 'AI Assistant', desc: 'Ask about your business', path: '/chat' },
          ].map(a => (
            <button key={a.path} className="qa-card" onClick={() => navigate(a.path)}>
              <span className="qa-icon">{a.icon}</span>
              <span className="qa-label">{a.label}</span>
              <span className="qa-desc">{a.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
