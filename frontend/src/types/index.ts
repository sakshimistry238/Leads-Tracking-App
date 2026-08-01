export type LeadStatus   = 'new' | 'contacted' | 'qualified' | 'lost';
export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LeadSource   = 'website' | 'linkedin' | 'cold_call' | 'referral' | 'email' | 'event' | 'other';

export interface StageHistoryEntry {
  from: string;
  to: string;
  changedAt: string;
  reason?: string;
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource | null;
  score: number;
  dealValue: number;
  tags: string[];
  pinned: boolean;
  stageHistory: StageHistoryEntry[];
  createdAt: string;
  notes?: Note[];
}

export interface Note {
  id: number;
  leadId: number;
  content: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateLeadPayload {
  name: string;
  email: string;
  phone?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  source?: LeadSource;
  score?: number;
  dealValue?: number;
  tags?: string[];
  pinned?: boolean;
}

export interface UpdateLeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  status?: LeadStatus;
  priority?: LeadPriority;
  source?: LeadSource;
  score?: number;
  dealValue?: number;
  tags?: string[];
  pinned?: boolean;
  statusChangeReason?: string;
}

export interface CreateNotePayload { content: string; }

export interface LeadsQuery {
  search?: string;
  status?: LeadStatus | '';
  priority?: LeadPriority | '';
  source?: LeadSource | '';
  tag?: string;
  pinned?: boolean;
  page?: number;
  limit?: number;
}

export interface AnalyticsSummary {
  total: number;
  byStatus: Record<LeadStatus, number>;
  bySource: Record<string, number>;
  byPriority: Record<string, number>;
  totalDealValue: number;
  qualifiedDealValue: number;
  winRate: number;
  leadsOverTime: { date: string; count: number }[];
}

export type SortDir     = 'asc' | 'desc';
export type LeadSortKey = keyof Pick<Lead, 'name' | 'email' | 'status' | 'createdAt' | 'score' | 'dealValue' | 'priority'>;

export const LEAD_STATUSES:   LeadStatus[]   = ['new', 'contacted', 'qualified', 'lost'];
export const LEAD_PRIORITIES: LeadPriority[] = ['low', 'medium', 'high', 'urgent'];
export const LEAD_SOURCES:    LeadSource[]   = ['website', 'linkedin', 'cold_call', 'referral', 'email', 'event', 'other'];

export const STATUS_LABELS: Record<LeadStatus, string>     = { new: 'New', contacted: 'Contacted', qualified: 'Qualified', lost: 'Lost' };
export const PRIORITY_LABELS: Record<LeadPriority, string> = { low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' };
export const SOURCE_LABELS: Record<LeadSource, string>     = { website: 'Website', linkedin: 'LinkedIn', cold_call: 'Cold Call', referral: 'Referral', email: 'Email', event: 'Event', other: 'Other' };
