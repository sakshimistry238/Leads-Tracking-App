interface Props {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorMessage({
  message = 'Something went wrong.',
  onRetry,
}: Props) {
  return (
    <div className="error-block" role="alert">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-ghost btn-sm">
          Retry
        </button>
      )}
    </div>
  );
}
