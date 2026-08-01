import { apiClient } from './client';
import type { Note, CreateNotePayload } from '../types';

export const notesApi = {
  /** GET /api/leads/:leadId/notes */
  getAll(leadId: number): Promise<Note[]> {
    return apiClient.get<Note[]>(`/api/leads/${leadId}/notes`).then((r) => r.data);
  },

  /** POST /api/leads/:leadId/notes */
  create(leadId: number, payload: CreateNotePayload): Promise<Note> {
    return apiClient
      .post<Note>(`/api/leads/${leadId}/notes`, payload)
      .then((r) => r.data);
  },
};
