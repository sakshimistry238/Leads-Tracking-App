# LeadTrack — Backend

NestJS REST API backed by **SQLite** (via TypeORM + better-sqlite3). Provides full CRUD for leads, per-lead notes, analytics, Excel import/export, search/filter/pagination, input validation, and a Swagger UI.

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Quick Start](#quick-start)
- [Seed Data](#seed-data)
- [Swagger UI](#swagger-ui)
- [API Reference](#api-reference)
  - [Leads](#leads)
  - [Notes](#notes)
  - [Analytics](#analytics)
  - [Import / Export](#import--export)
- [Lead Field Reference](#lead-field-reference)
- [Error Responses](#error-responses)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Tests](#tests)
- [Docker](#docker)

---

## Features

- **Full Leads CRUD** — create, read, update, delete with validation
- **Extended fields** — priority, source, lead score, deal value, tags, pinned flag
- **Stage history tracking** — every status change is recorded with timestamp and optional reason
- **Notes per lead** — multiple timestamped notes attached to each lead
- **Search & filter** — by name, email, status, priority, source, tag, and pinned flag
- **Pagination** — `page` + `limit` query params on all list endpoints
- **Analytics** — pipeline funnel, win rate, deal values, leads-over-time (30 days), by-source and by-priority breakdowns
- **Excel export** — styled `.xlsx` workbook with colour-coded cells, auto-filter, Summary sheet
- **Excel import** — bulk upload up to 500 rows; row-level created / skipped / error results
- **Import template** — downloadable `.xlsx` with 5 sample rows, dropdown validation, and Instructions sheet
- **Swagger UI** — interactive API docs at `/api/docs`
- **Global validation** — `class-validator` with whitelist and transform enabled
- **CORS** configured for localhost dev ports

---

## Requirements

- **Node.js** 18+
- **npm** 9+

---

## Quick Start

```bash
cd backend
npm install
npm run dev          # http://localhost:3000 (watch mode)
```

---

## Seed Data

Populates the database with 6 sample leads (with priority, source, score, deal value, tags, pinned) and notes on the first three:

```bash
npm run seed
```

Re-running seed is safe — duplicate emails are skipped automatically.

---

## Swagger UI

Interactive API documentation with request/response schemas and try-it-out support:

**http://localhost:3000/api/docs**

---

## API Reference

**Base URL:** `http://localhost:3000`

---

### Leads

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `GET` | `/api/leads` | 200 | List leads with filtering and pagination |
| `POST` | `/api/leads` | 201 | Create a lead |
| `GET` | `/api/leads/:id` | 200 / 404 | Get one lead with its notes and stage history |
| `PATCH` | `/api/leads/:id` | 200 / 404 / 409 | Update lead (partial) |
| `DELETE` | `/api/leads/:id` | 204 / 404 | Delete lead and all its notes |

#### `GET /api/leads` — query parameters

| Parameter | Type | Example | Description |
|---|---|---|---|
| `search` | string | `alice` | Name or email contains (case-insensitive) |
| `status` | string | `new` | `new` \| `contacted` \| `qualified` \| `lost` |
| `priority` | string | `high` | `low` \| `medium` \| `high` \| `urgent` |
| `source` | string | `linkedin` | See [source values](#lead-field-reference) |
| `tag` | string | `enterprise` | Leads whose tags array includes this value |
| `pinned` | boolean | `true` | Only pinned leads |
| `page` | number | `1` | Page number, 1-based (default: 1) |
| `limit` | number | `10` | Items per page (default: 10) |

#### curl examples

```bash
# List all leads
curl http://localhost:3000/api/leads

# Search + filter + paginate
curl "http://localhost:3000/api/leads?search=alice&status=new&page=1&limit=5"

# Only high-priority pinned leads
curl "http://localhost:3000/api/leads?priority=high&pinned=true"

# Filter by tag
curl "http://localhost:3000/api/leads?tag=enterprise"
```

**Response 200**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "phone": "+1-555-0101",
      "status": "new",
      "priority": "high",
      "source": "website",
      "score": 85,
      "dealValue": 12000,
      "tags": ["enterprise", "hot"],
      "pinned": true,
      "stageHistory": [],
      "createdAt": "2026-07-31T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### `POST /api/leads` — create a lead

```bash
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
    "tags": ["enterprise", "hot"],
    "pinned": false
  }'
```

**Response 201** — created lead object.

---

#### `GET /api/leads/:id` — get one lead

```bash
curl http://localhost:3000/api/leads/1
```

Returns the lead with `notes` array and `stageHistory` array included.

---

#### `PATCH /api/leads/:id` — update a lead

All fields are optional. Changing `status` appends an entry to `stageHistory`.

```bash
# Update status and record a reason
curl -X PATCH http://localhost:3000/api/leads/1 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "qualified",
    "statusChangeReason": "Budget confirmed, demo went well"
  }'

# Update multiple fields at once
curl -X PATCH http://localhost:3000/api/leads/1 \
  -H "Content-Type: application/json" \
  -d '{
    "priority": "urgent",
    "score": 95,
    "dealValue": 25000,
    "tags": ["enterprise", "q4", "hot"]
  }'

# Pin a lead
curl -X PATCH http://localhost:3000/api/leads/1 \
  -H "Content-Type: application/json" \
  -d '{"pinned": true}'
```

**Response 200** — updated lead object (includes updated `stageHistory`).

**Stage history entry shape:**
```json
{
  "from": "contacted",
  "to": "qualified",
  "changedAt": "2026-07-31T14:30:00.000Z",
  "reason": "Budget confirmed, demo went well"
}
```

---

#### `DELETE /api/leads/:id` — delete a lead

```bash
curl -X DELETE http://localhost:3000/api/leads/1
```

**Response 204** — no content. All notes cascade-deleted automatically.

---

### Notes

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `GET` | `/api/leads/:id/notes` | 200 / 404 | Get all notes for a lead (oldest first) |
| `POST` | `/api/leads/:id/notes` | 201 / 404 | Add a note to a lead |

```bash
# Get notes
curl http://localhost:3000/api/leads/1/notes

# Add a note
curl -X POST http://localhost:3000/api/leads/1/notes \
  -H "Content-Type: application/json" \
  -d '{"content": "Sent follow-up email. Demo scheduled for Friday."}'
```

**POST Response 201**
```json
{
  "id": 3,
  "leadId": 1,
  "content": "Sent follow-up email. Demo scheduled for Friday.",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

---

### Analytics

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `GET` | `/api/analytics/summary` | 200 | Pipeline summary, win rate, revenue, trends |

```bash
curl http://localhost:3000/api/analytics/summary
```

**Response 200**
```json
{
  "total": 42,
  "byStatus": {
    "new": 15,
    "contacted": 12,
    "qualified": 10,
    "lost": 5
  },
  "bySource": {
    "linkedin": 18,
    "website": 12,
    "referral": 8,
    "cold_call": 4
  },
  "byPriority": {
    "urgent": 6,
    "high": 14,
    "medium": 18,
    "low": 4
  },
  "totalDealValue": 284500,
  "qualifiedDealValue": 97000,
  "winRate": 24,
  "leadsOverTime": [
    { "date": "2026-07-02", "count": 3 },
    { "date": "2026-07-03", "count": 1 }
  ]
}
```

---

### Import / Export

| Method | Endpoint | Status | Description |
|---|---|---|---|
| `GET` | `/api/leads/export` | 200 | Download all (or filtered) leads as styled `.xlsx` |
| `GET` | `/api/leads/import/template` | 200 | Download the blank import template `.xlsx` |
| `POST` | `/api/leads/import` | 200 | Bulk import from `.xlsx` (multipart/form-data) |

#### Export to Excel

```bash
# Export all leads
curl -OJ http://localhost:3000/api/leads/export

# Export only qualified leads from LinkedIn
curl -OJ "http://localhost:3000/api/leads/export?status=qualified&source=linkedin"
```

The exported workbook contains:
- **Leads Export** sheet — all columns, colour-coded status/priority cells, frozen header, auto-filter
- **Summary** sheet — export date, counts per status, total pipeline value

---

#### Download import template

```bash
curl -OJ http://localhost:3000/api/leads/import/template
```

The template includes:
- 5 realistic sample rows
- Dropdown validation on `status`, `priority`, and `source` columns
- An **Instructions** sheet explaining every column

---

#### Bulk import

Upload a completed `.xlsx` file (max 500 rows, max 5 MB):

```bash
curl -X POST http://localhost:3000/api/leads/import \
  -F "file=@/path/to/your/leads.xlsx"
```

**Response 200**
```json
{
  "total": 20,
  "created": 17,
  "skipped": 2,
  "errors": 1,
  "results": [
    { "row": 2, "name": "Alice Johnson", "email": "alice@example.com", "status": "created" },
    { "row": 5, "name": "Bob Smith",     "email": "bob@example.com",   "status": "skipped", "reason": "email already exists" },
    { "row": 9, "name": "",              "email": "bad",               "status": "error",   "reason": "\"bad\" is not a valid email" }
  ]
}
```

Import rules:
- `name` and `email` columns are **required**
- Duplicate emails → `skipped` (not an error)
- Invalid email format → `error`
- Completely blank rows are silently skipped
- Optional columns fall back to defaults (`status: new`, `priority: medium`, `score: 0`, etc.)

---

## Lead Field Reference

### Status values
| Value | Description |
|---|---|
| `new` | Fresh lead, not yet contacted |
| `contacted` | Outreach has been made |
| `qualified` | Lead is a good fit, moving forward |
| `lost` | Deal is closed or lead is unresponsive |

### Priority values
`low` · `medium` · `high` · `urgent`

### Source values
`website` · `linkedin` · `cold_call` · `referral` · `email` · `event` · `other`

### Updatable fields via PATCH
| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `email` | string | Must be unique |
| `phone` | string | Optional |
| `status` | enum | Triggers stage history entry |
| `statusChangeReason` | string | Stored in stage history when status changes |
| `priority` | enum | |
| `source` | enum | |
| `score` | number | 0–100 |
| `dealValue` | number | USD, ≥ 0 |
| `tags` | string[] | Replaces existing tags array |
| `pinned` | boolean | |

---

## Error Responses

All errors follow the NestJS standard shape:

```json
{
  "statusCode": 404,
  "message": "Lead with id 99 not found",
  "error": "Not Found"
}
```

| Status | When |
|---|---|
| `400` | Validation failed — missing required field, invalid enum, bad email format, wrong file type |
| `404` | Lead not found |
| `409` | Conflict — email already exists |

---

## Project Structure

```
src/
├── app.module.ts              # Root module — TypeORM (SQLite), LeadsModule,
│                              #   NotesModule, AnalyticsModule
├── main.ts                    # Bootstrap — Swagger, ValidationPipe (whitelist+transform), CORS
├── seed.ts                    # Seed script — 6 leads with all fields + notes
│
├── analytics/
│   ├── analytics.controller.ts   # GET /api/analytics/summary
│   └── analytics.module.ts
│
├── leads/
│   ├── lead.entity.ts         # TypeORM entity — all columns, virtual getters for
│   │                          #   tags (JSON) and stageHistory (JSON)
│   ├── leads.controller.ts    # All 7 endpoints including export / import / template
│   ├── leads.service.ts       # findAll, findOne, create, update, remove,
│   │                          #   getAnalyticsSummary, exportExcel,
│   │                          #   generateImportTemplate, bulkImport
│   ├── leads.module.ts
│   ├── leads.service.spec.ts  # 8 Jest unit tests
│   └── dto/
│       ├── create-lead.dto.ts   # All create fields with class-validator decorators
│       ├── update-lead.dto.ts   # All update fields (all optional) + statusChangeReason
│       ├── query-lead.dto.ts    # search, status, priority, source, tag, pinned, page, limit
│       └── import-lead.dto.ts   # ImportLeadRow, ImportRowResult, BulkImportResult interfaces
│
└── notes/
    ├── note.entity.ts
    ├── notes.controller.ts    # GET /api/leads/:id/notes, POST /api/leads/:id/notes
    ├── notes.service.ts
    ├── notes.module.ts
    └── dto/
        └── create-note.dto.ts
```

---

## Environment Variables

Create a `backend/.env` file to override defaults:

```env
PORT=3000
```

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the NestJS server binds to |

---

## Scripts

```bash
npm run dev          # Start in watch mode (nodemon-style)
npm run build        # Compile TypeScript → dist/
npm run start:prod   # Run compiled production build
npm run seed         # Seed DB with 6 sample leads + notes
npm test             # Run Jest unit tests (8 tests)
npm run test:cov     # Run tests with coverage report
npm run lint         # ESLint with auto-fix
npm run format       # Prettier
```

---

## Tests

```bash
npm test
```

Runs **8 Jest unit tests** for `LeadsService`:

| Suite | Tests |
|---|---|
| `findOne` | Returns lead when found; throws `NotFoundException` when missing |
| `create` | Creates and returns lead; throws `ConflictException` on duplicate email |
| `remove` | Removes existing lead; throws `NotFoundException` for missing lead |
| `findAll` | Returns paginated result with correct `total` and `totalPages` |
| `getAnalyticsSummary` | Returns summary object with correct `total` and `byStatus` |

---

## Docker

```bash
# From the repo root
docker compose up --build
```

- Backend available at `http://localhost:3000`
- Swagger UI at `http://localhost:3000/api/docs`
- SQLite database persisted in a named Docker volume (`sqlite-data`)

To rebuild only the backend after code changes:

```bash
docker compose up --build backend
```
