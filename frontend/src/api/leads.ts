import { apiClient } from './client';
import type { AnalyticsSummary, CreateLeadPayload, Lead, LeadsQuery, PaginatedResponse, UpdateLeadPayload } from '../types';

export interface ImportRowResult {
  row: number;
  name: string;
  email: string;
  status: 'created' | 'skipped' | 'error';
  reason?: string;
}

export interface BulkImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: number;
  results: ImportRowResult[];
}

export const leadsApi = {
  getAll(query: LeadsQuery = {}): Promise<PaginatedResponse<Lead>> {
    const params: Record<string, string | number | boolean> = {};
    if (query.search)   params.search   = query.search;
    if (query.status)   params.status   = query.status;
    if (query.priority) params.priority = query.priority;
    if (query.source)   params.source   = query.source;
    if (query.tag)      params.tag      = query.tag;
    if (query.pinned !== undefined) params.pinned = query.pinned;
    if (query.page)     params.page     = query.page;
    if (query.limit)    params.limit    = query.limit;
    return apiClient.get<PaginatedResponse<Lead>>('/api/leads', { params }).then(r => r.data);
  },

  getOne(id: number): Promise<Lead> {
    return apiClient.get<Lead>(`/api/leads/${id}`).then(r => r.data);
  },

  create(payload: CreateLeadPayload): Promise<Lead> {
    return apiClient.post<Lead>('/api/leads', payload).then(r => r.data);
  },

  update(id: number, payload: UpdateLeadPayload): Promise<Lead> {
    return apiClient.patch<Lead>(`/api/leads/${id}`, payload).then(r => r.data);
  },

  remove(id: number): Promise<void> {
    return apiClient.delete(`/api/leads/${id}`).then(() => undefined);
  },

  togglePin(id: number, pinned: boolean): Promise<Lead> {
    return apiClient.patch<Lead>(`/api/leads/${id}`, { pinned }).then(r => r.data);
  },

  getAnalytics(): Promise<AnalyticsSummary> {
    return apiClient.get<AnalyticsSummary>('/api/analytics/summary').then(r => r.data);
  },

  /** Returns the URL for downloading the current view as a styled Excel (.xlsx) file */
  getExportUrl(query: LeadsQuery = {}): string {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.status) params.set('status', query.status);
    if (query.tag)    params.set('tag',    query.tag);
    const qs = params.toString();
    const base = (import.meta.env.VITE_API_URL ?? '');
    return `${base}/api/leads/export${qs ? '?' + qs : ''}`;
  },

  /** Returns the URL for downloading the Excel import template */
  getTemplateUrl(): string {
    const base = (import.meta.env.VITE_API_URL ?? '');
    return `${base}/api/leads/import/template`;
  },

  /** Upload an .xlsx file and bulk-import leads */
  bulkImport(file: File): Promise<BulkImportResult> {
    const form = new FormData();
    form.append('file', file);
    return apiClient
      .post<BulkImportResult>('/api/leads/import', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data);
  },
};
