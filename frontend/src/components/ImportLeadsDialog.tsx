import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, type BulkImportResult } from '../api/leads';
import { useToast } from '../context/ToastContext';

interface Props {
  onClose: () => void;
}

type Step = 'idle' | 'uploading' | 'done';

export default function ImportLeadsDialog({ onClose }: Props) {
  const queryClient  = useQueryClient();
  const { toast }    = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep]             = useState<Step>('idle');
  const [dragging, setDragging]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult]         = useState<BulkImportResult | null>(null);
  const [fileError, setFileError]   = useState('');

  // ── mutation ───────────────────────────────────────────────────────────────
  const importMutation = useMutation({
    mutationFn: (file: File) => leadsApi.bulkImport(file),
    onSuccess: (data) => {
      setResult(data);
      setStep('done');
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      if (data.created > 0) {
        toast(`Imported ${data.created} lead${data.created !== 1 ? 's' : ''} successfully`);
      }
    },
    onError: (err: any) => {
      setStep('idle');
      setFileError(err?.response?.data?.message ?? 'Import failed. Please try again.');
    },
  });

  // ── file handling ──────────────────────────────────────────────────────────
  const validateAndSet = (file: File) => {
    setFileError('');
    if (!file.name.endsWith('.xlsx')) {
      setFileError('Only .xlsx files are supported. Please use the provided template.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File is too large. Maximum size is 5 MB.');
      return;
    }
    setSelectedFile(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) validateAndSet(file);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    setStep('uploading');
    importMutation.mutate(selectedFile);
  };

  const handleReset = () => {
    setStep('idle');
    setResult(null);
    setSelectedFile(null);
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-title"
      onClick={e => { if (e.target === e.currentTarget && step !== 'uploading') onClose(); }}
    >
      <div className="import-dialog">

        {/* ── Header ──────────────────────────────────────── */}
        <div className="import-dialog-header">
          <div className="import-dialog-title-row">
            <div className="import-dialog-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <h2 id="import-title" className="import-dialog-title">Import Leads</h2>
              <p className="import-dialog-sub">Upload an Excel file to bulk-add leads to your pipeline</p>
            </div>
          </div>
          {step !== 'uploading' && (
            <button className="import-close-btn" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* ── Step: idle / select file ─────────────────────── */}
        {step === 'idle' && (
          <div className="import-dialog-body">

            {/* Template download */}
            <div className="import-template-box">
              <div className="import-template-info">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
                <div>
                  <p className="import-template-title">Download Excel Template</p>
                  <p className="import-template-desc">
                    Includes 5 sample rows, column dropdowns, and instructions sheet.
                  </p>
                </div>
              </div>
              <a
                href={leadsApi.getTemplateUrl()}
                download="leads_import_template.xlsx"
                className="btn btn-secondary btn-sm"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Download
              </a>
            </div>

            <div className="import-divider">
              <span>then upload your completed file</span>
            </div>

            {/* Drop zone */}
            <div
              className={`import-dropzone ${dragging ? 'import-dropzone--active' : ''} ${selectedFile ? 'import-dropzone--has-file' : ''}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Click or drag to upload an Excel file"
              onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileChange}
                className="sr-only"
                aria-label="Upload Excel file"
              />

              {selectedFile ? (
                <div className="import-file-selected">
                  <div className="import-file-icon" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div>
                    <p className="import-file-name">{selectedFile.name}</p>
                    <p className="import-file-size">
                      {(selectedFile.size / 1024).toFixed(1)} KB — click to change
                    </p>
                  </div>
                  <div className="import-file-check" aria-hidden="true">✓</div>
                </div>
              ) : (
                <div className="import-dropzone-placeholder">
                  <div className="import-dropzone-icon" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <p className="import-dropzone-label">
                    <strong>Click to browse</strong> or drag & drop your file here
                  </p>
                  <p className="import-dropzone-hint">.xlsx only — max 5 MB — up to 500 rows</p>
                </div>
              )}
            </div>

            {fileError && (
              <div className="alert alert-error" role="alert">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {fileError}
              </div>
            )}

            {/* Format guide */}
            <details className="import-guide">
              <summary className="import-guide-toggle">Required column format</summary>
              <div className="import-guide-body">
                <table className="import-guide-table">
                  <thead>
                    <tr><th>Column</th><th>Required</th><th>Allowed values</th></tr>
                  </thead>
                  <tbody>
                    <tr><td><code>name</code></td>     <td>✓</td><td>Any text</td></tr>
                    <tr><td><code>email</code></td>    <td>✓</td><td>Valid email — must be unique</td></tr>
                    <tr><td><code>phone</code></td>    <td></td><td>Any text</td></tr>
                    <tr><td><code>status</code></td>   <td></td><td>new · contacted · qualified · lost</td></tr>
                    <tr><td><code>priority</code></td> <td></td><td>low · medium · high · urgent</td></tr>
                    <tr><td><code>source</code></td>   <td></td><td>website · linkedin · cold_call · referral · email · event · other</td></tr>
                    <tr><td><code>score</code></td>    <td></td><td>Number 0–100</td></tr>
                    <tr><td><code>dealValue</code></td><td></td><td>Number ≥ 0</td></tr>
                    <tr><td><code>tags</code></td>     <td></td><td>Semicolon-separated, e.g. <code>hot;enterprise</code></td></tr>
                  </tbody>
                </table>
              </div>
            </details>
          </div>
        )}

        {/* ── Step: uploading ──────────────────────────────── */}
        {step === 'uploading' && (
          <div className="import-dialog-body import-uploading">
            <div className="import-upload-spinner" aria-hidden="true" />
            <p className="import-uploading-label">Importing leads…</p>
            <p className="import-uploading-sub">
              Processing <strong>{selectedFile?.name}</strong>
            </p>
          </div>
        )}

        {/* ── Step: done / results ─────────────────────────── */}
        {step === 'done' && result && (
          <div className="import-dialog-body">
            {/* Summary pills */}
            <div className="import-summary">
              <div className="import-summary-item import-summary--created">
                <span className="import-summary-num">{result.created}</span>
                <span className="import-summary-lbl">Created</span>
              </div>
              <div className="import-summary-item import-summary--skipped">
                <span className="import-summary-num">{result.skipped}</span>
                <span className="import-summary-lbl">Skipped</span>
              </div>
              <div className="import-summary-item import-summary--errors">
                <span className="import-summary-num">{result.errors}</span>
                <span className="import-summary-lbl">Errors</span>
              </div>
              <div className="import-summary-item import-summary--total">
                <span className="import-summary-num">{result.total}</span>
                <span className="import-summary-lbl">Total rows</span>
              </div>
            </div>

            {/* Row-by-row results */}
            {result.results.length > 0 && (
              <div className="import-results-table-wrap">
                <table className="import-results-table">
                  <thead>
                    <tr>
                      <th>Row</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Result</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map(r => (
                      <tr key={r.row} className={`import-row--${r.status}`}>
                        <td className="text-muted text-sm">{r.row}</td>
                        <td>{r.name || <span className="text-light">—</span>}</td>
                        <td className="text-muted">{r.email || <span className="text-light">—</span>}</td>
                        <td>
                          <span className={`import-badge import-badge--${r.status}`}>
                            {r.status === 'created' ? '✓ Created' : r.status === 'skipped' ? '⊘ Skipped' : '✕ Error'}
                          </span>
                        </td>
                        <td className="text-muted text-sm">{r.reason ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Footer actions ───────────────────────────────── */}
        <div className="import-dialog-footer">
          {step === 'idle' && (
            <>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleUpload}
                disabled={!selectedFile || !!fileError}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                Import Leads
              </button>
            </>
          )}
          {step === 'done' && (
            <>
              <button className="btn btn-secondary" onClick={handleReset}>
                Import another file
              </button>
              <button className="btn btn-primary" onClick={onClose}>
                Done
              </button>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
