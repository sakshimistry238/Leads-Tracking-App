interface Props {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isPending?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export default function ConfirmModal({
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isPending = false,
  isError = false,
  errorMessage,
  onConfirm,
  onCancel,
  variant = 'danger',
}: Props) {
  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal">
        <div className="modal-header">
          {variant === 'danger' && (
            <div className="modal-icon modal-icon--danger" aria-hidden="true">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
          )}
          <div>
            <h2 id="modal-title" className="modal-title">{title}</h2>
            <p className="modal-desc">{description}</p>
          </div>
        </div>

        {isError && (
          <div className="alert alert-error">
            {errorMessage ?? 'Operation failed. Please try again.'}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel} disabled={isPending}>
            {cancelLabel}
          </button>
          <button
            className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
