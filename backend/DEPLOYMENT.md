# Backend Deployment

This backend is deployable as a Render web service from the backend repository root.

## Render

Use the included `render.yaml`, or create a Render web service manually with:

```bash
pip install --upgrade pip && pip install -r requirements.txt
```

Start command:

```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Health check path:

```text
/health
```

## Environment Variables

Set these in Render. Do not commit real values.

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require
SECRET_KEY=replace-with-a-long-random-secret
FRONTEND_ORIGINS=https://traffic-accident-portal-front-bjqqkzkye.vercel.app
ENVIRONMENT=production
PYTHON_VERSION=3.11.9
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=replace-with-a-temporary-admin-password
```

`FRONTEND_ORIGINS` supports multiple comma-separated origins, for example:

```env
FRONTEND_ORIGINS=https://app.example.com,https://preview.example.com
```

If `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set, the app creates or resets that admin account on startup. After the first successful login, change the admin password and remove `ADMIN_PASSWORD` from Render if you do not want it reset again on every deploy.

## Neon

Import the local PostgreSQL export into Neon before pointing Render at the Neon connection string.

```bash
psql "$DATABASE_URL" -f db_exports/traffic_portal_postgres.sql
```

If `psql` is not installed, use the Python importer from the backend folder:

```bash
export NEON_DATABASE_URL='postgresql://USER:PASSWORD@HOST.neon.tech/DBNAME?sslmode=require&channel_binding=require'
source venv/bin/activate
python scripts/import_sqlite_to_postgres.py --drop-existing
```

For a public-data-only import without users or login audit records:

```bash
python scripts/import_sqlite_to_postgres.py --drop-existing --exclude-auth
```

The `db_exports/` folder is ignored and must not be pushed to GitHub.

## ML Model

The trained model is included at:

```text
ml/trained_model.pkl
```

Render clones this file with the backend repository so prediction endpoints can load the model at startup.
