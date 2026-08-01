# Candidate Screening Platform

A simplified full-stack platform where **recruiters** post and manage jobs and review
applications, and **candidates** browse open jobs, apply with a resume URL, and track
their application status.

- **Backend:** FastAPI (Python) + SQLAlchemy
- **Frontend:** React (Vite) + React Router
- **Database:** PostgreSQL (target) — SQLite used as a zero-config default for quick local runs
- **Auth:** JWT bearer tokens with role-based access control (recruiter / candidate)

---

## Features

### Recruiter
- Register / log in as a recruiter
- **Create**, **view**, and **edit** jobs
- **Close** jobs (removes them from candidate view and stops new applications)
- **Review applications** per job (candidate name, email, resume link, cover letter)
- **Update candidate status** through a screening pipeline:
  `applied → screening → interview → rejected / hired`

### Candidate
- Register / log in as a candidate
- **View open jobs** (closed jobs are hidden) with title search
- **Apply** to a job by submitting a **resume URL** (+ optional cover letter)
- **Track application status** with plain-language explanations
- Duplicate applications to the same job are prevented

---

## Project structure

```
candidate-screening-platform/
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI app + CORS + router wiring
│   │   ├── config.py          # Env-based settings (DATABASE_URL, JWT, CORS)
│   │   ├── database.py        # SQLAlchemy engine/session/base
│   │   ├── models.py          # User, Job, Application (+ enums)
│   │   ├── schemas.py         # Pydantic request/response models
│   │   ├── security.py        # Password hashing, JWT, auth dependencies
│   │   └── routers/
│   │       ├── auth.py        # /auth/register, /auth/login, /auth/me
│   │       ├── jobs.py        # /jobs CRUD + close
│   │       └── applications.py# apply / review / track / status update
│   ├── seed.py                # Seeds demo users, jobs, applications
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.js       # fetch wrapper + typed endpoints
│   │   ├── context/AuthContext.jsx
│   │   ├── components/         # Navbar, Badge, modals, ProtectedRoute
│   │   ├── pages/              # Login, Recruiter + Candidate pages
│   │   ├── App.jsx / main.jsx
│   │   └── styles.css
│   └── package.json
├── docker-compose.yml          # Optional PostgreSQL instance
└── README.md
```

---

## Prerequisites
- Python 3.10+
- Node.js 18+ and npm
- (Optional) Docker, to run PostgreSQL

---

## Setup & Run

### 1. Backend

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env          # optional; sensible defaults work out of the box
python seed.py                # creates tables + demo data
uvicorn app.main:app --reload --port 8000
```

- API: http://localhost:8000
- Interactive docs (Swagger): http://localhost:8000/docs

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173

> The frontend reads the API base URL from `VITE_API_URL` (defaults to
> `http://localhost:8000`). Copy `frontend/.env.example` to `frontend/.env` to change it.

### 3. (Optional) Use PostgreSQL instead of SQLite

```bash
docker compose up -d          # starts postgres on localhost:5432
```

Then set in `backend/.env`:

```
DATABASE_URL=postgresql+psycopg2://screening:screening@localhost:5432/screening
```

Re-run `python seed.py` and start the backend. The SQLAlchemy models are database-agnostic,
so no code changes are needed.

---

## Demo accounts

Created by `seed.py` (password for all: **`password123`**):

| Role      | Email                | Notes                                  |
|-----------|----------------------|----------------------------------------|
| Recruiter | recruiter@demo.com   | Owns 2 open jobs with applicants        |
| Recruiter | recruiter2@demo.com  | Owns a closed job                       |
| Candidate | candidate@demo.com   | Has applications in progress            |
| Candidate | candidate2@demo.com  | Has an application                      |

You can also register fresh accounts from the app's sign-in screen.

---

## API reference

All endpoints except `register`/`login` require an `Authorization: Bearer <token>` header.

### Auth
| Method | Path             | Role    | Description                          |
|--------|------------------|---------|--------------------------------------|
| POST   | `/auth/register` | public  | Create account; returns JWT + user   |
| POST   | `/auth/login`    | public  | Log in; returns JWT + user           |
| GET    | `/auth/me`       | any     | Current user                         |

### Jobs
| Method | Path                | Role       | Description                                        |
|--------|---------------------|------------|----------------------------------------------------|
| POST   | `/jobs`             | recruiter  | Create a job                                       |
| GET    | `/jobs`             | any        | List jobs. Candidates see **open only**. Query: `mine=true` (recruiter's own), `status`, `search` |
| GET    | `/jobs/{id}`        | any        | Job detail (candidates blocked from closed jobs)   |
| PATCH  | `/jobs/{id}`        | recruiter* | Edit job fields (partial update)                   |
| POST   | `/jobs/{id}/close`  | recruiter* | Close a job                                        |

\* owner only — a recruiter can manage only their own jobs.

### Applications
| Method | Path                                | Role       | Description                                  |
|--------|-------------------------------------|------------|----------------------------------------------|
| POST   | `/jobs/{id}/applications`           | candidate  | Apply with `resume_url` (+ optional cover letter). One per job. |
| GET    | `/jobs/{id}/applications`           | recruiter* | Review all applications for a job            |
| GET    | `/applications/me`                  | candidate  | Track my applications (with job info)        |
| PATCH  | `/applications/{id}/status`         | recruiter* | Update a candidate's status                  |

Example — apply to a job:
```bash
curl -X POST http://localhost:8000/jobs/1/applications \
  -H "Authorization: Bearer <candidate-token>" \
  -H "Content-Type: application/json" \
  -d '{"resume_url": "https://example.com/resume.pdf", "cover_letter": "Hi!"}'
```

---

## Data model

```
User (id, email[unique], full_name, hashed_password, role, created_at)
  └─ 1..* Job          (recruiter_id → User.id)
  └─ 1..* Application   (candidate_id → User.id)

Job (id, title, description, location, employment_type, salary_range,
     status[open|closed], recruiter_id, created_at, updated_at)
  └─ 1..* Application   (job_id → Job.id)

Application (id, job_id, candidate_id, resume_url, cover_letter,
             status[applied|screening|interview|rejected|hired],
             created_at, updated_at)
  └─ UNIQUE(job_id, candidate_id)   -- a candidate applies to a job at most once
```

---

## Design notes & trade-offs

- **Auth / RBAC.** JWT bearer tokens; a `require_role` dependency enforces recruiter vs
  candidate access at the route layer, and ownership checks ensure recruiters only touch
  their own jobs/applications.
- **DB choice.** The code targets PostgreSQL (psycopg2 + docker-compose provided) but
  defaults to SQLite so the project runs with zero external setup for evaluation. Because
  everything goes through SQLAlchemy, switching is just a `DATABASE_URL` change.
- **Schema management.** Tables are created via `Base.metadata.create_all` for simplicity.
  A production system would use Alembic migrations.
- **Computed fields.** `application_count` and `has_applied` are attached to job responses
  so the UI can render badges/counts without extra round-trips.
- **Uniqueness.** A DB-level `UNIQUE(job_id, candidate_id)` plus an application-layer check
  prevents duplicate applications.
- **Frontend.** Kept dependency-light (React Router + a small fetch wrapper) and uses
  optimistic UI updates for status changes with rollback on error.

## Possible next steps (out of scope for the time budget)
- Alembic migrations and automated tests (pytest + React Testing Library)
- Pagination and richer filtering/sorting
- File upload for resumes instead of a URL
- Email notifications on status changes
- Refresh tokens / token expiry handling in the UI
