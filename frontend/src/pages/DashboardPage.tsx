import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../api/leads';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { STATUS_LABELS, SOURCE_LABELS } from '../types';

const STATUS_COLORS: Record<string, string> = {
  new: '#3b82f6', contacted: '#f59e0b', qualified: '#22c55e', lost: '#ef4444',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: '#94a3b8', medium: '#6366f1', high: '#f59e0b', urgent: '#ef4444',
};

function MetricCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="metric-card" style={{ borderTopColor: color }}>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      {sub && <p className="metric-sub">{sub}</p>}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['analytics'],
    queryFn: leadsApi.getAnalytics,
    staleTime: 60_000,
  });

  if (isLoading) return <div className="page"><Spinner label="Loading analytics…" /></div>;
  if (isError || !data) return <div className="page"><ErrorMessage message="Failed to load analytics." onRetry={() => refetch()} /></div>;

  const funnelData = [
    { name: STATUS_LABELS.new,       value: data.byStatus.new       ?? 0 },
    { name: STATUS_LABELS.contacted, value: data.byStatus.contacted ?? 0 },
    { name: STATUS_LABELS.qualified, value: data.byStatus.qualified ?? 0 },
    { name: STATUS_LABELS.lost,      value: data.byStatus.lost      ?? 0 },
  ];

  const sourceData = Object.entries(data.bySource).map(([k, v]) => ({
    name: SOURCE_LABELS[k as keyof typeof SOURCE_LABELS] ?? k,
    value: v,
  }));

  const priorityData = Object.entries(data.byPriority).map(([k, v]) => ({
    name: k.charAt(0).toUpperCase() + k.slice(1),
    value: v,
    color: PRIORITY_COLORS[k] ?? '#94a3b8',
  }));

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Pipeline overview and performance metrics</p>
        </div>
      </div>

      {/* ── Metric cards ──────────────────────────── */}
      <div className="metrics-row">
        <MetricCard label="Total Leads"        value={data.total}                         color="#6366f1" />
        <MetricCard label="Win Rate"           value={`${data.winRate}%`}                 color="#22c55e" sub="Qualified / Total" />
        <MetricCard label="Total Pipeline"     value={fmtCurrency(data.totalDealValue)}   color="#3b82f6" sub="Sum of deal values" />
        <MetricCard label="Qualified Revenue"  value={fmtCurrency(data.qualifiedDealValue)} color="#f59e0b" sub="Won pipeline" />
      </div>

      {/* ── Row 1: Area chart + Funnel ─────────────── */}
      <div className="chart-grid chart-grid--2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">Leads Over Time (30 days)</h3></div>
          <div className="card-body" style={{ padding: '20px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.leadsOverTime} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={d => d.slice(5)} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip labelFormatter={l => `Date: ${l}`} />
                <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#grad)" strokeWidth={2} name="Leads" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">Pipeline Funnel</h3></div>
          <div className="card-body" style={{ padding: '20px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={funnelData} margin={{ top: 0, right: 12, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Leads" radius={[4,4,0,0]}>
                  {funnelData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[Object.keys(STATUS_COLORS)[i]] ?? '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: Source pie + Priority bar ─────── */}
      <div className="chart-grid chart-grid--2">
        {sourceData.length > 0 && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Leads by Source</h3></div>
            <div className="card-body" style={{ padding: '20px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sourceData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {sourceData.map((_, i) => (
                      <Cell key={i} fill={['#6366f1','#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#ec4899'][i % 7]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {priorityData.length > 0 && (
          <div className="card">
            <div className="card-header"><h3 className="card-title">Leads by Priority</h3></div>
            <div className="card-body" style={{ padding: '20px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={priorityData} layout="vertical" margin={{ top: 0, right: 12, bottom: 0, left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Leads" radius={[0,4,4,0]}>
                    {priorityData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* ── Status summary table ──────────────────── */}
      <div className="card">
        <div className="card-header"><h3 className="card-title">Status Breakdown</h3></div>
        <div className="dt-wrapper">
          <table className="dt">
            <thead>
              <tr>
                <th>Status</th><th>Count</th><th>% of Total</th><th>Colour</th>
              </tr>
            </thead>
            <tbody>
              {funnelData.map(row => (
                <tr key={row.name} className="dt-row">
                  <td><strong>{row.name}</strong></td>
                  <td>{row.value}</td>
                  <td>{data.total > 0 ? `${((row.value / data.total) * 100).toFixed(1)}%` : '—'}</td>
                  <td>
                    <span style={{ display:'inline-block', width:12, height:12, borderRadius:3, background: STATUS_COLORS[Object.keys(STATUS_COLORS).find(k => STATUS_LABELS[k as any] === row.name) ?? ''] ?? '#ccc' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
