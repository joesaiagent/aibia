import { useQuery } from '@tanstack/react-query'
import { getInbox, getEmailAccounts } from '../api'
import './Inbox.css'

export default function Inbox() {
  const { data: accounts = [] } = useQuery({ queryKey: ['email-accounts'], queryFn: getEmailAccounts })
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['inbox'],
    queryFn: getInbox,
    enabled: accounts.length > 0,
  })

  if (accounts.length === 0) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Inbox</h1>
          <p>Unified email from all connected accounts</p>
        </div>
        <div className="empty-state centered">
          <div className="empty-icon">📧</div>
          <h2>No email accounts connected</h2>
          <p>Connect your Gmail or Outlook in Settings to see your inbox here.</p>
          <a href="/settings" className="btn-primary-link">Go to Settings →</a>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inbox</h1>
        <p>{accounts.length} account{accounts.length > 1 ? 's' : ''} connected · {messages.length} messages</p>
      </div>

      {isLoading ? <div className="page-loading">Loading emails...</div> : (
        <div className="inbox-list">
          {messages.map((msg: { id: string; subject: string; sender: string; received_at: string; is_read: boolean; account: string; error?: string }) => (
            msg.error ? (
              <div key={msg.id || msg.account} className="inbox-error">⚠️ {msg.error}</div>
            ) : (
              <div key={msg.id} className={`inbox-row ${msg.is_read ? '' : 'unread'}`}>
                <div className="inbox-sender">{msg.sender}</div>
                <div className="inbox-subject">{msg.subject || '(no subject)'}</div>
                <div className="inbox-meta">
                  <span className="inbox-account">{msg.account}</span>
                  <span className="inbox-date">{msg.received_at}</span>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
