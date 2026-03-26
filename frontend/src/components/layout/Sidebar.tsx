import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useUser, useClerk } from '@clerk/clerk-react'
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
  { to: '/account', label: 'Account', icon: '👤' },
]

export default function Sidebar() {
  const { data } = useQuery({ queryKey: ['pending-count'], queryFn: getPendingCount, refetchInterval: 10000 })
  const pendingCount = data?.count ?? 0
  const { user } = useUser()
  const { signOut } = useClerk()

  const initials = user?.firstName?.[0] ?? user?.emailAddresses?.[0]?.emailAddress?.[0]?.toUpperCase() ?? '?'
  const displayName = user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] ?? 'User'

  return (
    <>
      {/* Desktop sidebar */}
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
            <div className="user-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="user-name">{displayName}</div>
              <div className="user-plan">aibia beta</div>
            </div>
            <button className="signout-btn" onClick={() => signOut()} title="Sign out">↪</button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="mobile-nav">
        {nav.map(item => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
            {item.to === '/approvals' && pendingCount > 0 && (
              <span className="mobile-nav-badge">{pendingCount}</span>
            )}
          </NavLink>
        ))}
        <button className="mobile-nav-item mobile-signout" onClick={() => signOut()} title="Sign out">
          <span className="mobile-nav-icon">↪</span>
          <span className="mobile-nav-label">Sign out</span>
        </button>
      </nav>
    </>
  )
}
