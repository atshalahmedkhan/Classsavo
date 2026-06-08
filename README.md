# Classavo

A full-stack Learning Management System for instructors and students. Built with Django REST Framework and React, deployed to production with real course workflows — curriculum, materials, assignments, submissions, messaging, and an AI course tutor.

---

## Highlights

- **Two roles** — instructors manage courses; students enroll, read, and submit work
- **Rich curriculum** — syllabus, readings, and assignments with due dates and file attachments
- **Assignment workflow** — students upload PDF/images; instructors review with annotations and feedback
- **AI tutor** — contextual chat powered by Groq (Llama 3.3 70B) using course and chapter content
- **Production-ready** — JWT auth, role-based permissions, PostgreSQL on Render, React on Vercel
- **Warm Ghibli-inspired UI** — cohesive design across student and instructor experiences

---

## Live demo

| Service  | URL |
|----------|-----|
| Frontend | Deployed on Vercel |
| API      | `https://classsavo.onrender.com` |

> The Render free tier may cold-start after idle periods. The first request can take 30–60 seconds.

---

## Features

### Instructors

- Create and edit courses with thumbnails and access codes
- Build curriculum: **syllabus**, **readings**, and **assignments**
- Rich-text chapter editor (Plate.js) with file uploads (PDF, DOCX, images)
- Set due dates with a custom date/time picker
- Toggle chapter visibility and track student progress
- Review assignment submissions with annotated feedback and scores
- Message students and receive notifications

### Students

- Discover courses and enroll with an access code
- Read chapters with progress tracking and reading time
- Preview course materials in-browser (authenticated blob previews)
- Submit assignments (PDF, JPG, PNG) and view instructor feedback
- Chat with a contextual AI tutor per course
- Message instructors and manage account settings

---

## Tech stack

| Layer | Stack |
|-------|-------|
| Backend | Django 5, Django REST Framework, SimpleJWT, PostgreSQL |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, React Router |
| Editor | Plate.js (Slate) |
| AI | Groq API — Llama 3.3 70B |
| Deploy | Render (API), Vercel (frontend), WhiteNoise, Gunicorn |
| Testing | pytest (backend), Playwright (frontend) |

---

## Project structure

```
Classavo/
├── backend/
│   ├── accounts/          # User model, JWT auth, profile
│   ├── courses/           # Courses, chapters, files, submissions, messaging
│   ├── lms_project/       # Django settings
│   └── tests/
├── frontend/
│   └── src/
│       ├── api/           # Axios client and API modules
│       ├── components/    # Shared UI, editors, previews
│       ├── pages/         # Student and instructor views
│       ├── context/       # Auth context
│       └── hooks/         # Progress, messages, notifications
└── README.md
```

---

## Local development

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

API: `http://localhost:8000`

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

App: `http://localhost:5173`

In development, Vite proxies `/api` and `/media` to the local backend — no `VITE_API_BASE_URL` required.

### Quick start flow

1. Register as an **Instructor** or **Student**
2. **Instructor:** create a course → add a syllabus → add readings/assignments → upload materials → share the access code
3. **Student:** join with the access code → read chapters → submit an assignment

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for local development |
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) |
| `DATABASE_URL` | PostgreSQL URL (production) |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for production |
| `GROQ_API_KEY` | Enables the AI course tutor |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API URL (required on Vercel, e.g. `https://classsavo.onrender.com/api`) |

---

## Deployment

### Render (backend)

**Build command:**

```bash
pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate && python manage.py backfill_thumbnail_data
```

**Start command:**

```bash
gunicorn lms_project.wsgi:application
```

Set `DATABASE_URL`, `SECRET_KEY`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, and `GROQ_API_KEY` in the Render dashboard.

### Vercel (frontend)

Set `VITE_API_BASE_URL` to your Render API URL. Vercel redeploys automatically on push to `main`.

---

## API overview

All routes except `register`, `login`, and `refresh` require:

```
Authorization: Bearer <access_token>
```

| Area | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register/`, `login/`, `refresh/` · `GET /api/auth/me/` |
| Courses | `CRUD /api/courses/` · `POST /api/courses/{id}/join/` · `GET .../enrollments/` |
| Chapters | `CRUD /api/chapters/` · `PATCH .../toggle-visibility/` · `POST .../upload/` |
| Submissions | `POST /api/chapters/{id}/submit/` · `GET .../my-submission/` · `GET .../submissions/` |
| Files | `GET /api/chapter-files/{id}/preview/` · `GET /api/submissions/{id}/submitted-file/` |
| Progress | `GET /api/student/progress/` · `GET /api/courses/{id}/progress/` |
| AI | `POST /api/courses/ai-chat/` |
| Messages | `GET/POST /api/messages/` · `GET /api/messages/{user_id}/` |
| Notifications | `GET /api/notifications/` · `PATCH .../read/` |

---

## Testing

```bash
# Backend
cd backend
pytest

# Frontend (requires running app)
cd frontend
npm run test:e2e
```

---

## Design notes

- Chapter content is stored as Plate.js JSON
- Course thumbnails and chapter file previews are stored in the database so they survive Render redeploys
- Submission files are served through authenticated API endpoints to avoid cross-origin embed issues
- Students only see public chapters in courses they are enrolled in
- Instructors can only manage their own courses

---

## License

Private project. All rights reserved.
