import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDarkMode } from '../context/DarkModeContext';
import { useRecentLeads } from '../hooks/useRecentLeads';
import { usePinnedLeads } from '../hooks/usePinnedLeads';

interface Props {
  onSearchOpen: () => void;
}

export default function Navbar({ onSearchOpen }: Props) {
  const { logout, username } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { recent } = useRecentLeads();
  const { data: pinnedData } = usePinnedLeads();
  const pinned = pinnedData?.data ?? [];
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      {/* Brand */}
      <Link to="/" className="sidebar-brand">
        <div className="sidebar-brand-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </div>
        <span className="sidebar-brand-name">LeadTrack</span>
      </Link>

      {/* Search trigger */}
      <button className="sidebar-search-btn" onClick={onSearchOpen} aria-label="Search (⌘K)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span>Search leads…</span>
        <kbd className="kbd kbd-sm">⌘K</kbd>
      </button>

      {/* Main nav */}
      <nav className="sidebar-nav" aria-label="Main navigation">
        <p className="sidebar-section-label">Menu</p>

        <NavLink to="/" end className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          All Leads
        </NavLink>

        <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          Dashboard
        </NavLink>

        <NavLink to="/kanban" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="5" height="18" rx="1"/>
            <rect x="10" y="3" width="5" height="12" rx="1"/>
            <rect x="17" y="3" width="5" height="15" rx="1"/>
          </svg>
          Kanban Board
        </NavLink>

        <NavLink to="/leads/new" className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link--active' : ''}`}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="16"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
          New Lead
          <kbd className="kbd kbd-sm" style={{ marginLeft: 'auto' }}>N</kbd>
        </NavLink>
      </nav>

      {/* Pinned leads */}
      {pinned.length > 0 && (
        <div className="sidebar-section">
          <p className="sidebar-section-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            Pinned
          </p>
          {pinned.slice(0, 4).map(lead => (
            <button key={lead.id} className="sidebar-mini-item" onClick={() => navigate(`/leads/${lead.id}`)}>
              <span className="sidebar-mini-avatar">{lead.name.charAt(0).toUpperCase()}</span>
              <span className="sidebar-mini-name">{lead.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Recent leads */}
      {recent.length > 0 && (
        <div className="sidebar-section">
          <p className="sidebar-section-label">Recent</p>
          {recent.slice(0, 4).map(lead => (
            <button key={lead.id} className="sidebar-mini-item" onClick={() => navigate(`/leads/${lead.id}`)}>
              <span className="sidebar-mini-avatar">{lead.name.charAt(0).toUpperCase()}</span>
              <span className="sidebar-mini-name">{lead.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* User area */}
      <div className="sidebar-user">
        <div className="sidebar-avatar" aria-hidden="true">{username.charAt(0).toUpperCase()}</div>
        <div className="sidebar-user-info">
          <span className="sidebar-username">{username}</span>
          <span className="sidebar-role">Administrator</span>
        </div>
        <button
          onClick={toggleDark}
          className="sidebar-logout"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
        <button onClick={logout} className="sidebar-logout" aria-label="Sign out" title="Sign out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  );
}
