import type { LeadStatus } from '../types';
import { STATUS_LABELS } from '../types';

interface Props {
  status: LeadStatus;
  size?: 'sm' | 'md';
}

const dotColor: Record<LeadStatus, string> = {
  new:       '#3b82f6',
  contacted: '#f59e0b',
  qualified: '#22c55e',
  lost:      '#ef4444',
};

export default function StatusBadge({ status, size = 'md' }: Props) {
  return (
    <span
      className={`badge badge-${status} ${size === 'sm' ? 'badge-sm' : ''}`}
      aria-label={`Status: ${STATUS_LABELS[status]}`}
    >
      <span
        className="badge-dot"
        style={{ background: dotColor[status] }}
        aria-hidden="true"
      />
      {STATUS_LABELS[status]}
    </span>
  );
}
