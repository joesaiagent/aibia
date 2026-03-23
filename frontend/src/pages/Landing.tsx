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

export default function Landing() {
  return (
    <div className="landing">
      {/* Nav */}
      <nav className="landing-nav">
        <div className="landing-logo">✦ aibia</div>
        <div className="landing-nav-actions">
          <SignInButton mode="modal">
            <button className="btn-ghost">Sign in</button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="btn-primary">Get started free</button>
          </SignUpButton>
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
            <button className="btn-primary btn-lg">Start for free →</button>
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

      {/* CTA */}
      <section className="landing-final-cta">
        <h2>Ready to grow your business?</h2>
        <p>Join the waitlist and be first to get access.</p>
        <SignUpButton mode="modal">
          <button className="btn-primary btn-lg">Get started free →</button>
        </SignUpButton>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <span>✦ aibia</span>
        <span>Open source · Built for growing businesses</span>
        <a href="https://github.com/joesaiagent/aibia" target="_blank" rel="noopener noreferrer">GitHub</a>
      </footer>
    </div>
  )
}
