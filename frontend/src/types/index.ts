export interface Lead {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  website?: string
  linkedin_url?: string
  source: string
  status: 'new' | 'contacted' | 'qualified' | 'won' | 'lost'
  score?: number
  notes?: string
  created_at: string
  updated_at: string
  lead_notes?: LeadNote[]
}

export interface LeadNote {
  id: string
  content: string
  source: string
  created_at: string
}

export interface ApprovalItem {
  id: string
  type: 'email_send' | 'social_post' | 'lead_create' | 'lead_update'
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  title: string
  description?: string
  payload: Record<string, unknown>
  reference_id?: string
  reviewed_at?: string
  reviewer_note?: string
  created_at: string
}

export interface SocialPost {
  id: string
  platform: 'instagram' | 'twitter' | 'tiktok' | 'linkedin' | 'facebook'
  content: string
  hashtags: string[]
  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'failed'
  approval_item_id?: string
  scheduled_for?: string
  posted_at?: string
  created_at: string
}

export interface EmailAccount {
  id: string
  provider: 'gmail' | 'outlook'
  email_address: string
  display_name?: string
  is_active: boolean
  created_at: string
}

export interface EmailMessage {
  id: string
  subject: string
  sender: string
  received_at: string
  is_read: boolean
  account: string
  error?: string
}

export interface DashboardStats {
  leads: { total: number; new: number; contacted: number; qualified: number; won: number; lost: number }
  approvals: { pending: number; total: number }
  social: { drafts: number; pending_approval: number; posted: number }
  email: { connected_accounts: number }
}

export type AgentEvent =
  | { type: 'text'; content: string }
  | { type: 'text_delta'; content: string }
  | { type: 'tool_start'; tool: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; result: unknown }
  | { type: 'approval_created'; approval_id: string; title: string }
  | { type: 'done' }
  | { type: 'error'; message: string }
