interface Props {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export default function Spinner({ size = 'md', label = 'Loading…' }: Props) {
  return (
    <div className={`spinner-wrapper spinner-${size}`} role="status" aria-label={label}>
      <div className="spinner" />
      <span className="sr-only">{label}</span>
    </div>
  );
}
