# Test Plan

## 1. Project Overview

This project is an existing full-stack Traffic Accident Analysis Portal.

- React frontend lives in `frontend/`.
- FastAPI backend lives in `backend/`.
- SQLite is used through SQLAlchemy in `backend/app/database.py`.
- Delivery testing must cover the complete web app: UI pages, forms, authentication, API behavior, database persistence, integration between React and FastAPI, and final deployment readiness.

The app includes Dashboard, Live Map, Analytics, AI Risk Prediction, Reports, Login/Register, and Admin Security Center modules.

## 2. Testing Scope

Testing scope includes:

- Frontend pages/components: `App.jsx`, `Dashboard.jsx`, `MapView.jsx`, `Analytics.jsx`, `Predictions.jsx`, `Reports.jsx`, `Login.jsx`, `Register.jsx`, `Admin.jsx`, `AuthContext.jsx`, and `ErrorBoundary.jsx`.
- User forms: login, registration, prediction form, report date form, dashboard/map date window, admin role/status controls.
- Navigation: sidebar navigation, role-based menu visibility, mobile sidebar, logout.
- API endpoints: authentication, admin, accidents, stats, predictions, reports, root, and health endpoints.
- Database CRUD operations: accidents, users, login audit, predictions, roads, weather.
- Authentication/authorization: JWT login, role-based access, inactive account blocking, admin-only routes.
- Error messages: invalid login, duplicate registration, invalid reports, unauthorized requests, missing fields, empty data ranges.
- Responsive layout: desktop, tablet, and mobile.
- Browser compatibility: Chrome, Firefox, Edge.
- Deployment readiness: documented run commands, environment variables, ignored secrets, database persistence, and clean delivery checklist.

## 3. Testing Types

### Unit Testing

Check individual functions, components, utilities, validators, and backend helper functions.

Examples:

- Password hashing and verification in `backend/app/core/auth.py`.
- JWT token creation.
- SQLAlchemy model CRUD behavior with an isolated test database.
- Frontend date range helper behavior in `App.jsx`.
- Report date calculation in `Reports.jsx`.

### Integration Testing

Check frontend-backend communication, API calls, and database interaction.

Examples:

- Dashboard loads `/api/stats/overview` and `/api/accidents`.
- Map loads accidents, hotspots, and heatmap data.
- Reports page calls `/api/reports/generate`.
- Admin page calls `/api/admin/users`, `/api/admin/login-activity`, and `/api/admin/security-summary`.

### Functional Testing

Check whether each feature works according to user requirements.

Examples:

- Admin can change role and disable/enable accounts.
- Traffic police can open predictions and reports.
- Normal users cannot open analytics, predictions, reports, or admin.
- Date filters return data inside the database range.

### UI/UX Testing

Check layout, buttons, forms, color consistency, loading states, empty states, and user feedback.

Examples:

- Date picker icon remains visible on dark inputs.
- Loading spinners appear during API requests.
- Empty states appear for no accident/report data.
- Tables remain readable on small screens.

### Regression Testing

Check that new changes do not break existing features.

Examples:

- Admin security controls do not break login/register.
- Date selector changes do not break dashboard, map, analytics, or reports.
- README and setup commands still match the actual app.

### Database Testing

Check insert, update, delete, read, constraints, duplicate data, and invalid data handling.

Examples:

- Accident records can be inserted/read/updated/deleted in an isolated test DB.
- User `username` and `email` uniqueness are enforced.
- App restart does not reset `backend/traffic_db.db`.

### API Testing

Check status codes, request body validation, response format, error responses, and edge cases.

Examples:

- `/health` returns `200`.
- `/token` returns JWT for valid credentials and `401` for invalid credentials.
- Admin endpoints return `401/403` without admin token.
- Invalid prediction payload returns validation error.

### Security Testing

Check basic issues:

- Input validation.
- SQL injection prevention.
- XSS prevention.
- CORS configuration.
- Sensitive data exposure.
- Environment variables.
- Error messages should not expose internal details.

### Performance Testing

Check:

- Page load time.
- API response time.
- Large data handling.
- Unnecessary repeated requests.

### Compatibility Testing

Check:

- Chrome.
- Firefox.
- Edge.
- Desktop layout.
- Mobile layout.
- Tablet layout.

### User Acceptance Testing

Check final business/user requirements before delivery.

Examples:

- Admin can manage users.
- Users can view the dashboard and map.
- Traffic police can generate reports and predictions.
- Accident data remains available after restart.

## 4. Test Case Format

Use this table format:

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
| ------------ | ------ | -------- | ------------- | ---------- | --------- | --------------- | ------------- | ------ | -------- |

Status values:

- Not Run
- Pass
- Fail

Priority values:

- High
- Medium
- Low

## 5. Detailed Test Cases

The full practical test case suite is maintained in `TEST_CASES.md`. The table below gives representative coverage across all delivery areas.

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
| ------------ | ------ | -------- | ------------- | ---------- | --------- | --------------- | ------------- | ------ | -------- |
| FE-001 | App Shell | App loads successfully | Backend and frontend running | Open `http://localhost:5173` | Existing app | Login screen or authenticated app shell appears | Not recorded | Not Run | High |
| FE-002 | Navigation | Role-based navigation works | Login as admin | Click Dashboard, Live Map, Analytics, AI Risk, Reports, Admin | Admin user | Correct page opens for each menu item | Not recorded | Not Run | High |
| FE-003 | Dashboard | Date window returns data | Login as any role | Select `2025-03-01` to `2025-03-31`, click Search | Valid range | Dashboard metrics show non-zero accident data | Not recorded | Not Run | High |
| FE-004 | Dashboard | Out-of-range dates are blocked | App running | Try selecting a date after `2025-03-31` | `2026-01-01` | Date selector prevents or clamps value to data range | Not recorded | Not Run | High |
| FE-005 | Login | Invalid credentials show error | Login screen open | Submit wrong username/password | `bad/bad` | Error message appears, no token stored | Not recorded | Not Run | High |
| FE-006 | Register | Required field validation works | Register screen open | Submit empty form | Empty fields | Browser/form validation prevents submit | Not recorded | Not Run | High |
| FE-007 | Predictions | Valid prediction request works | Login as admin or traffic police | Fill prediction form and submit | Gujrat lat/lng, hour 17, Clear, Residential | Risk result and recommendations appear | Not recorded | Not Run | High |
| FE-008 | Reports | Valid report generates | Login as admin or traffic police | Select March 2025 and generate | `2025-03-01` to `2025-03-31` | Report summary, charts, and recommendations appear | Not recorded | Not Run | High |
| FE-009 | Admin | Admin changes user role | Login as admin | Open Admin, change a user's role | `user` to `traffic_police` | Role updates and persists after refresh | Not recorded | Not Run | High |
| FE-010 | Responsive UI | Mobile layout works | Browser dev tools available | Test 390px, 768px, 1440px widths | Main pages | No overlapping critical UI, nav usable | Not recorded | Not Run | Medium |
| API-001 | Backend | Health endpoint works | Backend running | GET `/health` | None | `200` with healthy JSON | Not recorded | Not Run | High |
| API-002 | Auth | Valid login returns token | Seeded user exists | POST `/token` | Valid username/password | `200`, bearer token, role | Not recorded | Not Run | High |
| API-003 | Auth | Invalid login fails | Backend running | POST `/token` | Wrong password | `401`, no token | Not recorded | Not Run | High |
| API-004 | Accidents | Accident list returns data | Backend running | GET `/api/accidents/?limit=10` | None | Array of accident records | Not recorded | Not Run | High |
| API-005 | Stats | Overview date filter works | Backend running | GET `/api/stats/overview?start_date=2025-03-01&end_date=2025-03-31` | Valid range | Non-zero metrics | Not recorded | Not Run | High |
| API-006 | Reports | Invalid date order fails | Police/admin token | GET report with start after end | `2025-03-31` to `2025-03-01` | `400` validation error | Not recorded | Not Run | High |
| API-007 | Admin | Admin APIs require auth | Backend running | GET `/api/admin/users` without token | None | `401` | Not recorded | Not Run | High |
| DB-001 | SQLite | Database file exists | Local repo checkout | Check `backend/traffic_db.db` | Existing DB | File exists and is not deleted/reset | Not recorded | Not Run | High |
| DB-002 | SQLite | CRUD works in isolated test DB | Backend venv ready | Run unittest database tests | In-memory SQLite | Insert/read/update/delete pass | Not recorded | Not Run | High |
| SEC-001 | Security | Public registration cannot self-promote | Backend running | POST `/register` with extra admin role value | Role `admin` in body | Created account role remains `user` | Not recorded | Not Run | High |
| SEC-002 | Security | SQL injection-like input is safe | Backend running | Search/filter with SQL-like text | `' OR 1=1 --` | No crash, no data corruption | Not recorded | Not Run | High |
| PERF-001 | Performance | Dashboard API response time acceptable | Backend running | Time overview request | March 2025 | Response under target threshold, e.g. 500ms local | Not recorded | Not Run | Medium |
| UAT-001 | Acceptance | Main user journey works | Backend/frontend running | Login, dashboard, map, report, prediction, logout | Admin/police user | End-to-end flow completes without critical errors | Not recorded | Not Run | High |

## Automated Test Strategy

Detected tooling:

- Frontend: ESLint and Vite only. No Vitest, Jest, or React Testing Library is declared.
- Backend: FastAPI stack is present. `pytest`, `httpx`, and `httpx2` are not declared/installed in the current backend environment, so FastAPI `TestClient` is not currently suitable without adding dependencies.

Added automated tests:

- `backend/tests/test_auth_helpers.py`
- `backend/tests/test_database.py`
- `backend/tests/test_route_registration.py`

These use Python `unittest` and an in-memory SQLite database. They do not require new packages and do not touch the production SQLite database.

Current execution results are recorded in `TEST_RESULTS.md`.

Recommended future setup:

- Frontend: add Vitest and React Testing Library for component tests.
- Backend: add pytest plus the client dependency required by the installed Starlette/FastAPI version, then add TestClient-based API tests.
