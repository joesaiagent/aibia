import { useState } from 'react'
import { useClerk } from '@clerk/clerk-react'
import client from '../api/client'
import './Upgrade.css'

const FEATURES = [
  'AI agent — unlimited tasks',
  'Lead generation & pipeline',
  'Email outreach (Gmail / Outlook)',
  'Social media post drafting',
  'Human-in-the-loop approvals',
  '1 user seat',
]

export default function Upgrade() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signOut } = useClerk()

  const handleSubscribe = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.post('/stripe/checkout')
      window.location.href = res.data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="upgrade-page">
      <div className="upgrade-card">
        <div className="upgrade-badge">aibia Solo</div>
        <div className="upgrade-price">
          <span className="upgrade-amount">$65</span>
          <span className="upgrade-period">/month</span>
        </div>
        <p className="upgrade-subtitle">Everything you need to run your business on autopilot.</p>
        <ul className="upgrade-features">
          {FEATURES.map(f => (
            <li key={f}><span className="upgrade-check">✓</span> {f}</li>
          ))}
        </ul>
        <button className="upgrade-btn" onClick={handleSubscribe} disabled={loading}>
          {loading ? 'Redirecting to checkout…' : 'Subscribe — $65/mo'}
        </button>
        {error && <p className="upgrade-error">{error}</p>}
        <p className="upgrade-note">Secure payment via Stripe. Cancel anytime.</p>
        <button className="upgrade-signout" onClick={() => signOut()}>Sign out</button>
      </div>
    </div>
  )
}
