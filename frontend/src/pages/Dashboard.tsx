import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats } from '../api'
import './Dashboard.css'

export default function Dashboard() {
  const { data: stats } = useQuery({ queryKey: ['dashboard-stats'], queryFn: getDashboardStats, refetchInterval: 15000 })
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Your business overview</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card clickable" onClick={() => navigate('/leads')}>
          <div className="stat-icon">👥</div>
          <div className="stat-body">
            <div className="stat-value">{stats?.leads.total ?? 0}</div>
            <div className="stat-label">Total Leads</div>
          </div>
          <div className="stat-breakdown">
            <span className="tag new">{stats?.leads.new ?? 0} new</span>
            <span className="tag qualified">{stats?.leads.qualified ?? 0} qualified</span>
            <span className="tag won">{stats?.leads.won ?? 0} won</span>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/approvals')}>
          <div className="stat-icon">✅</div>
          <div className="stat-body">
            <div className="stat-value">{stats?.approvals.pending ?? 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>
          {(stats?.approvals.pending ?? 0) > 0 && (
            <div className="stat-alert">Action required</div>
          )}
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/social')}>
          <div className="stat-icon">📣</div>
          <div className="stat-body">
            <div className="stat-value">{stats?.social.posted ?? 0}</div>
            <div className="stat-label">Posts Published</div>
          </div>
          <div className="stat-breakdown">
            <span className="tag">{stats?.social.drafts ?? 0} drafts</span>
            <span className="tag pending">{stats?.social.pending_approval ?? 0} pending</span>
          </div>
        </div>

        <div className="stat-card clickable" onClick={() => navigate('/inbox')}>
          <div className="stat-icon">📧</div>
          <div className="stat-body">
            <div className="stat-value">{stats?.email.connected_accounts ?? 0}</div>
            <div className="stat-label">Connected Accounts</div>
          </div>
          {(stats?.email.connected_accounts ?? 0) === 0 && (
            <div className="stat-alert muted">Connect email in Settings</div>
          )}
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-grid">
          <button className="action-card" onClick={() => navigate('/agent')}>
            <span className="action-icon">✦</span>
            <span className="action-label">Run Agent Task</span>
            <span className="action-desc">Find leads, draft emails, post to social</span>
          </button>
          <button className="action-card" onClick={() => navigate('/leads')}>
            <span className="action-icon">➕</span>
            <span className="action-label">Add Lead</span>
            <span className="action-desc">Manually add a new prospect</span>
          </button>
          <button className="action-card" onClick={() => navigate('/approvals')}>
            <span className="action-icon">📋</span>
            <span className="action-label">Review Queue</span>
            <span className="action-desc">Approve or reject pending actions</span>
          </button>
          <button className="action-card" onClick={() => navigate('/chat')}>
            <span className="action-icon">💬</span>
            <span className="action-label">Chat with aibia</span>
            <span className="action-desc">Ask questions, get business advice</span>
          </button>
        </div>
      </div>
    </div>
  )
}
