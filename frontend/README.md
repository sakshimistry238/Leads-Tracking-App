# LeadTrack — Frontend

React 19 SPA built with **Vite**, **TypeScript**, **TanStack Query**, **React Router v7**, and **Axios**. Connects to the NestJS backend API.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Demo Credentials](#demo-credentials)
- [Pages & Routes](#pages--routes)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Tests](#tests)
- [Docker](#docker)

---

## Features

### Leads Management
- DataTable with **column sorting**, skeleton loading, and empty-state actions
- **Search** by name or email with live clear button
- **Status filter tabs** — All / New / Contacted / Qualified / Lost
- **Pagination** with page-size selector (5 / 8 / 15 / 25 / 50 rows)
- **Pin / unpin** leads — pinned leads appear in the sidebar for quick access
- **Delete** with confirmation modal

### Lead Fields
Every lead stores: name, email, phone, **status**, **priority**, **source**, **lead score** (0–100), **deal value** ($), **tags**, and **pinned** flag.

### Lead Detail
- Inline edit form with all fields including status-change reason
- **Stage history timeline** — every status transition recorded with timestamp and reason
- **Notes** — add timestamped notes; toast on success/error

### Kanban Board
- Drag-and-drop cards between **New → Contacted → Qualified → Lost** columns
- Uses `@dnd-kit` with pointer sensor and drag overlay
- Status updates fire the PATCH API immediately

### Dashboard / Analytics
- Metrics row — Total leads, Win rate, Total pipeline ($), Qualified revenue ($)
- **Area chart** — leads created over the last 30 days
- **Bar chart** — pipeline funnel by status
- **Pie chart** — leads by source
- **Horizontal bar chart** — leads by priority
- Status breakdown summary table

### Import / Export
- **Export Excel** — downloads a styled `.xlsx` workbook with colour-coded status/priority cells, auto-filter, frozen header, and a Summary sheet
- **Import Excel** — drag-and-drop `.xlsx` upload dialog with:
  - Template download (5 sample rows, dropdown validation, Instructions sheet)
  - Row-by-row result table (Created / Skipped / Error)
  - Max 500 rows per file, 5 MB size limit

### UX / Workflow
- **Cmd+K global search** — instant lead lookup with keyboard navigation
- **Keyboard shortcuts** — `N` new lead, `?` help overlay, `⌘K` search
- **Dark mode** — manual toggle stored in `localStorage`, respects OS preference on first load
- **Recent leads** — last 5 visited leads shown in sidebar (stored in `localStorage`)
- **Pinned leads** — starred leads in sidebar
- **Toast notifications** — success / error / info on every mutation
- **Basic Auth login gate** — credentials in `sessionStorage`

---

## Requirements

- **Node.js** 18+
- **npm** 9+
- Backend running on `http://localhost:3000` (or configure `VITE_API_URL`)

---

## Quick Start

```bash
# 1. Start the backend first
cd backend && npm run dev

# 2. Start the frontend
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server **proxies all `/api/*` requests** to `http://localhost:3000` — no CORS setup needed during development.

---

## Demo Credentials

| Username | Password  |
|----------|-----------|
| `admin`  | `admin123` |

To change them, update `VALID_USERNAME` and `VALID_PASSWORD` in `src/context/AuthContext.tsx`.

---

## Pages & Routes

| Route | Page | Description |
|---|---|---|
| `/` | Leads List | DataTable with search, filter, sort, pagination, pin/export/import |
| `/leads/new` | Create Lead | Full form — contact info, pipeline details, tags, pin |
| `/leads/:id` | Lead Detail | Info grid, inline edit, stage history timeline, notes |
| `/dashboard` | Dashboard | Charts — funnel, trends, source, priority, revenue |
| `/kanban` | Kanban Board | Drag-and-drop pipeline view |

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open global search |
| `N` | Go to Create Lead |
| `?` | Show shortcuts help overlay |
| `↑ ↓` | Navigate search results |
| `↵` | Open selected search result |
| `Esc` | Close any modal / search |

---

## Project Structure

```
src/
├── main.tsx                    # Providers: BrowserRouter, QueryClient,
│                               #   DarkMode, Auth, Toast
├── App.tsx                     # Routes + Cmd+K / N / ? keyboard shortcuts
├── index.css                   # Design tokens, dark mode, all component styles
│
├── api/
│   ├── client.ts               # Axios instance — Basic-Auth interceptor, 401 handler
│   ├── leads.ts                # getAll, getOne, create, update, remove,
│   │                           #   togglePin, getAnalytics, getExportUrl,
│   │                           #   getTemplateUrl, bulkImport
│   └── notes.ts                # getAll, create
│
├── types/
│   └── index.ts                # Lead, Note, LeadStatus, LeadPriority, LeadSource,
│                               #   PaginatedResponse, payloads, query types,
│                               #   AnalyticsSummary, SortDir, LeadSortKey
│
├── context/
│   ├── AuthContext.tsx          # Login / logout, sessionStorage token
│   ├── ToastContext.tsx         # Toast queue — success / error / info, 4 s auto-dismiss
│   └── DarkModeContext.tsx      # isDark state, localStorage persistence
│
├── hooks/
│   ├── useRecentLeads.ts       # localStorage — last 5 visited leads
│   ├── usePinnedLeads.ts       # React Query — fetch pinned leads for sidebar
│   └── useKeyboardShortcuts.ts # Global keydown listener with modifier support
│
├── components/
│   ├── Navbar.tsx              # Sidebar nav — brand, search trigger, links,
│   │                           #   pinned/recent sections, dark toggle, sign-out
│   ├── LoginPage.tsx           # Split-panel login — branded left, form right
│   ├── DataTable.tsx           # Generic sortable table with skeleton rows
│   ├── Pagination.tsx          # Smart page window (1 … 4 5 6 … 12) + rows-per-page
│   ├── StatusBadge.tsx         # Colour-coded status pill with dot indicator
│   ├── StatsCard.tsx           # Icon + value + label metric card
│   ├── Spinner.tsx             # Animated ring spinner (sm / md / lg)
│   ├── ErrorMessage.tsx        # Inline error block with optional retry button
│   ├── ConfirmModal.tsx        # Reusable danger / primary confirmation dialog
│   ├── GlobalSearch.tsx        # Cmd+K search modal with keyboard navigation
│   ├── ShortcutsHelp.tsx       # ? shortcut overlay
│   └── ImportLeadsDialog.tsx   # 3-step import — template download, drop zone, results
│
├── pages/
│   ├── LeadsListPage.tsx       # Stats row, toolbar, DataTable, pagination, modals
│   ├── LeadDetailPage.tsx      # Lead card, extended fields, tags, EditForm,
│   │                           #   NotesSection, stage history timeline
│   ├── CreateLeadPage.tsx      # Contact + pipeline + tags + pin form
│   ├── DashboardPage.tsx       # Recharts — area, bar, pie, horizontal bar, table
│   └── KanbanPage.tsx          # @dnd-kit board — 4 columns, drag overlay
│
└── __tests__/
    └── StatusBadge.test.tsx    # 7 Vitest tests — renders, CSS classes, dot, size prop
```

---

## Environment Variables

Create a `.env` file inside `frontend/` for production or non-default setups:

```env
VITE_API_URL=http://your-backend-host:3000
```

Leave it empty (or omit the file) during local development — the Vite proxy handles all `/api/*` traffic.

---

## Scripts

```bash
npm run dev          # Vite dev server with HMR → http://localhost:5173
npm run build        # Type-check + production build → dist/
npm run preview      # Serve the production build locally
npm test             # Vitest (single run) — 7 tests
npm run test:watch   # Vitest in watch mode
npm run lint         # ESLint
```

---

## Tests

```bash
npm test
```

Runs **7 Vitest unit tests** for the `StatusBadge` component:
- Renders correct label and CSS class for each of the 4 statuses
- Contains a coloured dot indicator
- Applies `badge-sm` class when `size="sm"` prop is passed
- Does not apply `badge-sm` by default

---

## Docker

```bash
# From the repo root
docker compose up --build
```

The frontend is served by **nginx** at `http://localhost:80`. All `/api/*` requests are reverse-proxied to the backend container via `nginx.conf` — no environment variable needed in production Docker mode.
