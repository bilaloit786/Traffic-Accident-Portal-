# Final Delivery Checklist

## Code Quality

- [ ] No unused major files.
- [ ] No broken imports.
- [ ] No critical frontend console errors.
- [ ] No backend traceback errors during main flows.
- [ ] No hardcoded production secrets.
- [ ] Environment variables documented in `README.md`.
- [ ] Current `git status` reviewed before delivery.
- [ ] Only intentional source, documentation, and test files are staged.

## Frontend

- [ ] App runs successfully.
- [ ] Login page loads when unauthenticated.
- [ ] Dashboard loads after authentication.
- [ ] Sidebar navigation works for each role.
- [ ] UI is responsive on mobile, tablet, and desktop.
- [ ] Forms are validated.
- [ ] Error messages are visible.
- [ ] Loading states are handled.
- [ ] Empty states are handled.
- [ ] Date selector icon is visible on dark inputs.
- [ ] Date selector range matches available data: `2020-01-01` to `2025-03-31`.
- [ ] No critical layout overlap on major pages.

## Backend

- [ ] Server runs successfully.
- [ ] Root endpoint works.
- [ ] Health endpoint works.
- [ ] API routes tested.
- [ ] Authentication works.
- [ ] Role authorization works.
- [ ] Validation works for invalid payloads.
- [ ] Error handling works.
- [ ] CORS configured correctly for local frontend origins.
- [ ] ML model startup warning reviewed if Scikit-learn version differs.

## Database

- [ ] SQLite database exists at `backend/traffic_db.db`.
- [ ] Root `traffic_db.db` is not deleted.
- [ ] Data persists after backend restart.
- [ ] No accidental database reset.
- [ ] Database tables exist after startup.
- [ ] Login audit table exists.
- [ ] Backup recommended before delivery.

## Documentation

- [ ] README updated.
- [ ] AGENTS.md updated and accurate.
- [ ] TEST_PLAN.md created.
- [ ] TEST_CASES.md created.
- [ ] DELIVERY_CHECKLIST.md created.
- [ ] TEST_RESULTS.md created.
- [ ] Run commands verified.
- [ ] Environment variables documented.
- [ ] Known risks documented.

## Security

- [ ] `.env` files are ignored by git.
- [ ] SQLite database files are ignored by git.
- [ ] ML model binary files are ignored by git.
- [ ] Public registration cannot assign admin role.
- [ ] Admin APIs require admin role.
- [ ] Inactive users cannot log in.
- [ ] Invalid login attempts are audited.
- [ ] Error responses do not expose sensitive internals.
- [ ] CORS is not overly permissive for production delivery.

## Performance

- [ ] Frontend build completes.
- [ ] Dashboard APIs respond within acceptable local threshold.
- [ ] Map remains usable with March 2025 data.
- [ ] Large table/modal views remain usable.
- [ ] Repeated user actions do not create excessive duplicate requests.

## Compatibility

- [ ] Chrome checked.
- [ ] Firefox checked.
- [ ] Edge checked.
- [ ] Desktop viewport checked.
- [ ] Tablet viewport checked.
- [ ] Mobile viewport checked.

## Final Verification Commands

Frontend:

```bash
cd frontend
source ~/.nvm/nvm.sh
nvm use 22.22.0
npm run dev -- --host 0.0.0.0
```

Frontend build:

```bash
cd frontend
npm run build
```

Backend:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend automated tests:

```bash
cd backend
venv/bin/python -m unittest discover -s tests -v
```

Current automated test result:

```text
6 tests passed
```

Backend syntax/import smoke check:

```bash
cd backend
venv/bin/python -m py_compile app/database.py app/core/auth.py app/routes/auth_routes.py app/main.py
venv/bin/python -c "from app.main import app; print('backend import ok')"
```

Git:

```bash
git status
git diff --check
```

## Delivery Decision

- [ ] Ready for delivery.
- [ ] Ready with minor known risks.
- [ ] Not ready; blocking issues remain.

Use `TEST_CASES.md` as the final manual test execution log before delivery. Update Actual Result and Status for each executed case.
