import './Legal.css'

export default function Privacy() {
  return (
    <div className="legal-page">
      <div className="legal-container">
        <div className="legal-header">
          <div className="legal-logo">✦ aibia</div>
          <h1>Privacy Policy</h1>
          <p className="legal-date">Last updated: March 25, 2026</p>
        </div>

        <div className="legal-body">

          <section>
            <h2>1. Introduction</h2>
            <p>aibia ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered business automation platform at aibia.io ("the Service").</p>
            <p>Please read this policy carefully. By using the Service, you consent to the practices described in this policy.</p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>

            <h3>2.1 Information You Provide</h3>
            <ul>
              <li><strong>Account information:</strong> Name, email address, and password when you register</li>
              <li><strong>Payment information:</strong> Billing details processed by Stripe (we do not store your full card number)</li>
              <li><strong>Business data:</strong> Leads, contact information, email drafts, social media posts, and other content you create or import through the Service</li>
              <li><strong>Communications:</strong> Messages you send to us via email or contact forms</li>
              <li><strong>Connected accounts:</strong> OAuth tokens when you connect Gmail or other third-party accounts</li>
            </ul>

            <h3>2.2 Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage data:</strong> Pages visited, features used, actions taken, and time spent on the Service</li>
              <li><strong>Log data:</strong> IP address, browser type, operating system, referring URLs, and access times</li>
              <li><strong>Device information:</strong> Device type, screen resolution, and browser settings</li>
            </ul>

            <h3>2.3 Information from Third Parties</h3>
            <ul>
              <li><strong>Authentication providers:</strong> Basic profile information from Clerk (our authentication provider)</li>
              <li><strong>Payment processors:</strong> Transaction status and subscription information from Stripe</li>
              <li><strong>Search services:</strong> Lead and business data retrieved via Tavily search on your behalf</li>
            </ul>
          </section>

          <section>
            <h2>3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and improve the Service</li>
              <li>Process your subscription and payments</li>
              <li>Authenticate your identity and secure your account</li>
              <li>Execute AI agent tasks you request, including lead generation, email drafting, and social media content creation</li>
              <li>Send you service-related communications (account confirmations, billing receipts, security alerts)</li>
              <li>Respond to your support requests and inquiries</li>
              <li>Monitor and analyze usage patterns to improve the Service</li>
              <li>Detect, prevent, and address fraud, abuse, or security incidents</li>
              <li>Comply with legal obligations</li>
            </ul>
            <p>We do not sell your personal information to third parties. We do not use your data to train AI models.</p>
          </section>

          <section>
            <h2>4. AI Processing and Your Data</h2>
            <p>To provide AI-powered features, your inputs and instructions are sent to Anthropic's Claude API for processing. This includes:</p>
            <ul>
              <li>Task instructions you provide to the AI agent</li>
              <li>Business context you share with the AI</li>
              <li>Chat messages and conversation history</li>
            </ul>
            <p>Anthropic processes this data according to their own privacy policy and API usage terms. We do not share more information than necessary to fulfill your request. Conversation history is stored in memory only and is cleared when the server restarts. We do not permanently store the content of AI conversations.</p>
          </section>

          <section>
            <h2>5. Connected Email Accounts</h2>
            <p>When you connect a Gmail or Outlook account:</p>
            <ul>
              <li>We store an encrypted OAuth access token to read and send emails on your behalf</li>
              <li>We access your email only when you explicitly request it through the Service (e.g., reading your inbox, sending approved outreach emails)</li>
              <li>We do not scan, index, or store the content of your emails beyond what is necessary to complete your requested action</li>
              <li>You can disconnect your email account at any time from Settings, which immediately revokes our access</li>
            </ul>
          </section>

          <section>
            <h2>6. How We Share Your Information</h2>
            <p>We do not sell your personal information. We share your information only in the following circumstances:</p>

            <h3>6.1 Service Providers</h3>
            <p>We share information with trusted third-party service providers who assist us in operating the Service:</p>
            <ul>
              <li><strong>Clerk</strong> — user authentication and session management (<a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>)</li>
              <li><strong>Stripe</strong> — payment processing and subscription management (<a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>)</li>
              <li><strong>Anthropic</strong> — AI language model processing (<a href="https://www.anthropic.com/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>)</li>
              <li><strong>Tavily</strong> — web search for lead generation tasks</li>
              <li><strong>DigitalOcean</strong> — cloud hosting and infrastructure</li>
            </ul>

            <h3>6.2 Legal Requirements</h3>
            <p>We may disclose your information if required by law, court order, or government request, or if we believe disclosure is necessary to protect our rights, prevent fraud, or protect the safety of users or the public.</p>

            <h3>6.3 Business Transfers</h3>
            <p>If aibia is acquired, merged, or sells substantially all of its assets, your information may be transferred as part of that transaction. We will notify you before your information is transferred and becomes subject to a different privacy policy.</p>
          </section>

          <section>
            <h2>7. Data Retention</h2>
            <p>We retain your information for as long as your account is active or as needed to provide the Service. Specifically:</p>
            <ul>
              <li><strong>Account data:</strong> Retained until you delete your account</li>
              <li><strong>Business data</strong> (leads, posts, approvals): Retained until you delete it or close your account</li>
              <li><strong>Payment records:</strong> Retained for 7 years as required by financial regulations</li>
              <li><strong>Log data:</strong> Retained for 90 days</li>
              <li><strong>AI conversation history:</strong> Not permanently stored; cleared on server restart</li>
            </ul>
            <p>When you delete your account, we will delete or anonymize your personal information within 30 days, except where retention is required by law.</p>
          </section>

          <section>
            <h2>8. Data Security</h2>
            <p>We take security seriously and implement appropriate technical and organizational measures to protect your information, including:</p>
            <ul>
              <li>Encryption of data in transit (TLS/HTTPS)</li>
              <li>Encryption of sensitive data at rest (OAuth tokens are encrypted using Fernet symmetric encryption)</li>
              <li>JWT-based authentication with cryptographic signature verification</li>
              <li>Strict user data isolation — no user can access another user's data</li>
              <li>Regular security reviews of our codebase</li>
            </ul>
            <p>No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2>9. Your Rights and Choices</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request that we correct inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request that we delete your personal information</li>
              <li><strong>Portability:</strong> Request your data in a portable, machine-readable format</li>
              <li><strong>Objection:</strong> Object to certain processing of your information</li>
              <li><strong>Withdrawal of consent:</strong> Withdraw consent where processing is based on consent</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href="mailto:info@aibia.io">info@aibia.io</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2>10. Cookies and Tracking</h2>
            <p>We use cookies and similar tracking technologies to:</p>
            <ul>
              <li>Maintain your authentication session (essential cookies)</li>
              <li>Remember your preferences</li>
              <li>Analyze how the Service is used</li>
            </ul>
            <p>Essential cookies are required for the Service to function. You can control non-essential cookies through your browser settings, though this may affect functionality.</p>
          </section>

          <section>
            <h2>11. Children's Privacy</h2>
            <p>The Service is not directed to children under 18 years of age. We do not knowingly collect personal information from children under 18. If we become aware that a child under 18 has provided us with personal information, we will delete it immediately. If you believe a child has provided us with information, please contact us.</p>
          </section>

          <section>
            <h2>12. International Data Transfers</h2>
            <p>aibia operates in the United States. If you access the Service from outside the United States, your information may be transferred to, stored, and processed in the United States where our servers are located. By using the Service, you consent to this transfer.</p>
            <p>For users in the European Economic Area (EEA), United Kingdom, or Switzerland, we ensure that such transfers comply with applicable data protection laws.</p>
          </section>

          <section>
            <h2>13. California Privacy Rights (CCPA)</h2>
            <p>If you are a California resident, you have the right to:</p>
            <ul>
              <li>Know what personal information we collect, use, disclose, and sell</li>
              <li>Delete personal information we have collected from you</li>
              <li>Opt out of the sale of your personal information (we do not sell personal information)</li>
              <li>Non-discrimination for exercising your privacy rights</li>
            </ul>
            <p>To submit a request, contact us at <a href="mailto:info@aibia.io">info@aibia.io</a>.</p>
          </section>

          <section>
            <h2>14. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes by email or by posting a prominent notice on the Service at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes your acceptance of the updated policy.</p>
          </section>

          <section>
            <h2>15. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:</p>
            <p><strong>aibia</strong><br />
            Email: <a href="mailto:info@aibia.io">info@aibia.io</a><br />
            Website: <a href="https://aibia.io">aibia.io</a></p>
          </section>

        </div>

        <div className="legal-footer">
          <a href="/">← Back to aibia</a>
          <a href="/terms">Terms of Service →</a>
        </div>
      </div>
    </div>
  )
}
