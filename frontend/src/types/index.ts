export interface Lead {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  website?: string
  linkedin_url?: string
  source: string
  status: 'new' | 'contacted' | 'meeting_booked' | 'client' | 'closed'
  service_interest?: string
  business_type?: string
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

export interface Campaign {
  id: string
  name: string
  client_id?: string
  client_name?: string
  client_company?: string
  platforms: string[]
  status: 'draft' | 'active' | 'paused' | 'completed'
  campaign_brief?: string
  start_date?: string
  end_date?: string
  budget?: string
  notes?: string
  post_count: number
  created_at: string
  updated_at: string
  posts?: CampaignPost[]
}

export interface CampaignPost {
  id: string
  platform: string
  content: string
  hashtags: string[]
  status: 'draft' | 'pending_approval' | 'approved' | 'posted' | 'failed'
  campaign_id?: string
  approval_item_id?: string
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

export interface EmailAccount {
  id: string
  email: string
  provider: string
  is_active: boolean
  created_at: string
}

export interface AgentEvent {
  type: string
  content?: string
  data?: unknown
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

export interface DashboardStats {
  leads: {
    total: number
    pipeline: {
      new: number
      contacted: number
      meeting_booked: number
      client: number
      closed: number
    }
  }
  approvals: { pending: number }
  campaigns: { active: number; total: number }
  posts: { pending: number; published: number }
  recent_leads: Array<{
    id: string
    name: string
    company?: string
    status: string
    service_interest?: string
    created_at: string
  }>
}
