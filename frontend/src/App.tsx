import { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import Navbar from './components/Navbar';
import LoginPage from './components/LoginPage';
import GlobalSearch from './components/GlobalSearch';
import ShortcutsHelp from './components/ShortcutsHelp';
import LeadsListPage from './pages/LeadsListPage';
import LeadDetailPage from './pages/LeadDetailPage';
import CreateLeadPage from './pages/CreateLeadPage';
import DashboardPage from './pages/DashboardPage';
import KanbanPage from './pages/KanbanPage';

function AuthenticatedApp() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  useKeyboardShortcuts({
    'cmd+k': (e) => { e.preventDefault(); setSearchOpen(true); },
    'n': () => navigate('/leads/new'),
    '?': () => setHelpOpen(true),
  });

  return (
    <div className="app-shell">
      <Navbar onSearchOpen={() => setSearchOpen(true)} />
      <main className="app-main">
        <Routes>
          <Route path="/"            element={<LeadsListPage />} />
          <Route path="/dashboard"   element={<DashboardPage />} />
          <Route path="/kanban"      element={<KanbanPage />} />
          <Route path="/leads/new"   element={<CreateLeadPage />} />
          <Route path="/leads/:id"   element={<LeadDetailPage />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {searchOpen && <GlobalSearch onClose={() => setSearchOpen(false)} />}
      {helpOpen   && <ShortcutsHelp onClose={() => setHelpOpen(false)} />}
    </div>
  );
}

export default function App() {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <LoginPage />;
  return <AuthenticatedApp />;
}
