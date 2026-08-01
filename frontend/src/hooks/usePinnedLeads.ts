import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../api/leads';

/** Fetches all pinned leads (page 1, limit 20) */
export function usePinnedLeads() {
  return useQuery({
    queryKey: ['leads-pinned'],
    queryFn: () => leadsApi.getAll({ pinned: true, limit: 20 }),
    staleTime: 30_000,
  });
}
