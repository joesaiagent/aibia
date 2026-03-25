import { UserProfile } from '@clerk/clerk-react'
import './Account.css'

export default function Account() {
  return (
    <div className="page">
      <div className="page-header">
        <h1>Account</h1>
        <p>Manage your name, email, password and security settings</p>
      </div>
      <div className="account-profile">
        <UserProfile
          appearance={{
            variables: {
              colorBackground: '#111',
              colorInputBackground: '#1a1a1a',
              colorInputText: '#fff',
              colorText: '#fff',
              colorTextSecondary: '#aaa',
              colorPrimary: '#0072ff',
              colorDanger: '#ff6b6b',
              borderRadius: '8px',
              fontFamily: 'inherit',
            },
            elements: {
              card: 'account-clerk-card',
              navbar: 'account-clerk-navbar',
              navbarButton: 'account-clerk-nav-btn',
              pageScrollBox: 'account-clerk-scroll',
            },
          }}
        />
      </div>
    </div>
  )
}
