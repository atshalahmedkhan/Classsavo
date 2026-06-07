# Classavo Test Suite

Automated tests for the Classavo LMS backend (pytest) and frontend (Playwright).

## Prerequisites

- Python 3.11+ with the backend virtual environment set up
- Node.js 18+ for the frontend
- Backend dependencies: `pip install -r requirements.txt`
- Test dependencies: `pip install -r requirements-test.txt`
- Frontend dependencies: `npm install` (inside `frontend/`)

---

## Backend Tests (pytest + pytest-django)

### Install test packages

```bash
cd backend
.\venv\Scripts\pip install -r requirements-test.txt
```

### Run all backend tests

```bash
cd backend
.\venv\Scripts\pytest.exe
```

### Run a single test file

```bash
cd backend
.\venv\Scripts\pytest.exe tests/test_auth.py -v
```

### Run a single test

```bash
cd backend
.\venv\Scripts\pytest.exe tests/test_auth.py::TestLogin::test_login_returns_access_and_refresh_tokens -v
```

### Configuration

- `backend/pytest.ini` — `DJANGO_SETTINGS_MODULE = lms_project.settings`
- `backend/conftest.py` — shared fixtures (instructor, student, course, chapters, enrollment, auth clients)
- `backend/tests/factories.py` — Factory Boy model factories

---

## Frontend Tests (Playwright)

### Install Playwright

```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

### Start servers manually (optional)

Terminal 1:

```bash
cd backend
.\venv\Scripts\python.exe manage.py migrate
.\venv\Scripts\python.exe manage.py runserver
```

Terminal 2:

```bash
cd frontend
npm run dev
```

### Run all frontend tests

```bash
cd frontend
npx playwright test
```

Or:

```bash
cd frontend
npm run test:e2e
```

### Run with UI mode

```bash
cd frontend
npx playwright test --ui
```

### View report / failure videos

```bash
cd frontend
npx playwright show-report
```

### Configuration

- `frontend/playwright.config.ts`
  - `baseURL`: `http://localhost:5173`
  - `video`: `retain-on-failure`
  - Auto-starts Django and Vite when servers are not already running

---

## Test file index

### Backend (`backend/tests/`)

| File | Coverage |
|------|----------|
| `test_auth.py` | Register, login, me, change password |
| `test_courses.py` | CRUD, list scoping, access code, thumbnail |
| `test_enrollments.py` | Join, access code visibility |
| `test_chapters.py` | CRUD, visibility, Plate.js content, assignments |
| `test_files.py` | Upload, delete, preview permissions |
| `test_progress.py` | Chapter progress POST, student/instructor summaries |
| `test_messages.py` | Send, thread, read, notifications side effect |
| `test_notifications.py` | Create, list, mark read / read all |

### Frontend (`frontend/tests/`)

| File | Coverage |
|------|----------|
| `auth.spec.ts` | Register, login, auth redirects |
| `student.spec.ts` | Discover, enroll, reader, timer, messages, notifications, settings |
| `instructor.spec.ts` | Wizard, chapters, files, progress, messaging |
| `edge_cases.spec.ts` | Cross-role access, validation, empty states |
| `helpers.ts` | API seeding and UI login helpers |
