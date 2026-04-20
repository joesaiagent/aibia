import client from './client'
import type { Lead, ApprovalItem, Campaign, DashboardStats } from '../types'

// Dashboard
export const getDashboardStats = () => client.get<DashboardStats>('/dashboard/stats').then(r => r.data)

// Leads
export const getLeads = (params?: { search?: string; status?: string }) =>
  client.get<Lead[]>('/leads', { params }).then(r => r.data)
export const getLead = (id: string) => client.get<Lead>(`/leads/${id}`).then(r => r.data)
export const createLead = (data: Partial<Lead>) => client.post<Lead>('/leads', data).then(r => r.data)
export const updateLead = (id: string, data: Partial<Lead>) => client.patch<Lead>(`/leads/${id}`, data).then(r => r.data)
export const deleteLead = (id: string) => client.delete(`/leads/${id}`).then(r => r.data)
export const addLeadNote = (id: string, content: string) => client.post(`/leads/${id}/notes`, { content }).then(r => r.data)
export const generateFollowup = (id: string) => client.post<{ email: string }>(`/leads/${id}/followup`).then(r => r.data)

// Campaigns
export const getCampaigns = () => client.get<Campaign[]>('/campaigns').then(r => r.data)
export const getCampaign = (id: string) => client.get<Campaign>(`/campaigns/${id}`).then(r => r.data)
export const createCampaign = (data: Partial<Campaign>) => client.post<Campaign>('/campaigns', data).then(r => r.data)
export const updateCampaign = (id: string, data: Partial<Campaign>) => client.patch<Campaign>(`/campaigns/${id}`, data).then(r => r.data)
export const deleteCampaign = (id: string) => client.delete(`/campaigns/${id}`).then(r => r.data)
export const generateCampaignPosts = (id: string) => client.post(`/campaigns/${id}/generate`).then(r => r.data)

// Approvals
export const getApprovals = (status = 'pending') => client.get<ApprovalItem[]>('/approvals', { params: { status } }).then(r => r.data)
export const getPendingCount = () => client.get<{ count: number }>('/approvals/count/pending').then(r => r.data)
export const approveItem = (id: string, note?: string) => client.post(`/approvals/${id}/approve`, { reviewer_note: note }).then(r => r.data)
export const rejectItem = (id: string, note?: string) => client.post(`/approvals/${id}/reject`, { reviewer_note: note }).then(r => r.data)

// Email
export const getEmailAccounts = () => client.get('/email/accounts').then(r => r.data)
export const initiateOAuth = (provider: string) => client.get('/email/oauth/initiate', { params: { provider } }).then(r => r.data)
export const disconnectEmailAccount = (id: string) => client.delete(`/email/accounts/${id}`).then(r => r.data)
