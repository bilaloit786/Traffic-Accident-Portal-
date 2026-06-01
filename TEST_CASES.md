# Test Cases

Practical test cases for the existing Traffic Accident Analysis Portal.

Status values: Not Run, Pass, Fail.

Priority values: High, Medium, Low.

| Test Case ID | Module | Scenario | Preconditions | Test Steps | Test Data | Expected Result | Actual Result | Status | Priority |
| ------------ | ------ | -------- | ------------- | ---------- | --------- | --------------- | ------------- | ------ | -------- |
| FE-001 | App Load | App loads successfully | Frontend server running | Open `http://localhost:5173` | Browser URL | Login screen appears if unauthenticated; app shell appears if token is valid | Not recorded | Not Run | High |
| FE-002 | Auth Context | Saved token restores session | Valid token in local storage | Refresh page | Existing token | `/users/me` loads user and app shell appears | Not recorded | Not Run | High |
| FE-003 | Auth Context | Invalid token logs user out | Invalid token in local storage | Refresh page | Fake token | Token is removed and login screen appears | Not recorded | Not Run | High |
| FE-004 | Login | Valid login succeeds | Backend running, user exists | Enter username/password and submit | Existing admin or police user | Token stored, app shell opens, role chip shows role | Not recorded | Not Run | High |
| FE-005 | Login | Invalid login shows error | Backend running | Enter wrong credentials and submit | `wrong/wrong` | Error message appears and user remains on login page | Not recorded | Not Run | High |
| FE-006 | Login | Required fields enforced | Login screen open | Submit without username/password | Empty inputs | Browser required field validation blocks submit | Not recorded | Not Run | High |
| FE-007 | Register | New user registration succeeds | Username/email not already used | Open register form, submit valid values | Unique username/email/password | New account is created as role `user`; app shell opens | Not recorded | Not Run | High |
| FE-008 | Register | Duplicate username shows error | Existing username available | Register with existing username | Existing username, new email | Error message from backend appears | Not recorded | Not Run | High |
| FE-009 | Register | Duplicate email shows error | Existing email available | Register with new username and existing email | New username, existing email | Error message from backend appears | Not recorded | Not Run | High |
| FE-010 | Navigation | Admin navigation includes all modules | Login as admin | Inspect sidebar and click each item | Admin user | Dashboard, Live Map, Analytics, AI Risk, Reports, Admin are visible and open | Not recorded | Not Run | High |
| FE-011 | Navigation | Traffic police navigation is restricted | Login as traffic police | Inspect sidebar | Traffic police user | Dashboard, Live Map, AI Risk, Reports visible; Analytics/Admin hidden | Not recorded | Not Run | High |
| FE-012 | Navigation | User navigation is restricted | Login as normal user | Inspect sidebar | User role | Dashboard and Live Map visible; Analytics/AI Risk/Reports/Admin hidden | Not recorded | Not Run | High |
| FE-013 | Navigation | Logout clears session | Logged in | Click Logout | Current user | Token removed and login screen appears | Not recorded | Not Run | High |
| FE-014 | Date Window | Date picker icon is visible | App shell open | Inspect From/To date inputs | Dark UI | Calendar icon is visible on dark input | Not recorded | Not Run | Medium |
| FE-015 | Date Window | Date picker opens on click | App shell open | Click input and icon area | Date input | Native date picker opens | Not recorded | Not Run | High |
| FE-016 | Date Window | Valid date range applies | App shell open | Select From `2025-03-01`, To `2025-03-31`, click Search | March 2025 | Data refreshes with non-zero March records | Not recorded | Not Run | High |
| FE-017 | Date Window | Out-of-range future date is blocked/clamped | App shell open | Try entering date after `2025-03-31` | `2026-01-01` | Input max prevents selection or applied date clamps to `2025-03-31` | Not recorded | Not Run | High |
| FE-018 | Date Window | Reversed dates are corrected | App shell open | Enter From after To, click Search | From `2025-03-31`, To `2025-03-01` | App swaps/applies valid range | Not recorded | Not Run | Medium |
| FE-019 | Dashboard | Dashboard metrics load | Logged in as any role | Open Dashboard | No filter | Total accidents, injuries, fatalities, severity cards load | Not recorded | Not Run | High |
| FE-020 | Dashboard | Recent incidents load | Logged in as any role | Open Dashboard | No filter | Recent incidents table shows latest records or empty state | Not recorded | Not Run | High |
| FE-021 | Dashboard | Metric drill-down opens | Dashboard loaded | Click a metric card/section | Total/severity/recent | Modal opens with filtered incidents | Not recorded | Not Run | Medium |
| FE-022 | Dashboard | Drill-down search works | Modal open with records | Type search text | Weather/severity/road text | Table filters matching records | Not recorded | Not Run | Medium |
| FE-023 | Dashboard | Drill-down sorting works | Modal open | Click Date & Time header | Existing records | Sort order toggles | Not recorded | Not Run | Medium |
| FE-024 | Dashboard | CSV export works | Modal with records open | Click export control | Modal records | CSV download is generated | Not recorded | Not Run | Low |
| FE-025 | Dashboard | Empty dashboard range shows empty state | Logged in | Select range outside data if allowed through direct typing | No-data range | Metrics show zero without crash | Not recorded | Not Run | Medium |
| FE-026 | Map | Live Map loads default March 2025 window | Logged in as any role | Open Live Map | No filter | Map, accident markers, and default window label appear | Not recorded | Not Run | High |
| FE-027 | Map | Map date filter updates markers | Logged in as any role | Apply March 2025 date window then open Map | `2025-03-01` to `2025-03-31` | Marker count reflects selected range | Not recorded | Not Run | High |
| FE-028 | Map | Accident marker popup shows details | Map loaded with markers | Click marker | Existing marker | Popup shows severity, weather, date/time, injuries/fatalities | Not recorded | Not Run | Medium |
| FE-029 | Map | Hotspot layer loads | Logged in as admin/police if required | Switch to hotspots view | Default range | Hotspot circles appear or empty state if none | Not recorded | Not Run | Medium |
| FE-030 | Map | Heatmap script failure is handled | Network blocked or CDN unavailable | Open heatmap view | Heatmap layer | UI does not crash; map remains usable | Not recorded | Not Run | Medium |
| FE-031 | Analytics | Admin can view analytics | Login as admin | Open Analytics | Admin token | Time, weather, and road charts load | Not recorded | Not Run | High |
| FE-032 | Analytics | Non-admin cannot view analytics | Login as traffic police/user | Attempt direct navigation/state to analytics | Non-admin role | Access denied or route hidden | Not recorded | Not Run | High |
| FE-033 | Analytics | Date range filters charts | Login as admin | Apply March 2025 date window, open Analytics | Valid range | Charts reflect selected period | Not recorded | Not Run | Medium |
| FE-034 | Predictions | Prediction form accepts valid input | Login as admin/police | Fill form and submit | Lat 32.574, lon 74.075, hour 17, Clear, Residential | Risk result, confidence, nearest road, recommendations show | Not recorded | Not Run | High |
| FE-035 | Predictions | Required fields are enforced | Login as admin/police | Clear required fields and submit | Empty values | Browser/form validation blocks or backend error appears | Not recorded | Not Run | High |
| FE-036 | Predictions | Map click updates coordinates | Login as admin/police | Click map selector | Map click | Latitude/longitude fields update | Not recorded | Not Run | Medium |
| FE-037 | Predictions | User role cannot access predictions | Login as normal user | Inspect sidebar/direct route | User role | AI Risk hidden or access denied | Not recorded | Not Run | High |
| FE-038 | Reports | Default report loads | Login as admin/police | Open Reports | Default March 2025 | Report summary appears | Not recorded | Not Run | High |
| FE-039 | Reports | Weekly period auto-calculates end date | Login as admin/police | Select weekly and start date | `2025-03-01` | End date updates to 6 days later, capped by data max | Not recorded | Not Run | Medium |
| FE-040 | Reports | Invalid date order shows backend error | Login as admin/police | Force start after end and generate | `2025-03-31` to `2025-03-01` | Error message visible | Not recorded | Not Run | High |
| FE-041 | Reports | Print report action opens print flow | Report loaded | Click print | Existing report | Print dialog or printable view opens | Not recorded | Not Run | Low |
| FE-042 | Admin | Admin dashboard loads security metrics | Login as admin | Open Admin | Admin token | User metrics, users table, activity list, policy cards appear | Not recorded | Not Run | High |
| FE-043 | Admin | Admin changes role | Login as admin | Change another user's role dropdown | User ID, new role | Role updates and remains after refresh | Not recorded | Not Run | High |
| FE-044 | Admin | Admin disables account | Login as admin | Click Disable for another user | Active user | Status changes to inactive; user cannot login | Not recorded | Not Run | High |
| FE-045 | Admin | Admin cannot disable own account | Login as admin | Click Disable for current admin account if visible | Current admin | Backend rejects with visible error | Not recorded | Not Run | High |
| FE-046 | Admin | Admin cannot remove own admin role | Login as admin | Change own role from admin to user | Current admin | Backend rejects with visible error | Not recorded | Not Run | High |
| FE-047 | Admin | Login activity displays failed and successful attempts | Login attempts exist | Open Admin activity panel | Recent logins | Activity entries show username, IP, device, result, timestamp | Not recorded | Not Run | Medium |
| FE-048 | UI/UX | Loading states display | Slow network enabled | Open Dashboard/Map/Admin/Reports | Browser throttling | Spinner/loading state appears during requests | Not recorded | Not Run | Medium |
| FE-049 | UI/UX | Error states display | Backend stopped or network blocked | Open pages requiring API | Network failure | User-visible error or safe fallback appears, no blank crash | Not recorded | Not Run | High |
| FE-050 | UI/UX | UI remains consistent after refresh | Logged in | Refresh each page | Browser refresh | Session persists and layout remains stable | Not recorded | Not Run | Medium |
| FE-051 | Responsive | Mobile layout is usable | Browser dev tools | Test 390px width | Mobile viewport | Sidebar opens/closes; content does not overlap | Not recorded | Not Run | High |
| FE-052 | Responsive | Tablet layout is usable | Browser dev tools | Test 768px width | Tablet viewport | Cards, tables, and map remain readable | Not recorded | Not Run | Medium |
| FE-053 | Responsive | Desktop layout is usable | Browser dev tools | Test 1440px width | Desktop viewport | Sidebar/topbar/content align correctly | Not recorded | Not Run | Medium |
| API-001 | Root | Root endpoint works | Backend running | GET `/` | None | `200`, API message/version/docs | Not recorded | Not Run | High |
| API-002 | Health | Health endpoint works | Backend running | GET `/health` | None | `200`, status healthy | Not recorded | Not Run | High |
| API-003 | Auth | Login succeeds | Existing active user | POST `/token` | Valid username/password | `200`, token_type bearer, role returned | Not recorded | Not Run | High |
| API-004 | Auth | Login fails for wrong password | Backend running | POST `/token` | Wrong password | `401`, no token | Not recorded | Not Run | High |
| API-005 | Auth | Inactive account cannot login | Admin has disabled account | POST `/token` | Disabled user credentials | `403`, inactive account message | Not recorded | Not Run | High |
| API-006 | Auth | Register creates only user role | Backend running | POST `/register` with role attempt if client sends extra field | Unique user plus `role=admin` | Response role is `user`; DB role is `user` | Not recorded | Not Run | High |
| API-007 | Auth | Duplicate username rejected | Existing username | POST `/register` | Existing username | `400`, username already registered | Not recorded | Not Run | High |
| API-008 | Auth | Duplicate email rejected | Existing email | POST `/register` | Existing email | `400`, email already registered | Not recorded | Not Run | High |
| API-009 | Auth | `/users/me` requires token | Backend running | GET `/users/me` without token | None | `401` | Not recorded | Not Run | High |
| API-010 | Admin API | Admin users list requires admin | Backend running | GET `/api/admin/users` without token | None | `401` | Not recorded | Not Run | High |
| API-011 | Admin API | User cannot access admin users list | Login as normal user | GET `/api/admin/users` | User token | `403` | Not recorded | Not Run | High |
| API-012 | Admin API | Admin can list users | Login as admin | GET `/api/admin/users` | Admin token | `200`, list with id/username/email/role/status | Not recorded | Not Run | High |
| API-013 | Admin API | Admin can change user role | Login as admin | PATCH `/api/admin/users/{id}/role` | `traffic_police` | `200`, updated role | Not recorded | Not Run | High |
| API-014 | Admin API | Invalid role rejected | Login as admin | PATCH role | `superadmin` | `400`, invalid role | Not recorded | Not Run | High |
| API-015 | Admin API | Missing user returns 404 | Login as admin | PATCH missing user ID | Large ID | `404`, user not found | Not recorded | Not Run | High |
| API-016 | Admin API | Admin can update status | Login as admin | PATCH `/api/admin/users/{id}/status` | `is_active=false` | `200`, status false | Not recorded | Not Run | High |
| API-017 | Admin API | Security summary works | Login as admin | GET `/api/admin/security-summary` | Admin token | `200`, user/login counts and token expiry | Not recorded | Not Run | Medium |
| API-018 | Admin API | Login activity works | Login as admin | GET `/api/admin/login-activity?limit=10` | Admin token | `200`, latest audit rows | Not recorded | Not Run | Medium |
| API-019 | Accidents API | Accident list returns records | Backend running | GET `/api/accidents/?limit=10` | Limit 10 | `200`, array length <= 10 | Not recorded | Not Run | High |
| API-020 | Accidents API | Accident list validates limit | Backend running | GET `/api/accidents/?limit=999999` | Too high limit | `422` validation error | Not recorded | Not Run | High |
| API-021 | Accidents API | Accident date filter returns expected range | Backend running | GET `/api/accidents/?start_date=2025-03-01&end_date=2025-03-31&limit=50000` | March 2025 | Records are inside range | Not recorded | Not Run | High |
| API-022 | Accidents API | Specific accident requires auth | Backend running | GET `/api/accidents/1` without token | ID 1 | `401` | Not recorded | Not Run | High |
| API-023 | Accidents API | Non-existing accident returns 404 | Auth token available | GET `/api/accidents/999999999` | Missing ID | `404`, Accident not found | Not recorded | Not Run | High |
| API-024 | Accidents API | Heatmap endpoint requires auth | Backend running | GET `/api/accidents/heatmap/data` without token | None | `401` | Not recorded | Not Run | Medium |
| API-025 | Accidents API | Nearby search validates coordinates | Auth token available | GET `/api/accidents/search/nearby?latitude=999&longitude=74` | Invalid latitude | `422` | Not recorded | Not Run | High |
| API-026 | Stats API | Overview returns public data | Backend running | GET `/api/stats/overview` | None | `200`, total and severity breakdown | Not recorded | Not Run | High |
| API-027 | Stats API | Overview valid date range returns non-zero | Backend running | GET overview with March 2025 | `2025-03-01` to `2025-03-31` | `total_accidents` greater than 0 | Not recorded | Not Run | High |
| API-028 | Stats API | Overview future range returns zero safely | Backend running | GET overview with 2026 dates | Future range | `200`, zero counts, no crash | Not recorded | Not Run | Medium |
| API-029 | Stats API | Admin analytics requires admin | Backend running | GET `/api/stats/by-time` without token | None | `401` | Not recorded | Not Run | High |
| API-030 | Stats API | Admin analytics works with admin token | Login as admin | GET `/api/stats/by-time` | Admin token | `200`, by_hour/by_day/by_month arrays | Not recorded | Not Run | High |
| API-031 | Predictions API | Prediction requires police/admin | Backend running | POST `/api/predictions/predict` without token | Valid body | `401` | Not recorded | Not Run | High |
| API-032 | Predictions API | User role cannot predict | Login as user | POST prediction | Valid body | `403` | Not recorded | Not Run | High |
| API-033 | Predictions API | Valid prediction works | Login as admin/police | POST prediction | Valid body | `200`, risk level and recommendations | Not recorded | Not Run | High |
| API-034 | Predictions API | Invalid prediction body returns validation error | Login as admin/police | POST missing latitude/hour | Invalid body | `422` | Not recorded | Not Run | High |
| API-035 | Predictions API | Hotspots returns list | Login as admin/police | GET `/api/predictions/hotspots?limit=15` | Token | `200`, array | Not recorded | Not Run | Medium |
| API-036 | Reports API | Generate report requires police/admin | Backend running | GET report without token | Valid dates | `401` | Not recorded | Not Run | High |
| API-037 | Reports API | Valid report returns structured response | Login as admin/police | GET `/api/reports/generate` | March 2025 | `200`, summary, breakdowns, trends, hotspots | Not recorded | Not Run | High |
| API-038 | Reports API | Start after end rejected | Login as admin/police | GET report | Start `2025-03-31`, end `2025-03-01` | `400` | Not recorded | Not Run | High |
| API-039 | Reports API | Empty range returns empty report | Login as admin/police | GET report | Future range | `200`, zero summary, empty arrays | Not recorded | Not Run | Medium |
| DB-001 | SQLite | Main database file exists | Repository checkout | Check file path | `backend/traffic_db.db` | File exists and is not deleted | Not recorded | Not Run | High |
| DB-002 | SQLite | Tables exist | Backend configured | Inspect SQLAlchemy metadata/SQLite tables | accidents, roads, weather, predictions, users, login_audit | Expected tables exist after startup | Not recorded | Not Run | High |
| DB-003 | SQLite | Accident data is available | Backend configured | Query min/max/count | Accident table | Date range is `2020-01-01` to `2025-03-31`; count > 0 | Not recorded | Not Run | High |
| DB-004 | SQLite | Accident insert/read/update/delete works in isolated DB | Backend venv ready | Run `test_database.py` | In-memory SQLite | CRUD test passes without touching real DB | Not recorded | Not Run | High |
| DB-005 | SQLite | User duplicate username rejected | Backend venv ready | Run duplicate user test | In-memory SQLite | IntegrityError raised | Not recorded | Not Run | High |
| DB-006 | SQLite | Login audit row can be inserted/read | Backend venv ready | Run login audit test | In-memory SQLite | Audit row persists in test session | Not recorded | Not Run | High |
| DB-007 | SQLite | App restart preserves data | Backend running | Record count, restart backend, record count again | Main DB | Counts match; no accidental reset | Not recorded | Not Run | High |
| DB-008 | SQLite | Invalid nullable fields are rejected | Isolated test DB | Insert Accident without lat/lng/date | Missing required fields | DB rejects missing non-null fields | Not recorded | Not Run | Medium |
| INT-001 | Integration | Dashboard fetches backend data | Frontend/backend running | Login and open Dashboard | Any role | Stats and accident requests succeed | Not recorded | Not Run | High |
| INT-002 | Integration | Date window updates Dashboard and Map | Frontend/backend running | Apply date window then open pages | March 2025 | Both pages show same selected range behavior | Not recorded | Not Run | High |
| INT-003 | Integration | Admin role update changes backend record | Frontend/backend running | Change role in Admin page, refresh | Admin token | Backend and UI show updated role | Not recorded | Not Run | High |
| INT-004 | Integration | Admin disable blocks login | Frontend/backend running | Disable user, logout, try disabled user's login | Disabled account | Login returns inactive account error | Not recorded | Not Run | High |
| INT-005 | Integration | Prediction form sends API request | Frontend/backend running | Submit AI Risk form | Valid payload | Frontend displays backend risk response | Not recorded | Not Run | High |
| INT-006 | Integration | Report form sends API request | Frontend/backend running | Generate report | Valid dates | Frontend renders report response | Not recorded | Not Run | High |
| INT-007 | Integration | Backend error is visible in frontend | Frontend/backend running | Trigger invalid report/date or stopped backend | Invalid input/network down | User sees error, app does not crash | Not recorded | Not Run | High |
| INT-008 | Integration | Page refresh keeps data consistent | Logged in | Refresh Dashboard/Map/Admin | Current token | Same data loads after refresh | Not recorded | Not Run | Medium |
| SEC-001 | Security | SQL injection-like input does not corrupt DB | Backend running | Send SQL-like query values to filters/login | `' OR 1=1 --` | No crash, no unauthorized access, no DB corruption | Not recorded | Not Run | High |
| SEC-002 | Security | Script input does not execute in UI | Frontend/backend running | Enter script-like text where accepted | `<script>alert(1)</script>` | Text is rendered safely or rejected; no script executes | Not recorded | Not Run | High |
| SEC-003 | Security | Internal stack traces are not exposed | Backend running | Trigger invalid requests | Bad payloads | Responses contain safe error details only | Not recorded | Not Run | High |
| SEC-004 | Security | `.env` is ignored by git | Repo checkout | Run `git check-ignore backend/.env` | `.env` path | Path is ignored | Not recorded | Not Run | High |
| SEC-005 | Security | Database and model files are ignored by git | Repo checkout | Run `git check-ignore backend/traffic_db.db backend/ml/trained_model.pkl` | DB/model paths | Paths are ignored | Not recorded | Not Run | High |
| SEC-006 | Security | CORS is limited to local frontend origins | Backend code inspected | Review `backend/app/main.py` | CORS list | Only expected localhost dev origins are configured for local delivery | Not recorded | Not Run | Medium |
| SEC-007 | Security | Non-admin cannot access admin UI/API | User token | Attempt direct API and UI access | User role | UI hidden/access denied and API returns `403` | Not recorded | Not Run | High |
| SEC-008 | Security | Token expiration exists | Auth helper/API inspected | Decode token or inspect summary | Access token | `exp` claim exists; expiry documented as 30 minutes | Not recorded | Not Run | Medium |
| PERF-001 | Performance | Frontend build completes | Node/npm available | Run `npm run build` | Current frontend | Build succeeds; chunk warning reviewed | Not recorded | Not Run | High |
| PERF-002 | Performance | Dashboard overview response time acceptable | Backend running | Time overview endpoint | March 2025 | Local response under agreed threshold, e.g. 500ms | Not recorded | Not Run | Medium |
| PERF-003 | Performance | Large accident list does not freeze UI | Frontend/backend running | Open Map/Dashboard modal with large limit | 20,000 records | UI remains usable | Not recorded | Not Run | Medium |
| PERF-004 | Performance | Repeated clicks do not duplicate requests excessively | Browser dev tools open | Click Search/Generate rapidly | Repeated actions | No unbounded duplicate request storm | Not recorded | Not Run | Medium |
| PERF-005 | Performance | Map remains interactive with markers | Frontend/backend running | Open Map with March 2025 data | Map markers | Pan/zoom remains responsive | Not recorded | Not Run | Medium |
| COMP-001 | Compatibility | Chrome compatibility | Chrome available | Run main journeys | Chrome latest | App works without critical console errors | Not recorded | Not Run | Medium |
| COMP-002 | Compatibility | Firefox compatibility | Firefox available | Run main journeys | Firefox latest | App works without critical console errors | Not recorded | Not Run | Medium |
| COMP-003 | Compatibility | Edge compatibility | Edge available | Run main journeys | Edge latest | App works without critical console errors | Not recorded | Not Run | Medium |
| COMP-004 | Compatibility | Desktop layout | Browser dev tools | Test 1440x900 | Desktop | Layout professional and no critical overlap | Not recorded | Not Run | Medium |
| COMP-005 | Compatibility | Tablet layout | Browser dev tools | Test 768x1024 | Tablet | Sidebar/content remain usable | Not recorded | Not Run | Medium |
| COMP-006 | Compatibility | Mobile layout | Browser dev tools | Test 390x844 | Mobile | Sidebar opens, forms fit, no critical overlap | Not recorded | Not Run | High |
| UAT-001 | Acceptance | Admin delivery journey | Admin user exists | Login, inspect dashboard/map/analytics/admin, change role, logout | Admin account | Journey completes end-to-end | Not recorded | Not Run | High |
| UAT-002 | Acceptance | Traffic police delivery journey | Police user exists | Login, inspect dashboard/map/prediction/report, logout | Traffic police account | Journey completes end-to-end | Not recorded | Not Run | High |
| UAT-003 | Acceptance | Normal user delivery journey | User exists | Login, inspect dashboard/map, verify restricted menus hidden, logout | User account | User can access only allowed areas | Not recorded | Not Run | High |
| UAT-004 | Acceptance | No critical console/backend errors | App running | Run main journeys with dev tools/backend logs open | Main flows | No critical frontend console errors or backend tracebacks | Not recorded | Not Run | High |
| UAT-005 | Acceptance | README run commands are correct | Fresh-ish checkout | Follow README commands | Documented commands | Backend/frontend start successfully | Not recorded | Not Run | High |
| UAT-006 | Acceptance | AGENTS.md is accurate | Repo checkout | Review instructions against current structure | Current project | Paths and run commands match actual app | Not recorded | Not Run | Medium |
| UAT-007 | Acceptance | Git tree ready for delivery | Tests completed | Run `git status` | Repository | Only intentional files changed; no secrets or DB files staged | Not recorded | Not Run | High |
