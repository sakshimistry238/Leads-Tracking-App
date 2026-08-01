import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leads';
import { notesApi } from '../api/notes';
import { useToast } from '../context/ToastContext';
import { useRecentLeads } from '../hooks/useRecentLeads';
import type { LeadStatus, UpdateLeadPayload } from '../types';
import { LEAD_STATUSES, LEAD_PRIORITIES, LEAD_SOURCES, STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from '../types';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import ConfirmModal from '../components/ConfirmModal';

// ── NotesSection sub-component ───────────────────────────────────────────────
function NotesSection({ leadId }: { leadId: number }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [content, setContent] = useState('');
  const [fieldError, setFieldError] = useState('');

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', leadId],
    queryFn: () => notesApi.getAll(leadId),
  });

  const addNote = useMutation({
    mutationFn: (text: string) => notesApi.create(leadId, { content: text }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', leadId] });
      setContent('');
      setFieldError('');
      toast('Note added');
    },
    onError: () => toast('Failed to add note', 'error'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) { setFieldError('Note content is required'); return; }
    addNote.mutate(content.trim());
  };

  return (
    <section className="card" aria-labelledby="notes-heading">
      <div className="card-header">
        <h2 id="notes-heading" className="card-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          Notes
          {notes.length > 0 && <span className="count-pill">{notes.length}</span>}
        </h2>
      </div>

      {/* Add note form */}
      <div className="card-body">
        <form onSubmit={handleSubmit} noValidate className="note-compose">
          <div className="form-group">
            <label htmlFor="note-content" className="form-label">Add a note</label>
            <textarea
              id="note-content"
              rows={3}
              placeholder="Write an observation, follow-up action, or reminder…"
              value={content}
              onChange={(e) => { setContent(e.target.value); if (fieldError) setFieldError(''); }}
              aria-describedby={fieldError ? 'note-error' : undefined}
              aria-invalid={!!fieldError}
            />
            {fieldError && <span id="note-error" className="field-error" role="alert">{fieldError}</span>}
          </div>
          <div className="note-compose-footer">
            {addNote.isError && (
              <span className="field-error">{(addNote.error as Error)?.message ?? 'Failed to add note.'}</span>
            )}
            <button type="submit" className="btn btn-primary btn-sm" disabled={addNote.isPending}>
              {addNote.isPending ? 'Adding…' : 'Add note'}
            </button>
          </div>
        </form>
      </div>

      {/* Notes list */}
      <div className="notes-divider" />
      {isLoading && <div className="card-body"><Spinner size="sm" label="Loading notes…" /></div>}
      {!isLoading && notes.length === 0 && (
        <div className="card-body">
          <div className="notes-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <p>No notes yet. Be the first to add context about this lead.</p>
          </div>
        </div>
      )}
      {!isLoading && notes.length > 0 && (
        <ul className="notes-list" aria-label="Lead notes">
          {notes.map((note, i) => (
            <li key={note.id} className="note-item">
              <div className="note-item-header">
                <div className="note-avatar" aria-hidden="true">{i + 1}</div>
                <time dateTime={note.createdAt} className="note-time">
                  {new Date(note.createdAt).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </time>
              </div>
              <p className="note-content">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ── EditForm sub-component ───────────────────────────────────────────────────
interface EditFormProps {
  initial: UpdateLeadPayload;
  isPending: boolean;
  isError: boolean;
  errorMessage?: string;
  onSave: (payload: UpdateLeadPayload) => void;
  onCancel: () => void;
}

function EditForm({ initial, isPending, isError, errorMessage, onSave, onCancel }: EditFormProps) {
  const [form, setForm]           = useState<UpdateLeadPayload>(initial);
  const [tagInput, setTagInput]   = useState('');
  const [showReason, setShowReason] = useState(false);

  const set = <K extends keyof UpdateLeadPayload>(field: K, value: UpdateLeadPayload[K]) =>
    setForm(f => ({ ...f, [field]: value }));

  // Show reason field only when status is changing
  const statusChanged = form.status !== initial.status;

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !(form.tags ?? []).includes(t)) set('tags', [...(form.tags ?? []), t]);
    setTagInput('');
  };
  const removeTag = (tag: string) => set('tags', (form.tags ?? []).filter(t => t !== tag));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const payload = { ...form };
    if (!statusChanged) delete payload.statusChangeReason;
    onSave(payload);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="edit-form">
      <div className="edit-form-header">
        <h2>Edit Lead</h2>
        <p className="text-muted" style={{ fontSize: 13, marginTop: 2 }}>
          All changes are saved immediately after clicking Save.
        </p>
      </div>

      {isError && (
        <div className="alert alert-error" role="alert">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {errorMessage ?? 'Update failed. Please try again.'}
        </div>
      )}

      {/* ── Contact ──────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">Contact</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="edit-name" className="form-label">Full Name <span className="required">*</span></label>
            <input id="edit-name" type="text" value={form.name ?? ''} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-email" className="form-label">Email <span className="required">*</span></label>
            <input id="edit-email" type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} required />
          </div>
          <div className="form-group">
            <label htmlFor="edit-phone" className="form-label">Phone</label>
            <input id="edit-phone" type="tel" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+1-555-0100" />
          </div>
          <div className="form-group">
            <label htmlFor="edit-source" className="form-label">Lead Source</label>
            <select id="edit-source" value={form.source ?? ''} onChange={e => set('source', e.target.value as UpdateLeadPayload['source'] || undefined)} className="select">
              <option value="">No source</option>
              {LEAD_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── Pipeline ─────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">Pipeline</h3>
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="edit-status" className="form-label">Status</label>
            <select
              id="edit-status"
              value={form.status ?? ''}
              onChange={e => { set('status', e.target.value as LeadStatus); setShowReason(true); }}
              className="select"
            >
              {LEAD_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-priority" className="form-label">Priority</label>
            <select id="edit-priority" value={form.priority ?? ''} onChange={e => set('priority', e.target.value as UpdateLeadPayload['priority'])} className="select">
              {LEAD_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edit-score" className="form-label">Lead Score (0–100)</label>
            <input
              id="edit-score"
              type="number"
              min={0} max={100}
              value={form.score ?? 0}
              onChange={e => set('score', Number(e.target.value))}
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-dealValue" className="form-label">Deal Value ($)</label>
            <input
              id="edit-dealValue"
              type="number"
              min={0}
              value={form.dealValue ?? 0}
              onChange={e => set('dealValue', Number(e.target.value))}
            />
          </div>
        </div>

        {/* Status change reason — only shown when status has changed */}
        {(statusChanged || showReason) && (
          <div className="form-group" style={{ marginTop: 12 }}>
            <label htmlFor="edit-reason" className="form-label">
              Reason for status change
              <span className="text-muted" style={{ fontWeight: 400, marginLeft: 4 }}>(optional)</span>
            </label>
            <input
              id="edit-reason"
              type="text"
              value={form.statusChangeReason ?? ''}
              onChange={e => set('statusChangeReason', e.target.value)}
              placeholder="e.g. Budget confirmed, Not interested…"
            />
          </div>
        )}
      </div>

      {/* ── Tags ─────────────────────────────────────────── */}
      <div className="form-section">
        <h3 className="form-section-title">Tags</h3>
        <div className="tag-input-row">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
            placeholder="Type a tag and press Enter…"
            className="tag-input"
          />
          <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
        </div>
        {(form.tags ?? []).length > 0 && (
          <div className="tags-list" style={{ marginTop: 8 }}>
            {(form.tags ?? []).map(t => (
              <span key={t} className="tag tag--removable">
                {t}
                <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>✕</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Pin ──────────────────────────────────────────── */}
      <div className="form-group" style={{ marginBottom: 4 }}>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.pinned ?? false}
            onChange={e => set('pinned', e.target.checked)}
          />
          <span>Pin this lead (shows in sidebar)</span>
        </label>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={isPending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? (
            <><span className="btn-spinner" aria-hidden="true" /> Saving…</>
          ) : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const leadId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing]         = useState(false);
  const [showDeleteModal, setShowDelete]  = useState(false);
  const { toast } = useToast();
  const { push: pushRecent } = useRecentLeads();

  // ── queries ───────────────────────────────────────────────────────────────
  const { data: lead, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['lead', leadId],
    queryFn: () => leadsApi.getOne(leadId),
    enabled: !isNaN(leadId),
    retry: (count, err: any) => err?.response?.status !== 404 && count < 2,
  });

  // Push to recent leads whenever lead loads
  useEffect(() => {
    if (lead) pushRecent({ id: lead.id, name: lead.name });
  }, [lead?.id, lead?.name]);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── mutations ─────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: (payload: UpdateLeadPayload) => leadsApi.update(leadId, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['lead', leadId], updated);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pinned'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      setIsEditing(false);
      toast('Lead updated');
    },
    onError: (err: any) => toast(err?.response?.data?.message ?? 'Update failed', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => leadsApi.remove(leadId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast('Lead deleted');
      navigate('/');
    },
    onError: () => toast('Failed to delete lead', 'error'),
  });

  const pinMutation = useMutation({
    mutationFn: (pinned: boolean) => leadsApi.togglePin(leadId, pinned),
    onSuccess: (updated) => {
      queryClient.setQueryData(['lead', leadId], updated);
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pinned'] });
      toast(updated.pinned ? 'Lead pinned ★' : 'Lead unpinned');
    },
  });

  // ── edge cases ────────────────────────────────────────────────────────────
  if (isNaN(leadId)) {
    return (
      <div className="page page-narrow">
        <ErrorMessage message="Invalid lead ID in the URL." />
        <Link to="/" className="btn btn-secondary mt-4">← Back to Leads</Link>
      </div>
    );
  }

  if (isLoading) return (
    <div className="page"><Spinner label="Loading lead…" /></div>
  );

  if (isError) {
    const is404 = (error as any)?.response?.status === 404;
    return (
      <div className="page page-narrow">
        <div className="not-found-block">
          <div className="not-found-icon" aria-hidden="true">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </div>
          <h1>{is404 ? 'Lead not found' : 'Something went wrong'}</h1>
          <p className="text-muted">
            {is404
              ? "This lead doesn't exist or may have been deleted."
              : (error as Error)?.message ?? 'Failed to load lead.'}
          </p>
          <div className="not-found-actions">
            {!is404 && (
              <button className="btn btn-secondary" onClick={() => refetch()}>Try again</button>
            )}
            <Link to="/" className="btn btn-primary">← Back to Leads</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  return (
    <div className="page">
      {/* ── Breadcrumb ──────────────────────────────────── */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Leads</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        <span>{lead.name}</span>
      </nav>

      <div className="detail-layout">
        {/* ── Left column: lead card ─────────────────── */}
        <div className="detail-main">
          <div className="card">
            {!isEditing ? (
              <>
                <div className="card-header detail-card-head">
                  <div className="lead-identity">
                    <div className="lead-avatar" aria-hidden="true">
                      {lead.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h1 className="lead-name">{lead.name}</h1>
                      <StatusBadge status={lead.status} />
                    </div>
                  </div>
                  <div className="detail-card-actions">
                    <button
                      className={`btn btn-sm ${lead.pinned ? 'btn-pin-active' : 'btn-secondary'}`}
                      onClick={() => pinMutation.mutate(!lead.pinned)}
                      disabled={pinMutation.isPending}
                      title={lead.pinned ? 'Unpin lead' : 'Pin lead'}
                    >
                      {lead.pinned ? '★ Pinned' : '☆ Pin'}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                    <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M9 6V4h6v2"/>
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>

                <div className="card-body">
                  <div className="lead-info-grid">
                    <div className="lead-info-item">
                      <span className="lead-info-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                          <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        Email
                      </span>
                      <a href={`mailto:${lead.email}`} className="lead-info-value link-primary">
                        {lead.email}
                      </a>
                    </div>
                    <div className="lead-info-item">
                      <span className="lead-info-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        Phone
                      </span>
                      <span className="lead-info-value">
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="link-primary">{lead.phone}</a>
                        ) : (
                          <span className="text-light">Not provided</span>
                        )}
                      </span>
                    </div>
                    <div className="lead-info-item">
                      <span className="lead-info-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                        </svg>
                        Created
                      </span>
                      <span className="lead-info-value">
                        {new Date(lead.createdAt).toLocaleString('en-US', {
                          month: 'long', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <div className="lead-info-item">
                      <span className="lead-info-label">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                        Status
                      </span>
                      <span className="lead-info-value"><StatusBadge status={lead.status} /></span>
                    </div>
                  </div>

                  {/* Extended fields row */}
                  <div className="lead-ext-row">
                    <div className="lead-ext-item">
                      <span className="lead-info-label">Priority</span>
                      <span className={`priority-badge priority-${lead.priority}`}>{PRIORITY_LABELS[lead.priority]}</span>
                    </div>
                    <div className="lead-ext-item">
                      <span className="lead-info-label">Source</span>
                      <span className="lead-info-value">{lead.source ? SOURCE_LABELS[lead.source] : <span className="text-light">—</span>}</span>
                    </div>
                    <div className="lead-ext-item">
                      <span className="lead-info-label">Score</span>
                      <span className="lead-info-value">
                        <span className="score-badge inline"><span className="score-bar" style={{ width: `${lead.score}%` }} aria-hidden="true" /><span className="score-val">{lead.score}</span></span>
                      </span>
                    </div>
                    <div className="lead-ext-item">
                      <span className="lead-info-label">Deal Value</span>
                      <span className="lead-info-value">
                        {lead.dealValue > 0
                          ? new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(lead.dealValue)
                          : <span className="text-light">—</span>}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  {lead.tags.length > 0 && (
                    <div className="lead-tags-row">
                      <span className="lead-info-label">Tags</span>
                      <div className="tags-list" style={{ marginTop: 4 }}>
                        {lead.tags.map(t => <span key={t} className="tag">{t}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="card-body">
                <EditForm
                  initial={{
                    name:      lead.name,
                    email:     lead.email,
                    phone:     lead.phone ?? '',
                    status:    lead.status,
                    priority:  lead.priority,
                    source:    lead.source ?? undefined,
                    score:     lead.score,
                    dealValue: lead.dealValue,
                    tags:      [...lead.tags],
                    pinned:    lead.pinned,
                  }}
                  isPending={updateMutation.isPending}
                  isError={updateMutation.isError}
                  errorMessage={(updateMutation.error as Error)?.message}
                  onSave={(payload) => updateMutation.mutate(payload)}
                  onCancel={() => setIsEditing(false)}
                />
              </div>
            )}
          </div>

          {/* ── Notes ───────────────────────────────────── */}
          <NotesSection leadId={leadId} />
        </div>

        {/* ── Right column: activity + quick actions ──── */}
        <aside className="detail-sidebar">
          {/* Stage history / activity timeline */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
                Activity
              </h3>
            </div>
            <div className="card-body" style={{ padding: '16px 20px' }}>
              <ol className="timeline" aria-label="Stage history">
                {/* Created entry always first */}
                <li className="timeline-item">
                  <div className="timeline-dot timeline-dot--created" />
                  <div className="timeline-body">
                    <p className="timeline-label">Lead created</p>
                    <time className="timeline-time">
                      {new Date(lead.createdAt).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </time>
                  </div>
                </li>

                {/* Stage changes, oldest → newest */}
                {lead.stageHistory.map((entry, i) => (
                  <li key={i} className="timeline-item">
                    <div className={`timeline-dot timeline-dot--${entry.to}`} />
                    <div className="timeline-body">
                      <p className="timeline-label">
                        <span className="timeline-from">{STATUS_LABELS[entry.from as LeadStatus] ?? entry.from}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" style={{ display:'inline',margin:'0 4px',verticalAlign:'middle' }}>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                          <polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <span className="timeline-to">{STATUS_LABELS[entry.to as LeadStatus] ?? entry.to}</span>
                      </p>
                      {entry.reason && (
                        <p className="timeline-reason">"{entry.reason}"</p>
                      )}
                      <time className="timeline-time">
                        {new Date(entry.changedAt).toLocaleString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </li>
                ))}

                {/* Current status cap */}
                <li className="timeline-item timeline-item--current">
                  <div className={`timeline-dot timeline-dot--${lead.status}`} />
                  <div className="timeline-body">
                    <p className="timeline-label">Current status</p>
                    <StatusBadge status={lead.status} size="sm" />
                  </div>
                </li>
              </ol>
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
            </div>
            <div className="card-body card-body--actions">
              <a href={`mailto:${lead.email}`} className="btn btn-secondary btn-block">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                Send Email
              </a>
              {lead.phone && (
                <a href={`tel:${lead.phone}`} className="btn btn-secondary btn-block">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.56 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                  </svg>
                  Call
                </a>
              )}
              <button
                className="btn btn-secondary btn-block"
                onClick={() => setIsEditing(true)}
                disabled={isEditing}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Edit Lead
              </button>
              <button
                className={`btn btn-block ${lead.pinned ? 'btn-pin-active' : 'btn-secondary'}`}
                onClick={() => pinMutation.mutate(!lead.pinned)}
                disabled={pinMutation.isPending}
              >
                {lead.pinned ? '★ Unpin lead' : '☆ Pin lead'}
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* ── Delete confirm modal ─────────────────────── */}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete this lead?"
          description={`"${lead.name}" and all their notes will be permanently removed. This action cannot be undone.`}
          confirmLabel="Yes, delete"
          isPending={deleteMutation.isPending}
          isError={deleteMutation.isError}
          errorMessage={(deleteMutation.error as Error)?.message}
          onConfirm={() => deleteMutation.mutate()}
          onCancel={() => setShowDelete(false)}
          variant="danger"
        />
      )}
    </div>
  );
}
