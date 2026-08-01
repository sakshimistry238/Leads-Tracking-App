import { useCallback, useState } from 'react';

export interface RecentLead { id: number; name: string; }

const KEY = 'lt_recent_leads';
const MAX = 5;

function load(): RecentLead[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

export function useRecentLeads() {
  const [recent, setRecent] = useState<RecentLead[]>(load);

  const push = useCallback((lead: RecentLead) => {
    setRecent(prev => {
      const filtered = prev.filter(l => l.id !== lead.id);
      const next = [lead, ...filtered].slice(0, MAX);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    localStorage.removeItem(KEY);
    setRecent([]);
  }, []);

  return { recent, push, clear };
}
