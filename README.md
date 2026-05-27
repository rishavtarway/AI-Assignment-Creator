# VedaAI — AI Assessment Creator

A full-stack platform for teachers to create AI-generated question papers, built with Next.js, Node.js, MongoDB, Redis, BullMQ, and WebSockets.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js 14)                        │
│   Assignments List  →  Create Form  →  Detail / Output Page          │
│   Zustand (state)   WebSocket (real-time)   jsPDF (download)         │
└────────────────────────────┬─────────────────────────────────────────┘
                             │ REST + WebSocket
┌────────────────────────────▼─────────────────────────────────────────┐
│                      Backend (Express + TypeScript)                   │
│                                                                       │
│  POST /api/assignments   →  Save to MongoDB                           │
│                          →  Enqueue BullMQ job                        │
│                          →  WS notify "processing"                    │
│                                                                       │
│  BullMQ Worker           →  Call Anthropic API                        │
│                          →  Parse structured JSON response            │
│                          →  Save generatedPaper to MongoDB            │
│                          →  WS notify "completed"                     │
│                                                                       │
│  Redis                   →  BullMQ job queue + job state cache        │
│  MongoDB                 →  Assignments + generated papers            │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **BullMQ** handles AI generation as a background job — the HTTP response is instant, generation happens async.
- **WebSocket** pushes real-time status updates (`processing → completed/failed`) so the UI reacts without polling.
- **Structured prompt** forces Claude to return a strict JSON schema; the worker validates and saves only parsed data — raw LLM text is never rendered.
- **Zustand** manages frontend state (assignment list, form fields) with clean selectors.
- **Redis** caches job state for quick lookups and backs BullMQ queues.

---

## Tech Stack

| Layer      | Tech                                        |
|------------|---------------------------------------------|
| Frontend   | Next.js 14, TypeScript, Zustand, Tailwind   |
| Backend    | Node.js, Express, TypeScript                |
| Database   | MongoDB + Mongoose                          |
| Queue      | BullMQ + Redis                              |
| Realtime   | WebSocket (ws)                              |
| AI         | Groq API (llama-3.3-70b-versatile)          |
| PDF Export | jsPDF + html2canvas                         |

---

## Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Redis (local or Upstash)
- A Groq API key — free at [console.groq.com](https://console.groq.com)

---

## Quick Start

### 1. Clone & install

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configure environment

**Backend** — copy `.env.example` to `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/vedaai
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3000
```

**Frontend** — copy `.env.local.example` to `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_WS_URL=ws://localhost:5000/ws
```

### 3. Start services

```bash
# Terminal 1 — MongoDB
mongod

# Terminal 2 — Redis
redis-server

# Terminal 3 — Backend (includes inline BullMQ worker)
cd backend
npm run dev

# Terminal 4 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:3000**

---

## API Reference

| Method | Endpoint                          | Description                      |
|--------|-----------------------------------|----------------------------------|
| GET    | /api/assignments                  | List all assignments             |
| POST   | /api/assignments                  | Create + trigger generation      |
| GET    | /api/assignments/:id              | Get single assignment + paper    |
| DELETE | /api/assignments/:id              | Delete assignment                |
| POST   | /api/assignments/:id/regenerate   | Re-run AI generation             |
| GET    | /health                           | Health check                     |

**WebSocket** at `ws://localhost:5000/ws`  
Send: `{ type: "subscribe", assignmentId: "..." }`  
Receive: `{ type: "assignment_update", status: "processing"|"completed"|"failed", ... }`

---

## Features

- ✅ Assignment creation with file upload (JPEG/PNG/PDF)
- ✅ Configurable question types, counts, and marks
- ✅ Real-time progress via WebSocket
- ✅ AI-generated structured question paper (sections, difficulty tags, marks)
- ✅ Student info fields (name, roll number, section)
- ✅ Answer key generation
- ✅ PDF download
- ✅ Regenerate paper
- ✅ Delete assignments
- ✅ Search and filter assignments
- ✅ Mobile-responsive design matching Figma specs
- ✅ Zustand state management
- ✅ BullMQ background job processing
- ✅ Redis caching

---

## Project Structure

```
vedaai/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server + inline worker
│   │   ├── models/
│   │   │   └── Assignment.ts     # Mongoose schema
│   │   ├── routes/
│   │   │   └── assignments.ts    # REST endpoints
│   │   ├── services/
│   │   │   ├── aiService.ts      # Anthropic prompt + parsing
│   │   │   ├── queue.ts          # BullMQ + Redis setup
│   │   │   └── wsManager.ts      # WebSocket manager
│   │   └── workers/
│   │       └── assignmentWorker.ts  # Standalone worker (optional)
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx                    # Redirect to /assignments
    │   │   ├── globals.css
    │   │   └── assignments/
    │   │       ├── page.tsx                # List (empty + filled states)
    │   │       ├── create/page.tsx         # Multi-step creation form
    │   │       └── [id]/page.tsx           # Output page
    │   ├── components/
    │   │   ├── Sidebar.tsx
    │   │   └── Topbar.tsx
    │   ├── hooks/
    │   │   └── useWebSocket.ts
    │   ├── store/
    │   │   └── assignmentStore.ts          # Zustand store
    │   └── types/
    │       └── index.ts
    ├── .env.local.example
    └── package.json
```
