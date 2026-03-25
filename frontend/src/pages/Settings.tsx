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
        <h2>📧 Email Sending</h2>
        <p className="section-desc">Connect your email so aibia can send approved outreach emails on your behalf.</p>

        <div className="settings-note" style={{ marginBottom: 16 }}>
          <strong style={{ color: '#ddd' }}>Quickest setup — Gmail App Password (SMTP)</strong><br />
          <ol style={{ margin: '10px 0 0 16px', lineHeight: 2 }}>
            <li>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noreferrer" style={{ color: '#7c6ff7' }}>myaccount.google.com/security</a> and enable 2-Step Verification</li>
            <li>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" style={{ color: '#7c6ff7' }}>myaccount.google.com/apppasswords</a> → create a password for "aibia"</li>
            <li>Add to <code>backend/.env</code>:
              <pre style={{ background: '#0d0d0d', padding: '10px', borderRadius: 6, marginTop: 6, fontSize: 12, color: '#a78bfa' }}>
{`SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=xxxx-xxxx-xxxx-xxxx
SMTP_FROM_NAME=Your Name`}
              </pre>
            </li>
            <li>Restart the backend server</li>
          </ol>
        </div>

        <div className="connected-accounts">
          {accounts.map((acc: EmailAccount) => (
            <div key={acc.id} className="account-row">
              <span className="account-provider">{acc.provider === 'gmail' ? '📧 Gmail' : '📬 Outlook'}</span>
              <span className="account-email">{acc.email_address}</span>
              <button className="btn-danger-sm" onClick={() => disconnectMutation.mutate(acc.id)}>Disconnect</button>
            </div>
          ))}
        </div>

        <details style={{ marginTop: 12 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, color: '#555' }}>Advanced: Connect via OAuth (Gmail / Outlook)</summary>
          <div style={{ marginTop: 12 }}>
            <div className="connect-buttons">
              <button className="connect-btn gmail" onClick={() => connectEmail('gmail')}>
                <span>📧</span> Connect Gmail OAuth
              </button>
              <button className="connect-btn outlook" onClick={() => connectEmail('outlook')}>
                <span>📬</span> Connect Outlook OAuth
              </button>
            </div>
            <div className="settings-note">
              Requires a Google Cloud project with Gmail API enabled. See <code>backend/.env.example</code> for setup.
            </div>
          </div>
        </details>
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

      {/* Self-hosted only */}
      <section className="settings-section">
        <h2>🔑 Self-Hosted Setup</h2>
        <p className="section-desc">
          Running aibia on your own server? You'll need these keys in <code>backend/.env</code>.
          If you're on <strong>aibia.io</strong>, all of this is already configured for you — no action needed.
        </p>
        <div className="api-key-list">
          {[
            { key: 'ANTHROPIC_API_KEY', label: 'Anthropic (Claude) — powers all AI features. Billed to the aibia operator, not users.', required: true, url: 'https://console.anthropic.com/settings/keys' },
            { key: 'TAVILY_API_KEY', label: 'Tavily (Web Search) — powers lead generation. First 1,000 searches free/month.', required: false, url: 'https://tavily.com' },
            { key: 'FERNET_KEY', label: 'Fernet Key — auto-generated, encrypts stored OAuth tokens. Do not change.', required: true, url: null },
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

      <section className="settings-section">
        <h2>Legal</h2>
        <div className="settings-legal-links">
          <a href="/terms" target="_blank" rel="noreferrer">Terms of Service →</a>
          <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy →</a>
        </div>
      </section>
    </div>
  )
}
