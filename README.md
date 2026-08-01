# LeadTrack — Leads Tracking App

A full-stack CRM web application for managing your sales pipeline. Built with **NestJS + SQLite** on the backend and **React + TypeScript** on the frontend.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Run with Docker](#run-with-docker)
- [API Reference](#api-reference)
  - [Leads](#leads)
  - [Notes](#notes)
  - [Analytics](#analytics)
  - [Import / Export](#import--export)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Default Credentials](#default-credentials)

---

## Features

### Core
- ✅ **Leads CRUD** — create, view, edit, delete leads
- ✅ **Notes per lead** — add timestamped notes to any lead
- ✅ **Status pipeline** — New → Contacted → Qualified → Lost with stage history
- ✅ **Search & filter** — real-time search by name/email, filter by status

### Extended Lead Fields
- **Priority** — Low / Medium / High / Urgent
- **Lead Source** — Website, LinkedIn, Cold Call, Referral, Email, Event, Other
- **Lead Score** — 0–100 engagement score
- **Deal Value** — expected revenue in USD
- **Tags** — custom labels (semicolon-separated on import)
- **Pin leads** — star important leads for quick sidebar access

### Pages
- **Leads List** — DataTable with sort, search, status filter tabs, pagination, pin/delete
- **Lead Detail** — info grid, inline edit form, stage history timeline, notes
- **Create Lead** — full form with all fields and blur-triggered validation
- **Kanban Board** — drag-and-drop cards between status columns
- **Dashboard** — pipeline funnel, leads over time chart, by-source pie, by-priority bar, revenue forecast

### UX / Workflow
- 🔍 **Cmd+K global search** — instant lead lookup from anywhere
- ⌨️ **Keyboard shortcuts** — `N` new lead, `?` help overlay, `⌘K` search
- 🌙 **Dark mode** — manual toggle stored in localStorage
- 📌 **Recent & pinned leads** — sidebar quick-access sections
- 🔔 **Toast notifications** — success / error / info on every action
- 📥 **Import from Excel** — drag-and-drop `.xlsx` upload with row-level results
- 📤 **Export to Excel** — styled workbook with colour-coded status/priority and Summary sheet
- 🔐 **Basic Auth** — login gate (sessionStorage token, configurable credentials)

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| NestJS | 11 | REST API framework |
| TypeORM | 1.x | ORM / database access |
| better-sqlite3 | 12 | Embedded SQLite database |
| ExcelJS | 4 | Excel import & export |
| Multer | 2 | Multipart file upload |
| class-validator | 0.15 | DTO validation |
| Swagger (OpenAPI) | 11 | Auto-generated API docs |
| Jest | 30 | Unit testing |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI library |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build tool & dev server |
| React Router | 7 | Client-side routing |
| TanStack Query | 5 | Data fetching & caching |
| Axios | 1 | HTTP client |
| Recharts | 3 | Dashboard charts |
| @dnd-kit | 6/10 | Kanban drag-and-drop |
| Vitest | 4 | Unit testing |

---

## Project Structure

```
Leads-Tracking-App/
├── backend/
│   ├── src/
│   │   ├── analytics/          # GET /api/analytics/summary
│   │   ├── leads/
│   │   │   ├── dto/            # CreateLeadDto, UpdateLeadDto, QueryLeadDto, ImportLeadDto
│   │   │   ├── lead.entity.ts  # TypeORM entity (status, priority, source, score, tags …)
│   │   │   ├── leads.controller.ts
│   │   │   ├── leads.service.ts
│   │   │   └── leads.service.spec.ts
│   │   ├── notes/
│   │   │   ├── dto/
│   │   │   ├── note.entity.ts
│   │   │   ├── notes.controller.ts
│   │   │   └── notes.service.ts
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   └── seed.ts
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── api/                # leadsApi, notesApi, axios client
│   │   ├── components/         # DataTable, Navbar, StatusBadge, ImportLeadsDialog …
│   │   ├── context/            # AuthContext, ToastContext, DarkModeContext
│   │   ├── hooks/              # useRecentLeads, usePinnedLeads, useKeyboardShortcuts
│   │   ├── pages/              # LeadsListPage, LeadDetailPage, CreateLeadPage,
│   │   │   │                   # DashboardPage, KanbanPage
│   │   ├── types/              # Shared TypeScript interfaces & enums
│   │   ├── App.tsx             # Routes + keyboard shortcut registration
│   │   └── main.tsx            # Providers: Router, QueryClient, DarkMode, Auth, Toast
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── docker-compose.yml
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- (Optional) **Docker** & **Docker Compose** for containerised setup

---

### Backend Setup

```bash
cd backend
npm install
npm run dev         # starts on http://localhost:3000
```

Seed the database with 6 sample leads and notes:

```bash
npm run seed
```

Swagger UI is available at **http://localhost:3000/api/docs**

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev         # starts on http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:3000` automatically — no CORS issues during development.

---

### Run with Docker

```bash
# From the repo root
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend (nginx) | http://localhost:80 |
| Backend API | http://localhost:3000 |
| Swagger Docs | http://localhost:3000/api/docs |

The SQLite database is persisted in a named Docker volume (`sqlite-data`) across container restarts.

---

## API Reference

Base URL: `http://localhost:3000`

### Leads

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads` | List leads — supports `search`, `status`, `priority`, `source`, `tag`, `pinned`, `page`, `limit` |
| `POST` | `/api/leads` | Create a lead |
| `GET` | `/api/leads/:id` | Get a lead with its notes |
| `PATCH` | `/api/leads/:id` | Update a lead (partial) |
| `DELETE` | `/api/leads/:id` | Delete a lead and all its notes |

#### List leads — query parameters

| Param | Type | Example | Description |
|---|---|---|---|
| `search` | string | `alice` | Filter by name or email |
| `status` | string | `new` | `new` \| `contacted` \| `qualified` \| `lost` |
| `priority` | string | `high` | `low` \| `medium` \| `high` \| `urgent` |
| `source` | string | `linkedin` | See source values below |
| `tag` | string | `enterprise` | Filter by a single tag |
| `pinned` | boolean | `true` | Only pinned leads |
| `page` | number | `1` | Page number (1-based) |
| `limit` | number | `10` | Items per page |

#### curl examples

```bash
# List all leads
curl http://localhost:3000/api/leads

# Search + filter
curl "http://localhost:3000/api/leads?search=alice&status=new&page=1&limit=5"

# Create a lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1-555-0100",
    "status": "new",
    "priority": "high",
    "source": "linkedin",
    "score": 80,
    "dealValue": 15000,
    "tags": ["enterprise", "hot"]
  }'

# Update status with a reason (recorded in stage history)
curl -X PATCH http://localhost:3000/api/leads/1 \
  -H "Content-Type: application/json" \
  -d '{"status": "qualified", "statusChangeReason": "Budget confirmed"}'

# Delete a lead
curl -X DELETE http://localhost:3000/api/leads/1
```

---

### Notes

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads/:id/notes` | Get all notes for a lead |
| `POST` | `/api/leads/:id/notes` | Add a note to a lead |

```bash
# Get notes
curl http://localhost:3000/api/leads/1/notes

# Add a note
curl -X POST http://localhost:3000/api/leads/1/notes \
  -H "Content-Type: application/json" \
  -d '{"content": "Sent follow-up email. Demo scheduled for Friday."}'
```

---

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Pipeline funnel, win rate, deal values, leads over time (30 days), by-source and by-priority breakdowns |

```bash
curl http://localhost:3000/api/analytics/summary
```

**Response shape:**
```json
{
  "total": 42,
  "byStatus": { "new": 15, "contacted": 12, "qualified": 10, "lost": 5 },
  "bySource": { "linkedin": 18, "website": 12, "referral": 8 },
  "byPriority": { "high": 14, "urgent": 6, "medium": 18, "low": 4 },
  "totalDealValue": 284500,
  "qualifiedDealValue": 97000,
  "winRate": 24,
  "leadsOverTime": [{ "date": "2026-07-02", "count": 3 }, "..."]
}
```

---

### Import / Export

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/leads/export` | Download all (or filtered) leads as a styled `.xlsx` file |
| `GET` | `/api/leads/import/template` | Download the Excel import template with 5 sample rows |
| `POST` | `/api/leads/import` | Bulk import leads from a `.xlsx` file (multipart/form-data, max 500 rows) |

```bash
# Export current leads to Excel
curl -OJ "http://localhost:3000/api/leads/export"

# Export filtered subset
curl -OJ "http://localhost:3000/api/leads/export?status=qualified&source=linkedin"

# Download import template
curl -OJ "http://localhost:3000/api/leads/import/template"

# Bulk import from Excel
curl -X POST http://localhost:3000/api/leads/import \
  -F "file=@/path/to/leads.xlsx"
```

**Import response:**
```json
{
  "total": 20,
  "created": 17,
  "skipped": 2,
  "errors": 1,
  "results": [
    { "row": 2, "name": "Alice Johnson", "email": "alice@example.com", "status": "created" },
    { "row": 5, "name": "Bob Smith",     "email": "bob@example.com",   "status": "skipped", "reason": "email already exists" },
    { "row": 9, "name": "",              "email": "",                   "status": "error",   "reason": "name is required" }
  ]
}
```

---

## Error Responses

| Status | Meaning |
|---|---|
| `400` | Validation error or bad request (invalid email, missing required field, wrong file type) |
| `404` | Lead not found |
| `409` | Conflict — email already exists |

All error responses follow the NestJS standard shape:
```json
{
  "statusCode": 404,
  "message": "Lead with id 99 not found",
  "error": "Not Found"
}
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the NestJS server listens on |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | *(empty)* | Backend base URL. Leave empty during dev (Vite proxy handles it). Set to `http://your-host:3000` for production builds. |

---

## Scripts

### Backend

```bash
npm run dev          # Start in watch mode (development)
npm run build        # Compile TypeScript → dist/
npm run start:prod   # Run compiled production build
npm run seed         # Seed the database with 6 sample leads + notes
npm test             # Run Jest unit tests (8 tests)
npm run test:cov     # Run tests with coverage report
npm run lint         # ESLint with auto-fix
```

### Frontend

```bash
npm run dev          # Vite dev server with HMR (http://localhost:5173)
npm run build        # Type-check + production build → dist/
npm run preview      # Preview the production build locally
npm test             # Vitest – runs StatusBadge component tests (7 tests)
npm run test:watch   # Vitest in watch mode
npm run lint         # ESLint
```

---

## Default Credentials

The app uses a simple Basic Auth gate. Credentials are validated client-side against constants in `AuthContext.tsx`.

| Username | Password |
|---|---|
| `admin` | `admin123` |

> To change these, update `VALID_USERNAME` and `VALID_PASSWORD` in `frontend/src/context/AuthContext.tsx`.

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `⌘ K` / `Ctrl K` | Open global search |
| `N` | Navigate to Create Lead page |
| `?` | Show keyboard shortcuts help |

---

## Lead Field Reference

### Status values
`new` · `contacted` · `qualified` · `lost`

### Priority values
`low` · `medium` · `high` · `urgent`

### Source values
`website` · `linkedin` · `cold_call` · `referral` · `email` · `event` · `other`
