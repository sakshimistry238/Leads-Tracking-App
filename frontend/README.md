# Leads Tracking — Frontend

React 19 SPA built with Vite, TypeScript, React Query, React Router, and Axios. Connects to the NestJS backend.

**Features**
- Basic Auth login gate (credentials stored in `sessionStorage`)
- Leads list with live search, status filter, and pagination
- Lead detail page with inline edit and notes
- Create lead form with client-side validation
- Delete confirmation modal
- Dark mode support (follows OS preference)
- Accessible markup (ARIA labels, roles, focus management)

---

## Requirements

- Node.js 18+
- npm 9+
- Backend running on `http://localhost:3000` (or set `VITE_API_URL`)

---

## Quick start

```bash
# 1. Start the backend first (see backend/README.md)
cd backend && npm run dev

# 2. Start the frontend
cd frontend
npm install
npm run dev          # opens http://localhost:5173
```

### Demo credentials

| Username | Password  |
|----------|-----------|
| `admin`  | `admin123`|

---

## Run tests

```bash
npm test             # Vitest – StatusBadge component tests
npm run test:watch   # watch mode
```

---

## Build for production

```bash
npm run build        # outputs to dist/
npm run preview      # preview the production build locally
```

---

## Environment variables

Create a `.env` file in the `frontend/` directory if the backend is not on localhost:

```env
VITE_API_URL=http://your-backend-host:3000
```

If `VITE_API_URL` is not set, all `/api/*` requests are proxied to `http://localhost:3000` via the Vite dev-server proxy.

---

## Docker

```bash
# From the repo root
docker compose up --build
```

Frontend served at `http://localhost:80`.
API calls are proxied through nginx to the backend container automatically.

---

## Project structure

```
src/
├── main.tsx              # Entry — BrowserRouter, QueryClient, AuthProvider
├── App.tsx               # Route definitions + auth gate
├── index.css             # Design tokens + all component styles
├── api/
│   ├── client.ts         # Axios instance with Basic-Auth interceptor
│   ├── leads.ts          # Leads API functions
│   └── notes.ts          # Notes API functions
├── types/
│   └── index.ts          # Shared TypeScript types
├── context/
│   └── AuthContext.tsx   # Auth state + login/logout
├── components/
│   ├── LoginPage.tsx
│   ├── Navbar.tsx
│   ├── StatusBadge.tsx
│   ├── Spinner.tsx
│   ├── ErrorMessage.tsx
│   └── Pagination.tsx
├── pages/
│   ├── LeadsListPage.tsx
│   ├── LeadDetailPage.tsx
│   └── CreateLeadPage.tsx
└── __tests__/
    └── StatusBadge.test.tsx
```

---

## Pages

| Route          | Description                                     |
|----------------|-------------------------------------------------|
| `/`            | Leads list — search, filter by status, paginate |
| `/leads/new`   | Create a new lead                               |
| `/leads/:id`   | Lead detail — view, edit, delete, add notes     |
