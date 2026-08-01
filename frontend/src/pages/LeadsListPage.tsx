import { useState, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi } from '../api/leads';
import { useToast } from '../context/ToastContext';
import type { Lead, LeadStatus, LeadsQuery, SortDir, LeadSortKey } from '../types';
import { LEAD_STATUSES, STATUS_LABELS, PRIORITY_LABELS } from '../types';
import DataTable, { type ColumnDef } from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import StatsCard from '../components/StatsCard';
import ConfirmModal from '../components/ConfirmModal';
import ErrorMessage from '../components/ErrorMessage';
import ImportLeadsDialog from '../components/ImportLeadsDialog';

// ── helpers ──────────────────────────────────────────────────────────────────
function clientSort(rows: Lead[], key: LeadSortKey, dir: SortDir): Lead[] {
  return [...rows].sort((a, b) => {
    let av = a[key] ?? '';
    let bv = b[key] ?? '';
    if (key === 'createdAt') { av = new Date(av).getTime(); bv = new Date(bv).getTime(); }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

const STAT_ICONS: Record<string, string> = {
  total:     '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  new:       '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  qualified: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>',
  lost:      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
};

const DEFAULT_LIMIT = 8;

export default function LeadsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── filter / pagination state ─────────────────────────────────────────────
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');
  const [page, setPage]               = useState(1);
  const [limit, setLimit]             = useState(DEFAULT_LIMIT);
  const [sortKey, setSortKey]         = useState<LeadSortKey>('createdAt');
  const [sortDir, setSortDir]         = useState<SortDir>('desc');
  const [deleteId, setDeleteId]       = useState<number | null>(null);
  const [importOpen, setImportOpen]   = useState(false);

  // ── fetch ALL matching leads (search+status sent to API) ──────────────────
  // We fetch the current page from the server, then sort client-side
  const query: LeadsQuery = {
    search: search || undefined,
    status: statusFilter || undefined,
    page,
    limit,
  };

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['leads', query],
    queryFn: () => leadsApi.getAll(query),
    placeholderData: (prev) => prev,
  });

  // ── stats: fetch all with no filter to get accurate totals ────────────────
  const { data: allStats } = useQuery({
    queryKey: ['leads-stats'],
    queryFn: () => leadsApi.getAll({ limit: 1000 }),
    staleTime: 60_000,
  });

  const stats = useMemo(() => {
    const rows = allStats?.data ?? [];
    return {
      total:     rows.length,
      new:       rows.filter((l) => l.status === 'new').length,
      qualified: rows.filter((l) => l.status === 'qualified').length,
      lost:      rows.filter((l) => l.status === 'lost').length,
    };
  }, [allStats]);

  // ── client-side sort on the current page ─────────────────────────────────
  const sortedRows = useMemo(
    () => clientSort(data?.data ?? [], sortKey, sortDir),
    [data?.data, sortKey, sortDir],
  );

  // ── mutations ─────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: leadsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast('Lead deleted');
      setDeleteId(null);
    },
    onError: () => toast('Failed to delete lead', 'error'),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, pinned }: { id: number; pinned: boolean }) => leadsApi.togglePin(id, pinned),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['leads-pinned'] });
      toast(vars.pinned ? 'Lead pinned' : 'Lead unpinned');
    },
    onError: () => toast('Failed to update pin', 'error'),
  });

  // ── sort handler ─────────────────────────────────────────────────────────
  const handleSort = useCallback((key: string) => {
    setSortKey((prev) => {
      if (prev === key) { setSortDir((d) => (d === 'asc' ? 'desc' : 'asc')); return prev; }
      setSortDir('asc');
      return key as LeadSortKey;
    });
    setPage(1);
  }, []);

  const handleSearch = useCallback((val: string) => { setSearch(val); setPage(1); }, []);
  const handleStatus = useCallback((val: LeadStatus | '') => { setStatusFilter(val); setPage(1); }, []);

  // ── table columns ─────────────────────────────────────────────────────────
  const columns: ColumnDef<Lead>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (lead) => (
        <button className="dt-name-btn" onClick={() => navigate(`/leads/${lead.id}`)} title={`View ${lead.name}`}>
          <span className="dt-avatar" aria-hidden="true">{lead.name.charAt(0).toUpperCase()}</span>
          <span className="dt-name-text">
            <span className="dt-name-primary">{lead.name}</span>
            <span className="dt-name-secondary">{lead.email}</span>
          </span>
        </button>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      width: '120px',
      render: (lead) => <StatusBadge status={lead.status} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      sortable: true,
      width: '100px',
      render: (lead) => (
        <span className={`priority-badge priority-${lead.priority}`}>
          {PRIORITY_LABELS[lead.priority]}
        </span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      sortable: true,
      width: '80px',
      align: 'right' as const,
      render: (lead) => (
        <span className="score-badge" title={`Lead score: ${lead.score}`}>
          <span className="score-bar" style={{ width: `${lead.score}%` }} aria-hidden="true" />
          <span className="score-val">{lead.score}</span>
        </span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      width: '140px',
      render: (lead) => lead.tags.length > 0 ? (
        <div className="dt-tags">
          {lead.tags.slice(0, 2).map(t => <span key={t} className="tag">{t}</span>)}
          {lead.tags.length > 2 && <span className="tag tag--more">+{lead.tags.length - 2}</span>}
        </div>
      ) : <span className="text-light">—</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '110px',
      render: (lead) => (
        <time dateTime={lead.createdAt} className="text-muted text-sm">
          {new Date(lead.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </time>
      ),
    },
    {
      key: '_actions',
      header: '',
      width: '110px',
      align: 'right' as const,
      render: (lead) => (
        <div className="dt-actions">
          <button
            className={`btn-pin ${lead.pinned ? 'btn-pin--active' : ''}`}
            onClick={() => pinMutation.mutate({ id: lead.id, pinned: !lead.pinned })}
            aria-label={lead.pinned ? 'Unpin lead' : 'Pin lead'}
            title={lead.pinned ? 'Unpin' : 'Pin'}
          >★</button>
          <Link to={`/leads/${lead.id}`} className="btn btn-secondary btn-sm">View</Link>
          <button className="btn btn-icon btn-sm" onClick={() => setDeleteId(lead.id)} aria-label={`Delete ${lead.name}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>
      ),
    },
  ];

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="page">
      {/* ── Page title ────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Leads</h1>
          <p className="page-subtitle">Track and manage your sales pipeline</p>
        </div>
        <div className="page-header-actions">
          <button
            className="btn btn-secondary"
            onClick={() => setImportOpen(true)}
            title="Import leads from Excel"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Import
          </button>
          <Link to="/leads/new" className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Lead
          </Link>
        </div>
      </div>

      {/* ── Stats row ─────────────────────────────────── */}
      <div className="stats-row">
        <StatsCard label="Total Leads"  value={stats.total}     color="gray"   icon={STAT_ICONS.total} />
        <StatsCard label="New"          value={stats.new}       color="blue"   icon={STAT_ICONS.new} />
        <StatsCard label="Qualified"    value={stats.qualified} color="green"  icon={STAT_ICONS.qualified} />
        <StatsCard label="Lost"         value={stats.lost}      color="red"    icon={STAT_ICONS.lost} />
      </div>

      {/* ── Table card ───────────────────────────────── */}
      <div className="card">
        {/* Toolbar */}
        <div className="table-toolbar">
          <div className="search-box">
           
            <input
              type="search"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search leads"
              className="search-input"
            />
            {search && (
              <button className="search-clear" onClick={() => handleSearch('')} aria-label="Clear search">
                ✕
              </button>
            )}
          </div>

          <div className="toolbar-filters">
            <div className="filter-tabs" role="group" aria-label="Filter by status">
              <button className={`filter-tab ${statusFilter === '' ? 'filter-tab--active' : ''}`} onClick={() => handleStatus('')}>All</button>
              {LEAD_STATUSES.map((s) => (
                <button key={s} className={`filter-tab filter-tab--${s} ${statusFilter === s ? 'filter-tab--active' : ''}`} onClick={() => handleStatus(s)}>
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            <a
              href={leadsApi.getExportUrl({ search: search || undefined, status: statusFilter || undefined })}
              download={`leads_export_${new Date().toISOString().slice(0, 10)}.xlsx`}
              className="btn btn-secondary btn-sm"
              title="Export to Excel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export Excel
            </a>
          </div>
        </div>

        {/* Error state */}
        {isError && (
          <div className="card-body">
            <ErrorMessage
              message={(error as Error)?.message ?? 'Failed to load leads.'}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {/* DataTable */}
        {!isError && (
          <DataTable
            columns={columns}
            rows={sortedRows}
            rowKey={(l) => l.id}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            isLoading={isLoading}
            emptyMessage={
              search || statusFilter
                ? `No leads match "${search || STATUS_LABELS[statusFilter as LeadStatus]}".`
                : 'No leads yet. Create your first one!'
            }
            emptyAction={
              !search && !statusFilter ? (
                <Link to="/leads/new" className="btn btn-primary">
                  Create first lead
                </Link>
              ) : undefined
            }
          />
        )}

        {/* Pagination */}
        {data && !isLoading && (
          <div className="card-footer">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={setLimit}
            />
          </div>
        )}
      </div>

      {/* ── Delete modal ─────────────────────────────── */}
      {deleteId !== null && (
        <ConfirmModal
          title="Delete this lead?"
          description="This will permanently remove the lead and all associated notes. This action cannot be undone."
          confirmLabel="Delete Lead"
          isPending={deleteMutation.isPending}
          isError={deleteMutation.isError}
          errorMessage={(deleteMutation.error as Error)?.message}
          onConfirm={() => deleteMutation.mutate(deleteId)}
          onCancel={() => setDeleteId(null)}
          variant="danger"
        />
      )}

      {/* ── Import dialog ────────────────────────────── */}
      {importOpen && (
        <ImportLeadsDialog onClose={() => setImportOpen(false)} />
      )}
    </div>
  );
}
