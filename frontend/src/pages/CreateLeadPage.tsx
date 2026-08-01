import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leads';
import { useToast } from '../context/ToastContext';
import type { CreateLeadPayload, LeadPriority, LeadSource, LeadStatus } from '../types';
import { LEAD_STATUSES, LEAD_PRIORITIES, LEAD_SOURCES, STATUS_LABELS, PRIORITY_LABELS, SOURCE_LABELS } from '../types';

interface FormErrors { name?: string; email?: string; phone?: string; score?: string; dealValue?: string; }

function validate(data: CreateLeadPayload): FormErrors {
  const e: FormErrors = {};
  if (!data.name.trim())  e.name  = 'Full name is required';
  if (!data.email.trim()) { e.email = 'Email is required'; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) { e.email = 'Enter a valid email address'; }
  if (data.phone && !/^[+\d\s\-().]{7,20}$/.test(data.phone)) { e.phone = 'Enter a valid phone number'; }
  if (data.score !== undefined && (data.score < 0 || data.score > 100)) { e.score = 'Score must be 0–100'; }
  if (data.dealValue !== undefined && data.dealValue < 0) { e.dealValue = 'Deal value must be positive'; }
  return e;
}

export default function CreateLeadPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [form, setForm] = useState<CreateLeadPayload>({
    name: '', email: '', phone: '', status: 'new', priority: 'medium',
    score: 0, dealValue: 0, tags: [], pinned: false,
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors]   = useState<FormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof CreateLeadPayload, boolean>>>({});

  const mutation = useMutation({
    mutationFn: leadsApi.create,
    onSuccess: (lead) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast(`Lead "${lead.name}" created successfully`);
      navigate(`/leads/${lead.id}`);
    },
    onError: (err: any) => toast(err?.response?.data?.message ?? 'Failed to create lead', 'error'),
  });

  const set = (field: keyof CreateLeadPayload, value: unknown) => {
    const next = { ...form, [field]: value };
    setForm(next as CreateLeadPayload);
    if (touched[field]) {
      const e = validate(next as CreateLeadPayload);
      setErrors(prev => ({ ...prev, [field]: e[field as keyof FormErrors] }));
    }
  };

  const blur = (field: keyof CreateLeadPayload) => {
    setTouched(t => ({ ...t, [field]: true }));
    const e = validate(form);
    setErrors(prev => ({ ...prev, [field]: e[field as keyof FormErrors] }));
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags?.includes(t)) {
      set('tags', [...(form.tags ?? []), t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => set('tags', (form.tags ?? []).filter(t => t !== tag));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, phone: true, score: true, dealValue: true });
    const errs = validate(form);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    const payload: CreateLeadPayload = {
      name: form.name.trim(), email: form.email.trim(), status: form.status,
      priority: form.priority, source: form.source || undefined,
      score: form.score ?? 0, dealValue: form.dealValue ?? 0,
      tags: form.tags ?? [], pinned: form.pinned ?? false,
    };
    if (form.phone?.trim()) payload.phone = form.phone.trim();
    mutation.mutate(payload);
  };

  return (
    <div className="page page-narrow">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Leads</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
        <span>New Lead</span>
      </nav>
      <div className="page-header">
        <div><h1 className="page-title">Create New Lead</h1><p className="page-subtitle">Add a prospect to your pipeline</p></div>
      </div>

      <div className="card">
        {mutation.isError && (
          <div className="card-body" style={{ paddingBottom: 0 }}>
            <div className="alert alert-error" role="alert">
              {(mutation.error as any)?.response?.data?.message ?? 'Failed to create lead.'}
            </div>
          </div>
        )}
        <div className="card-body">
          <form onSubmit={handleSubmit} noValidate>
            {/* Contact */}
            <div className="form-section">
              <h3 className="form-section-title">Contact Information</h3>
              <div className="form-grid">
                <div className={`form-group ${errors.name ? 'form-group--error' : ''}`}>
                  <label htmlFor="name" className="form-label">Full Name <span className="required">*</span></label>
                  <input id="name" type="text" value={form.name} onChange={e => set('name', e.target.value)} onBlur={() => blur('name')} placeholder="Jane Doe" aria-invalid={!!errors.name} autoFocus />
                  {errors.name && <span className="field-error" role="alert">{errors.name}</span>}
                </div>
                <div className={`form-group ${errors.email ? 'form-group--error' : ''}`}>
                  <label htmlFor="email" className="form-label">Email <span className="required">*</span></label>
                  <input id="email" type="email" value={form.email} onChange={e => set('email', e.target.value)} onBlur={() => blur('email')} placeholder="jane@example.com" aria-invalid={!!errors.email} />
                  {errors.email && <span className="field-error" role="alert">{errors.email}</span>}
                </div>
                <div className={`form-group ${errors.phone ? 'form-group--error' : ''}`}>
                  <label htmlFor="phone" className="form-label">Phone</label>
                  <input id="phone" type="tel" value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} onBlur={() => blur('phone')} placeholder="+1-555-0100" />
                  {errors.phone && <span className="field-error" role="alert">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label htmlFor="source" className="form-label">Lead Source</label>
                  <select id="source" value={form.source ?? ''} onChange={e => set('source', e.target.value as LeadSource || undefined)} className="select">
                    <option value="">Select source…</option>
                    {LEAD_SOURCES.map(s => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Pipeline */}
            <div className="form-section">
              <h3 className="form-section-title">Pipeline Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select id="status" value={form.status} onChange={e => set('status', e.target.value as LeadStatus)} className="select">
                    {LEAD_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <select id="priority" value={form.priority} onChange={e => set('priority', e.target.value as LeadPriority)} className="select">
                    {LEAD_PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </div>
                <div className={`form-group ${errors.score ? 'form-group--error' : ''}`}>
                  <label htmlFor="score" className="form-label">Lead Score (0–100)</label>
                  <input id="score" type="number" min={0} max={100} value={form.score ?? 0} onChange={e => set('score', Number(e.target.value))} onBlur={() => blur('score')} />
                  {errors.score && <span className="field-error" role="alert">{errors.score}</span>}
                </div>
                <div className={`form-group ${errors.dealValue ? 'form-group--error' : ''}`}>
                  <label htmlFor="dealValue" className="form-label">Expected Deal Value ($)</label>
                  <input id="dealValue" type="number" min={0} value={form.dealValue ?? 0} onChange={e => set('dealValue', Number(e.target.value))} onBlur={() => blur('dealValue')} placeholder="0" />
                  {errors.dealValue && <span className="field-error" role="alert">{errors.dealValue}</span>}
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="form-section">
              <h3 className="form-section-title">Tags</h3>
              <div className="tag-input-row">
                <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add tag and press Enter…" className="tag-input" />
                <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
              </div>
              {(form.tags ?? []).length > 0 && (
                <div className="tags-list">
                  {form.tags!.map(t => (
                    <span key={t} className="tag tag--removable">
                      {t}
                      <button type="button" onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="checkbox-label">
                <input type="checkbox" checked={form.pinned ?? false} onChange={e => set('pinned', e.target.checked)} />
                <span>Pin this lead</span>
              </label>
            </div>

            <div className="form-actions">
              <Link to="/" className="btn btn-secondary">Cancel</Link>
              <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? <><span className="btn-spinner" aria-hidden="true" /> Creating…</> : <>+ Create Lead</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
