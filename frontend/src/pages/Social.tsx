import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSocialPosts, createSocialPost, deleteSocialPost } from '../api'
import './Social.css'

const PLATFORMS = ['instagram', 'twitter', 'tiktok', 'linkedin', 'facebook']
const PLATFORM_ICONS: Record<string, string> = {
  instagram: '📸', twitter: '🐦', tiktok: '🎵', linkedin: '💼', facebook: '👥',
}
const STATUS_COLORS: Record<string, string> = {
  draft: '#555', pending_approval: '#fbbf24', approved: '#4ade80', posted: '#7c6ff7', failed: '#f87171',
}

export default function Social() {
  const [platform, setPlatform] = useState('')
  const [showForm, setShowForm] = useState(false)
  const qc = useQueryClient()

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['social-posts', platform],
    queryFn: () => getSocialPosts({ platform: platform || undefined }),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSocialPost,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['social-posts'] }),
  })

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h1>Social Media</h1>
          <p>Manage posts across all platforms</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(true)}>+ Draft Post</button>
      </div>

      <div className="platform-tabs">
        <button className={`platform-tab ${!platform ? 'active' : ''}`} onClick={() => setPlatform('')}>All</button>
        {PLATFORMS.map(p => (
          <button key={p} className={`platform-tab ${platform === p ? 'active' : ''}`} onClick={() => setPlatform(p)}>
            {PLATFORM_ICONS[p]} {p}
          </button>
        ))}
      </div>

      {isLoading ? <div className="page-loading">Loading...</div> : (
        <div className="posts-grid">
          {posts.length === 0 ? (
            <div className="empty-state">
              <p>No posts yet. Draft one manually or ask the agent to create social content.</p>
            </div>
          ) : posts.map(post => (
            <div key={post.id} className="post-card">
              <div className="post-card-header">
                <span className="post-platform">{PLATFORM_ICONS[post.platform]} {post.platform}</span>
                <span className="post-status" style={{ color: STATUS_COLORS[post.status] }}>{post.status.replace('_', ' ')}</span>
              </div>
              <p className="post-content">{post.content}</p>
              {post.hashtags.length > 0 && (
                <div className="post-hashtags">{post.hashtags.map(h => <span key={h} className="hashtag">#{h}</span>)}</div>
              )}
              <div className="post-footer">
                <span className="post-date">{new Date(post.created_at).toLocaleDateString()}</span>
                <button className="btn-danger-sm" onClick={() => deleteMutation.mutate(post.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <PostForm
          onSave={data => { createSocialPost(data).then(() => { qc.invalidateQueries({ queryKey: ['social-posts'] }); setShowForm(false) }) }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}

function PostForm({ onSave, onClose }: { onSave: (d: { platform: string; content: string; hashtags?: string[] }) => void; onClose: () => void }) {
  const [platform, setPlatform] = useState('instagram')
  const [content, setContent] = useState('')
  const [hashtags, setHashtags] = useState('')

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Draft Post</h2>
        <label>
          <span>Platform</span>
          <select value={platform} onChange={e => setPlatform(e.target.value)}>
            {PLATFORMS.map(p => <option key={p} value={p}>{PLATFORM_ICONS[p]} {p}</option>)}
          </select>
        </label>
        <label>
          <span>Content</span>
          <textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="Write your post..." />
        </label>
        <label>
          <span>Hashtags (comma-separated)</span>
          <input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="smallbusiness, marketing, growth" />
        </label>
        <div className="modal-actions">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => onSave({ platform, content, hashtags: hashtags.split(',').map(h => h.trim()).filter(Boolean) })} disabled={!content.trim()}>
            Queue for Approval
          </button>
        </div>
      </div>
    </div>
  )
}
