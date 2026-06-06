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
FRONTEND_ORIGINS=https://your-vercel-app.vercel.app
ENVIRONMENT=production
```

`FRONTEND_ORIGINS` supports multiple comma-separated origins, for example:

```env
FRONTEND_ORIGINS=https://app.example.com,https://preview.example.com
```

## Neon

Import the local PostgreSQL export into Neon before pointing Render at the Neon connection string.

```bash
psql "$DATABASE_URL" -f db_exports/traffic_portal_postgres.sql
```

The `db_exports/` folder is ignored and must not be pushed to GitHub.

## ML Model

The trained model file is intentionally ignored by git:

```text
ml/trained_model.pkl
```

If predictions are required in production, provide this model to Render through a private artifact workflow or retrain it on the server before enabling prediction endpoints.
