import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { leadsApi } from '../api/leads';
import StatusBadge from './StatusBadge';

interface Props {
  onClose: () => void;
}

export default function GlobalSearch({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['global-search', query],
    queryFn: () => leadsApi.getAll({ search: query, limit: 8 }),
    enabled: query.trim().length >= 1,
  });

  const results = data?.data ?? [];

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const go = (id: number) => {
    navigate(`/leads/${id}`);
    onClose();
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape')     { onClose(); return; }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) { go(results[selected].id); }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Search leads"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="global-search-box">
        <div className="global-search-input-row">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search leads by name or email…"
            aria-label="Search leads"
            className="global-search-input"
          />
          <kbd className="kbd" onClick={onClose}>ESC</kbd>
        </div>

        {query.trim() && (
          <div className="global-search-results">
            {isLoading && (
              <div className="global-search-empty">Searching…</div>
            )}
            {!isLoading && results.length === 0 && (
              <div className="global-search-empty">No leads found for "{query}"</div>
            )}
            {results.map((lead, i) => (
              <button
                key={lead.id}
                className={`global-search-item ${i === selected ? 'global-search-item--active' : ''}`}
                onClick={() => go(lead.id)}
                onMouseEnter={() => setSelected(i)}
              >
                <div className="global-search-avatar">{lead.name.charAt(0).toUpperCase()}</div>
                <div className="global-search-info">
                  <span className="global-search-name">{lead.name}</span>
                  <span className="global-search-email">{lead.email}</span>
                </div>
                <StatusBadge status={lead.status} size="sm" />
              </button>
            ))}
          </div>
        )}

        <div className="global-search-footer">
          <span><kbd className="kbd">↑↓</kbd> navigate</span>
          <span><kbd className="kbd">↵</kbd> open</span>
          <span><kbd className="kbd">ESC</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
