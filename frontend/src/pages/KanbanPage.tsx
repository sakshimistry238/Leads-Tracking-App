import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { leadsApi } from '../api/leads';
import { useToast } from '../context/ToastContext';
import type { Lead, LeadStatus } from '../types';
import { LEAD_STATUSES, STATUS_LABELS } from '../types';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

const COLUMN_COLORS: Record<LeadStatus, string> = {
  new:       '#3b82f6',
  contacted: '#f59e0b',
  qualified: '#22c55e',
  lost:      '#ef4444',
};

// ── Draggable card ────────────────────────────────────────────────────────────
function KanbanCard({ lead }: { lead: Lead }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`kanban-card ${isDragging ? 'kanban-card--dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      <div className="kanban-card-header">
        <span className="kanban-card-avatar" aria-hidden="true">{lead.name.charAt(0).toUpperCase()}</span>
        <div className="kanban-card-meta">
          <button className="kanban-card-name" onClick={() => navigate(`/leads/${lead.id}`)}>{lead.name}</button>
          <span className="kanban-card-email">{lead.email}</span>
        </div>
        {lead.pinned && <span className="kanban-pin" title="Pinned" aria-label="Pinned">★</span>}
      </div>
      {lead.dealValue > 0 && (
        <div className="kanban-card-value">
          {new Intl.NumberFormat('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 }).format(lead.dealValue)}
        </div>
      )}
      {lead.tags.length > 0 && (
        <div className="kanban-tags">
          {lead.tags.slice(0,3).map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      )}
    </div>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({ status, leads }: { status: LeadStatus; leads: Lead[] }) {
  const ids = leads.map(l => l.id);
  return (
    <div className="kanban-column">
      <div className="kanban-column-header" style={{ borderTopColor: COLUMN_COLORS[status] }}>
        <span className="kanban-column-title">{STATUS_LABELS[status]}</span>
        <span className="kanban-column-count">{leads.length}</span>
      </div>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="kanban-column-body">
          {leads.map(lead => <KanbanCard key={lead.id} lead={lead} />)}
          {leads.length === 0 && (
            <div className="kanban-column-empty">No leads here</div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['leads', { limit: 200 }],
    queryFn: () => leadsApi.getAll({ limit: 200 }),
    staleTime: 30_000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: LeadStatus }) =>
      leadsApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast('Lead status updated');
    },
    onError: () => toast('Failed to update status', 'error'),
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const byStatus = useMemo(() => {
    const map: Record<LeadStatus, Lead[]> = { new: [], contacted: [], qualified: [], lost: [] };
    for (const lead of data?.data ?? []) {
      map[lead.status]?.push(lead);
    }
    return map;
  }, [data?.data]);

  const activeLead = useMemo(
    () => data?.data?.find(l => l.id === activeId) ?? null,
    [data?.data, activeId],
  );

  const findStatus = (id: number): LeadStatus | null => {
    for (const [status, leads] of Object.entries(byStatus)) {
      if (leads.some(l => l.id === id)) return status as LeadStatus;
    }
    return null;
  };

  const handleDragStart = ({ active }: DragStartEvent) => {
    setActiveId(active.id as number);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    if (!over) return;
    const overId = over.id as number | string;

    // over could be a column id (string) or a card id (number)
    let targetStatus: LeadStatus | null = null;
    if (typeof overId === 'string' && LEAD_STATUSES.includes(overId as LeadStatus)) {
      targetStatus = overId as LeadStatus;
    } else {
      targetStatus = findStatus(overId as number);
    }

    if (!targetStatus) return;
    const sourceStatus = findStatus(active.id as number);
    if (sourceStatus !== targetStatus) {
      updateMutation.mutate({ id: active.id as number, status: targetStatus });
    }
  };

  if (isLoading) return <div className="page"><Spinner label="Loading board…" /></div>;
  if (isError)   return <div className="page"><ErrorMessage message="Failed to load leads." onRetry={() => refetch()} /></div>;

  return (
    <div className="page kanban-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="page-subtitle">Drag cards between columns to update lead status</p>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="kanban-board">
          {LEAD_STATUSES.map(status => (
            <KanbanColumn key={status} status={status} leads={byStatus[status]} />
          ))}
        </div>
        <DragOverlay>
          {activeLead && (
            <div className="kanban-card kanban-card--overlay">
              <div className="kanban-card-header">
                <span className="kanban-card-avatar">{activeLead.name.charAt(0).toUpperCase()}</span>
                <div className="kanban-card-meta">
                  <span className="kanban-card-name">{activeLead.name}</span>
                  <span className="kanban-card-email">{activeLead.email}</span>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
