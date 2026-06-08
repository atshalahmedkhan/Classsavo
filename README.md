---

## Local Setup

### Backend

**Prerequisites:** Python 3.10+

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your SECRET_KEY and database settings

python manage.py migrate
python manage.py runserver
```

API runs at `http://localhost:8000`

### Frontend

**Prerequisites:** Node.js 18+

```bash
cd frontend
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000/api

npm run dev
```

App runs at `http://localhost:5173`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for development |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend origin |
| `DATABASE_URL` | PostgreSQL URL (production) |
| `GROQ_API_KEY` | Groq API key for AI tutor |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API base URL |

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/refresh/` | Refresh JWT token |
| GET | `/api/auth/me/` | Current user profile |
| CRUD | `/api/courses/` | Course management |
| POST | `/api/courses/{id}/join/` | Student joins course |
| CRUD | `/api/chapters/` | Chapter management |
| PATCH | `/api/chapters/{id}/toggle-visibility/` | Toggle public/private |
| POST | `/api/chapters/{id}/upload/` | Upload chapter file |
| GET | `/api/chapter-files/{id}/preview/` | Authenticated file preview |
| POST | `/api/chapters/{id}/submit/` | Student submits assignment |
| POST | `/api/submissions/{id}/feedback/` | Instructor returns feedback |
| POST | `/api/courses/ai-chat/` | AI tutor chat |
| GET | `/api/notifications/` | User notifications |
| GET | `/api/messages/` | Message threads |

All routes except auth endpoints require `Authorization: Bearer <token>`

---

## Running Tests

### Backend (pytest)

```bash
cd backend
.\venv\Scripts\activate
pytest
```

### Frontend (Playwright)

```bash
cd frontend
npx playwright install
npx playwright test
```

---

## Demo Flows

### Instructor
1. Register as Instructor
2. Create a course — add title, description, thumbnail
3. Share the auto-generated access code with students
4. Add a Syllabus chapter first (required)
5. Add Reading and Assignment chapters
6. Upload PDFs to chapters as reading materials
7. Set due dates and toggle visibility to public
8. Review student submissions under the Submissions tab

### Student
1. Register as Student
2. Go to Discover — enter access code to join a course
3. Open the course — start with the Syllabus
4. Read chapters — progress is tracked automatically
5. Use the AI Tutor (bottom right) to ask questions about the content
6. Submit assignment work as PDF or image
7. View instructor feedback and score after review

---

## Design

Lumio uses a custom Ghibli-inspired warm design system:

| Token | Value | Usage |
|---|---|---|
| Primary | `#c2622a` | Buttons, accents |
| Background | `#faf6f1` | Page background |
| Surface | `#ffffff` | Cards |
| Border | `#e8ddd0` | Card borders |
| Text | `#2c1810` | Headings |

---

## Known Limitations

- Render free tier has ~30-60 second cold start after idle
- Submission files stored on Render disk (may be lost on redeploy)
- No automated email notifications yet

---

## Built By

Atshal Ahmed Khan — built as part of the Classavo 
Software Developer Intern (Summer '26) technical assignment.
