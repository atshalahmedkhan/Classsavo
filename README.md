# Classavo LMS

A full-stack Learning Management System with a Django Rest Framework backend and a React (Vite) frontend. Supports **Instructor** and **Student** roles with JWT authentication, course management, chapter editing via Plate.js, and role-based access control.

## Features

- JWT authentication (register, login, token refresh)
- Instructors: create/edit/delete courses and chapters, toggle chapter visibility, view enrolled students
- Students: browse courses, enroll, read public chapters in enrolled courses
- Plate.js rich text editor for chapter content (stored as JSON)
- Protected API routes and role-based frontend routing

## Project Structure

```
Classavo/
├── backend/          # Django + DRF API
│   ├── accounts/     # Custom User model, auth endpoints
│   ├── courses/      # Course, Chapter, Enrollment models & API
│   └── lms_project/  # Django settings
├── frontend/         # React + Vite + Tailwind + Plate.js
│   └── src/
│       ├── api/      # Axios client & API calls
│       ├── components/
│       ├── context/  # Auth context
│       └── pages/    # Student & instructor views
└── README.md
```

## Backend Setup

### Prerequisites

- Python 3.10+

### Installation

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # edit SECRET_KEY for production
python manage.py migrate
python manage.py createsuperuser   # optional, for Django admin
python manage.py runserver
```

The API runs at `http://localhost:8000`.

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register (public) |
| POST | `/api/auth/login/` | Login (public) |
| POST | `/api/auth/refresh/` | Refresh JWT (public) |
| GET | `/api/auth/me/` | Current user |
| CRUD | `/api/courses/` | Courses (instructor CRUD, student list/retrieve) |
| CRUD | `/api/chapters/` | Chapters (instructor CRUD, student read public) |
| PATCH | `/api/chapters/{id}/toggle-visibility/` | Toggle chapter public/private |
| GET/POST | `/api/enrollments/` | List enrollments / student enroll |
| GET | `/api/courses/{id}/enrollments/` | Instructor views enrolled students |

All routes except auth register/login/refresh require a valid JWT `Authorization: Bearer <token>` header.

## Frontend Setup

### Prerequisites

- Node.js 18+

### Installation

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

### Environment Variables

**Backend (`backend/.env`)**

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for development |
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | Frontend origin(s) |

**Frontend (`frontend/.env`)**

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL (default: `http://localhost:8000/api`) |

## Usage

1. Start the backend (`python manage.py runserver`)
2. Start the frontend (`npm run dev`)
3. Register as an **Instructor** or **Student**
4. **Instructor flow**: create a course → add chapters → toggle visibility to public
5. **Student flow**: join a course → open enrolled course → read public chapters

## Tech Stack

- **Backend**: Django 5, Django Rest Framework, SimpleJWT, django-cors-headers
- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, Axios, Plate.js, React Router

## Development Notes

- JWT tokens are stored in `localStorage` (access + refresh)
- Chapter content is serialized Plate.js JSON stored in a `TextField`
- Students only see chapters where `is_public=true` in courses they are enrolled in
- Instructors can only manage their own courses and chapters
