import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import StatusBadge from '../components/StatusBadge';
import type { LeadStatus } from '../types';

const cases: { status: LeadStatus; label: string; cssClass: string }[] = [
  { status: 'new',       label: 'New',       cssClass: 'badge-new' },
  { status: 'contacted', label: 'Contacted', cssClass: 'badge-contacted' },
  { status: 'qualified', label: 'Qualified', cssClass: 'badge-qualified' },
  { status: 'lost',      label: 'Lost',      cssClass: 'badge-lost' },
];

describe('StatusBadge', () => {
  it.each(cases)(
    'renders "$label" with CSS class "$cssClass" for status "$status"',
    ({ status, label, cssClass }) => {
      render(<StatusBadge status={status} />);
      // The badge wrapper spans the label text
      const badge = screen.getByLabelText(`Status: ${label}`);
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass(cssClass);
    },
  );

  it('renders a coloured dot indicator inside the badge', () => {
    const { container } = render(<StatusBadge status="qualified" />);
    const dot = container.querySelector('.badge-dot');
    expect(dot).toBeInTheDocument();
    expect((dot as HTMLElement).style.background).toBeTruthy();
  });

  it('applies badge-sm class when size="sm"', () => {
    render(<StatusBadge status="new" size="sm" />);
    const badge = screen.getByLabelText('Status: New');
    expect(badge).toHaveClass('badge-sm');
  });

  it('does not apply badge-sm class by default', () => {
    render(<StatusBadge status="new" />);
    const badge = screen.getByLabelText('Status: New');
    expect(badge).not.toHaveClass('badge-sm');
  });
});
