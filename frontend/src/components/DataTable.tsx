import type { ReactNode } from 'react';
import type { SortDir } from '../types';

export interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => ReactNode;
}

interface Props<T> {
  columns: ColumnDef<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  sortKey?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyAction?: ReactNode;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`sort-icon ${active ? 'sort-icon--active' : ''}`} aria-hidden="true">
      {active && dir === 'asc' ? '↑' : active && dir === 'desc' ? '↓' : '↕'}
    </span>
  );
}

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  sortKey,
  sortDir = 'asc',
  onSort,
  isLoading = false,
  emptyMessage = 'No records found.',
  emptyAction,
}: Props<T>) {
  return (
    <div className="dt-wrapper">
      <table className="dt" role="grid">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{ width: col.width }}
                className={[
                  col.align ? `dt-${col.align}` : '',
                  col.sortable ? 'dt-sortable' : '',
                  sortKey === col.key ? 'dt-sorted' : '',
                ].join(' ')}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : 'descending'
                    : col.sortable
                    ? 'none'
                    : undefined
                }
              >
                {col.sortable && onSort ? (
                  <button
                    type="button"
                    className="dt-sort-btn"
                    onClick={() => onSort(col.key)}
                  >
                    {col.header}
                    <SortIcon active={sortKey === col.key} dir={sortDir} />
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="dt-skeleton-row">
                {columns.map((col) => (
                  <td key={col.key}>
                    <span className="skeleton" style={{ width: col.width ?? '80%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <div className="dt-empty">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                  <p>{emptyMessage}</p>
                  {emptyAction && <div className="dt-empty-action">{emptyAction}</div>}
                </div>
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="dt-row">
                {columns.map((col) => (
                  <td key={col.key} className={col.align ? `dt-${col.align}` : ''}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
