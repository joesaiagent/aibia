import { useState } from 'react'
import { SignUpButton, SignInButton } from '@clerk/clerk-react'
import './Landing.css'

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI Agent',
    desc: 'Give aibia a task in plain English. It searches for leads, drafts emails, and creates social posts — all on its own.',
  },
  {
    icon: '🎯',
    title: 'Lead Generation',
    desc: 'Automatically find and track prospects for your business. Score, filter, and manage your entire pipeline.',
  },
  {
    icon: '✉️',
    title: 'Email Outreach',
    desc: 'Connect Gmail or Outlook. aibia drafts personalized outreach emails and sends them after you approve.',
  },
  {
    icon: '📱',
    title: 'Social Media',
    desc: 'Generate ready-to-publish posts for LinkedIn, Instagram, Twitter, TikTok, and Facebook.',
  },
  {
    icon: '✅',
    title: 'Human-in-the-Loop',
    desc: 'Every action goes through an approval queue. You stay in control — nothing sends without your sign-off.',
  },
  {
    icon: '📊',
    title: 'Dashboard',
    desc: 'See your leads, approvals, emails, and social activity at a glance. Know exactly where your business stands.',
  },
]

const HOW_IT_WORKS = [
  { step: '1', title: 'Connect your tools', desc: 'Link your Gmail or Outlook and tell aibia about your business.' },
  { step: '2', title: 'Give it a task', desc: 'Type what you need — "Find 10 leads in Austin and draft outreach emails for each."' },
  { step: '3', title: 'Review & approve', desc: 'aibia does the work and puts everything in your approval queue. You decide what goes out.' },
]

const SOLO_FEATURES = [
  'AI agent — unlimited tasks',
  'Lead generation & pipeline',
  'Email outreach (Gmail / Outlook)',
  'Social media post drafting',
  'Human-in-the-loop approvals',
  '1 user',
]

const BUSINESS_FEATURES = [
  'Everything in Solo',
  'Multiple team members',
  'Priority support',
  'Custom onboarding call',
  'Volume pricing',
  'Dedicated account manager',
]

interface ContactForm {
  name: string
  company: string
  email: string
  team_size: string
  message: string
}

export default function Landing() {
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<ContactForm>({ name: '', company: '', email: '', team_size: '', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const handleCheckout = async () => {
    setCheckoutLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const { url } = await res.json()
      window.location.href = url
    } catch {
      setCheckoutLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      setSubmitted(true)
    } catch {
      setSubmitted(true)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">✦ aibia</div>
        <div className="landing-nav-actions">
          <SignInButton mode="modal">
            <button className="btn-ghost">Sign in</button>
          </SignInButton>
          <button className="btn-primary" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>See Pricing</button>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-badge">Open Source · Free to self-host</div>
        <h1 className="landing-headline">
          The AI agent built for<br />
          <span className="landing-accent">growing businesses</span>
        </h1>
        <p className="landing-subheadline">
          aibia automates lead generation, email outreach, and social media marketing —
          with a human-in-the-loop approval system so you stay in control.
        </p>
        <div className="landing-cta-group">
          <SignUpButton mode="modal">
            <button className="btn-primary btn-lg">Grant Access Key →</button>
          </SignUpButton>
          <a
            href="https://github.com/joesaiagent/aibia"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-lg"
          >
            View on GitHub
          </a>
        </div>
        <div className="landing-hero-preview">
          <div className="landing-preview-bar">
            <span /><span /><span />
          </div>
          <div className="landing-preview-body">
            <div className="preview-prompt">
              <span className="preview-icon">✦</span>
              Find 5 leads for a coffee shop in Austin, Texas and draft outreach emails for each
            </div>
            <div className="preview-steps">
              <div className="preview-step done">🔍 Searching for coffee shop leads in Austin...</div>
              <div className="preview-step done">💾 Saved 5 leads to your pipeline</div>
              <div className="preview-step done">✉️ Drafted 5 personalized outreach emails</div>
              <div className="preview-step active">✅ Waiting for your approval →</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="landing-section">
        <h2 className="landing-section-title">Everything your business needs</h2>
        <p className="landing-section-sub">One platform. Six powerful tools. Zero headcount required.</p>
        <div className="landing-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="landing-feature-card">
              <div className="landing-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="landing-section landing-how">
        <h2 className="landing-section-title">How it works</h2>
        <div className="landing-steps">
          {HOW_IT_WORKS.map((h) => (
            <div key={h.step} className="landing-step">
              <div className="landing-step-num">{h.step}</div>
              <h3>{h.title}</h3>
              <p>{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="landing-section landing-pricing">
        <h2 className="landing-section-title">Simple pricing</h2>
        <p className="landing-section-sub">Start solo. Scale with your team.</p>
        <div className="pricing-cards">

          {/* Solo */}
          <div className="pricing-card pricing-featured">
            <div className="pricing-badge">Most popular</div>
            <h3>aibia Solo</h3>
            <div className="pricing-price">
              <span className="pricing-amount">$65</span>
              <span className="pricing-period">/month</span>
            </div>
            <p className="pricing-desc">Everything you need to run AI-powered outreach on your own.</p>
            <ul className="pricing-features">
              {SOLO_FEATURES.map(f => <li key={f}><span>✓</span>{f}</li>)}
            </ul>
            <button className="btn-primary pricing-btn" onClick={handleCheckout} disabled={checkoutLoading}>
              {checkoutLoading ? 'Loading...' : 'Get started →'}
            </button>
          </div>

          {/* Business */}
          <div className="pricing-card">
            <h3>aibia Business</h3>
            <div className="pricing-price">
              <span className="pricing-amount">Custom</span>
            </div>
            <p className="pricing-desc">For teams that want to scale outreach across the whole company.</p>
            <ul className="pricing-features">
              {BUSINESS_FEATURES.map(f => <li key={f}><span>✓</span>{f}</li>)}
            </ul>
            <button className="btn-ghost pricing-btn" onClick={() => setShowModal(true)}>
              Contact us →
            </button>
          </div>

        </div>
      </section>

      {/* CTA */}
      <section className="landing-final-cta">
        <h2>Ready to grow your business?</h2>
        <p>Get in touch and we'll set you up with the right plan.</p>
        <button className="btn-primary btn-lg" onClick={() => setShowModal(true)}>Contact us →</button>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>✦ aibia</span>
        <span>Open source · Built for growing businesses</span>
        <a href="https://github.com/joesaiagent/aibia" target="_blank" rel="noopener noreferrer">GitHub</a>
      </footer>

      {/* Contact Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            {submitted ? (
              <div className="modal-success">
                <div className="modal-success-icon">✓</div>
                <h3>We'll be in touch!</h3>
                <p>Thanks for your interest in aibia Business. Expect an email from us within 24 hours.</p>
                <a
                  href="https://calendly.com/joesaiagent/30min"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                >
                  Or book a call now →
                </a>
              </div>
            ) : (
              <>
                <h3>Tell us about your team</h3>
                <p className="modal-sub">We'll reach out to discuss a plan that fits your business.</p>
                <form onSubmit={handleSubmit} className="contact-form">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name</label>
                      <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
                    </div>
                    <div className="form-group">
                      <label>Company</label>
                      <input required value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email</label>
                      <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="you@company.com" />
                    </div>
                    <div className="form-group">
                      <label>Team size</label>
                      <select required value={form.team_size} onChange={e => setForm(p => ({ ...p, team_size: e.target.value }))}>
                        <option value="">Select...</option>
                        <option>2–5 people</option>
                        <option>6–15 people</option>
                        <option>16–50 people</option>
                        <option>50+ people</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>What are you trying to accomplish? <span>(optional)</span></label>
                    <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Tell us about your goals..." rows={3} />
                  </div>
                  <div className="form-actions">
                    <a
                      href="https://calendly.com/joesaiagent/30min"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-ghost"
                    >
                      Book a call instead
                    </a>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                      {submitting ? 'Sending...' : 'Send message →'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
