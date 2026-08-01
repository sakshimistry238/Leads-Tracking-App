interface Props {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const PAGE_SIZE_OPTIONS = [5, 8, 15, 25, 50];

/** Returns a compact page window: 1 … 4 5 6 … 12 */
function pageWindow(current: number, total: number): (number | '…')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '…')[] = [1];
  if (current > 3) pages.push('…');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('…');
  pages.push(total);
  return pages;
}

export default function Pagination({ page, totalPages, total, limit, onPageChange, onLimitChange }: Props) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const window = pageWindow(page, totalPages);

  return (
    <div className="pagination">
      <span className="pagination-info">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> leads
      </span>

      <div className="pagination-controls">
        <button
          className="pager-btn"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="First page"
          title="First page"
        >
          «
        </button>
        <button
          className="pager-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
          title="Previous page"
        >
          ‹
        </button>

        {window.map((p, i) =>
          p === '…' ? (
            <span key={`ellipsis-${i}`} className="pager-ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`pager-btn ${p === page ? 'pager-btn--active' : ''}`}
              onClick={() => onPageChange(p as number)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          className="pager-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
          title="Next page"
        >
          ›
        </button>
        <button
          className="pager-btn"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Last page"
          title="Last page"
        >
          »
        </button>
      </div>

      {onLimitChange && (
        <div className="pagination-size">
          <label htmlFor="page-size" className="pagination-size-label">Rows</label>
          <select
            id="page-size"
            className="select select-sm"
            value={limit}
            onChange={(e) => { onLimitChange(Number(e.target.value)); onPageChange(1); }}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
