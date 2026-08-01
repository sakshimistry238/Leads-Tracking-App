# Leads Tracking — Backend

NestJS REST API backed by SQLite (via TypeORM + better-sqlite3). Provides full CRUD for leads, per-lead notes, search/filter/pagination, input validation, and a Swagger UI.

---

## Requirements

- Node.js 18+
- npm 9+

---

## Quick start

```bash
cd backend
npm install
npm run dev          # starts on http://localhost:3000
```

### Seed sample data

```bash
npm run seed         # inserts 4 sample leads with notes
```

### Run unit tests

```bash
npm test             # Jest – 7 tests for LeadsService
```

### Build for production

```bash
npm run build
npm run start:prod
```

---

## Swagger UI

Visit **http://localhost:3000/api/docs** while the server is running.

---

## Environment variables

| Variable | Default | Description           |
|----------|---------|-----------------------|
| `PORT`   | `3000`  | Port the server binds |

---

## API reference

### Base URL

```
http://localhost:3000
```

---

### Leads

#### List leads

```bash
curl "http://localhost:3000/api/leads"

# With search + status filter + pagination
curl "http://localhost:3000/api/leads?search=alice&status=new&page=1&limit=5"
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
      "createdAt": "2025-01-15T10:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

#### Create a lead

```bash
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob Smith","email":"bob@example.com","phone":"+1-555-0200","status":"new"}'
```

**Response 201**
```json
{
  "id": 2,
  "name": "Bob Smith",
  "email": "bob@example.com",
  "phone": "+1-555-0200",
  "status": "new",
  "createdAt": "2025-01-15T11:00:00.000Z"
}
```

---

#### Get a lead (with notes)

```bash
curl http://localhost:3000/api/leads/1
```

**Response 200**
```json
{
  "id": 1,
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "phone": "+1-555-0101",
  "status": "new",
  "createdAt": "2025-01-15T10:00:00.000Z",
  "notes": [
    {
      "id": 1,
      "leadId": 1,
      "content": "Initial contact made.",
      "createdAt": "2025-01-15T10:05:00.000Z"
    }
  ]
}
```

---

#### Update a lead

```bash
curl -X PATCH http://localhost:3000/api/leads/1 \
  -H "Content-Type: application/json" \
  -d '{"status":"contacted"}'
```

**Response 200** — updated lead object.

---

#### Delete a lead

```bash
curl -X DELETE http://localhost:3000/api/leads/1
```

**Response 204** — no content.

---

### Notes

#### List notes for a lead

```bash
curl http://localhost:3000/api/leads/1/notes
```

**Response 200** — array of note objects.

---

#### Add a note to a lead

```bash
curl -X POST http://localhost:3000/api/leads/1/notes \
  -H "Content-Type: application/json" \
  -d '{"content":"Sent follow-up email."}'
```

**Response 201**
```json
{
  "id": 3,
  "leadId": 1,
  "content": "Sent follow-up email.",
  "createdAt": "2025-01-15T12:00:00.000Z"
}
```

---

## Error responses

| Status | Meaning                          |
|--------|----------------------------------|
| `400`  | Validation error (bad input)     |
| `404`  | Lead / resource not found        |
| `409`  | Email already exists (conflict)  |

---

## Docker

```bash
# From the repo root
docker compose up --build
```

Backend available at `http://localhost:3000`.

---

## Project structure

```
src/
├── app.module.ts          # Root module — TypeORM + feature modules
├── main.ts                # Bootstrap, Swagger, ValidationPipe, CORS
├── seed.ts                # Seed script
├── leads/
│   ├── lead.entity.ts
│   ├── leads.service.ts
│   ├── leads.controller.ts
│   ├── leads.module.ts
│   ├── leads.service.spec.ts
│   └── dto/
│       ├── create-lead.dto.ts
│       ├── update-lead.dto.ts
│       └── query-lead.dto.ts
└── notes/
    ├── note.entity.ts
    ├── notes.service.ts
    ├── notes.controller.ts
    ├── notes.module.ts
    └── dto/create-note.dto.ts
```
