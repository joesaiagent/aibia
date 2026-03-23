import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPendingCount } from '../../api'
import './Sidebar.css'

const nav = [
  { to: '/', label: 'Dashboard', icon: '▦' },
  { to: '/agent', label: 'Agent', icon: '✦' },
  { to: '/chat', label: 'Chat', icon: '💬' },
  { to: '/leads', label: 'Leads', icon: '👥' },
  { to: '/inbox', label: 'Inbox', icon: '📧' },
  { to: '/social', label: 'Social', icon: '📣' },
  { to: '/approvals', label: 'Approvals', icon: '✅' },
  { to: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const { data } = useQuery({ queryKey: ['pending-count'], queryFn: getPendingCount, refetchInterval: 10000 })
  const pendingCount = data?.count ?? 0

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text">aibia</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.to === '/approvals' && pendingCount > 0 && (
              <span className="nav-badge">{pendingCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">✦</div>
          <div>
            <div className="user-name">aibia</div>
            <div className="user-plan">beta</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
