import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { getEmailAccounts, initiateOAuth, disconnectEmailAccount } from '../api'
import type { EmailAccount } from '../types'
import './Settings.css'

const SOCIAL_PLATFORMS = [
  { id: 'instagram', icon: '📸', label: 'Instagram', docsUrl: 'https://developers.facebook.com/docs/instagram-api' },
  { id: 'twitter', icon: '🐦', label: 'X / Twitter', docsUrl: 'https://developer.twitter.com' },
  { id: 'tiktok', icon: '🎵', label: 'TikTok', docsUrl: 'https://developers.tiktok.com' },
  { id: 'linkedin', icon: '💼', label: 'LinkedIn', docsUrl: 'https://www.linkedin.com/developers' },
  { id: 'facebook', icon: '👥', label: 'Facebook', docsUrl: 'https://developers.facebook.com' },
]

export default function Settings() {
  const [params] = useSearchParams()
  const qc = useQueryClient()

  const { data: accounts = [] } = useQuery({ queryKey: ['email-accounts'], queryFn: getEmailAccounts })

  const disconnectMutation = useMutation({
    mutationFn: disconnectEmailAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['email-accounts'] }),
  })

  useEffect(() => {
    if (params.get('connected')) {
      qc.invalidateQueries({ queryKey: ['email-accounts'] })
    }
  }, [params, qc])

  const connectEmail = async (provider: string) => {
    try {
      const { auth_url } = await initiateOAuth(provider)
      window.location.href = auth_url
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to initiate OAuth'
      alert(msg)
    }
  }

  const connected = params.get('connected')
  const error = params.get('error')

  return (
    <div className="page settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p>Connect your accounts and configure integrations</p>
      </div>

      {connected && <div className="settings-banner success">✓ {connected} connected successfully!</div>}
      {error && <div className="settings-banner error">⚠️ {error}</div>}

      {/* Email */}
      <section className="settings-section">
        <h2>📧 Email Accounts</h2>
        <p className="section-desc">Connect your email to let aibia read your inbox and send outreach emails with your approval.</p>

        <div className="connected-accounts">
          {accounts.map((acc: EmailAccount) => (
            <div key={acc.id} className="account-row">
              <span className="account-provider">{acc.provider === 'gmail' ? '📧 Gmail' : '📬 Outlook'}</span>
              <span className="account-email">{acc.email_address}</span>
              <button className="btn-danger-sm" onClick={() => disconnectMutation.mutate(acc.id)}>Disconnect</button>
            </div>
          ))}
        </div>

        <div className="connect-buttons">
          <button className="connect-btn gmail" onClick={() => connectEmail('gmail')}>
            <span>📧</span> Connect Gmail
          </button>
          <button className="connect-btn outlook" onClick={() => connectEmail('outlook')}>
            <span>📬</span> Connect Outlook
          </button>
        </div>

        <div className="settings-note">
          To connect Gmail or Outlook, add your OAuth credentials to <code>backend/.env</code>.
          See <code>backend/.env.example</code> for instructions.
        </div>
      </section>

      {/* Social */}
      <section className="settings-section">
        <h2>📣 Social Media</h2>
        <p className="section-desc">Connect your social accounts to enable auto-posting after you approve drafts.</p>

        <div className="social-platforms">
          {SOCIAL_PLATFORMS.map(p => (
            <div key={p.id} className="social-platform-row">
              <span className="platform-icon">{p.icon}</span>
              <span className="platform-name">{p.label}</span>
              <span className="platform-status">Setup required</span>
              <a href={p.docsUrl} target="_blank" rel="noreferrer" className="btn-ghost-sm">Developer Docs →</a>
            </div>
          ))}
        </div>

        <div className="settings-note">
          Social posting requires a developer account for each platform. Once you have API credentials,
          add them to <code>backend/.env</code>.
        </div>
      </section>

      {/* API Keys */}
      <section className="settings-section">
        <h2>🔑 API Keys</h2>
        <p className="section-desc">Configure in <code>backend/.env</code>. Never commit this file.</p>
        <div className="api-key-list">
          {[
            { key: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude)', required: true, url: 'https://console.anthropic.com/settings/keys' },
            { key: 'TAVILY_API_KEY', label: 'Tavily (Web Search)', required: true, url: 'https://tavily.com' },
            { key: 'FERNET_KEY', label: 'Fernet Key (Token Encryption)', required: true, url: null },
          ].map(item => (
            <div key={item.key} className="api-key-row">
              <code className="key-name">{item.key}</code>
              <span className="key-label">{item.label}</span>
              {item.required && <span className="key-required">Required</span>}
              {item.url && <a href={item.url} target="_blank" rel="noreferrer" className="btn-ghost-sm">Get key →</a>}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
