# Traffic Accident Analysis Portal

A full-stack traffic accident analysis and prediction platform built with FastAPI, React, Vite, SQLite, Leaflet, Recharts, and machine learning.

The system helps visualize accident records, inspect high-risk areas, analyze patterns, generate reports, predict accident risk, and manage portal access through role-based admin controls.

## Project Overview

Traffic Accident Analysis Portal is designed for emergency operations and road safety analysis. It combines accident data, weather/road context, dashboard analytics, map visualization, report generation, and ML-powered risk prediction in one authenticated web application.

## Institution And Team

| Property | Value |
| --- | --- |
| Institution | ILM College Gujrat |
| Faculty | Computing & Information Technology |
| Session | 2022-2026 |
| Supervisor | Mr. Muhammad Bilal |
| Team Members | Zainab Shafqat (22181519-002), Fariha Iftikhar (22181519-001), Sania Mubashir (22181519-003) |

## Features

### Dashboard

- Accident overview cards for total accidents, injuries, fatalities, and recent incidents.
- Severity breakdown for Minor, Moderate, Severe, and Fatal records.
- Date-window filtering for operational analysis.
- Detailed drill-down tables for selected dashboard metrics.

### Interactive Map

- Leaflet-based accident map.
- Accident markers with incident details.
- Hotspot and high-risk area visualization.
- Default March 2025 map window with optional date filtering.

### Analytics

- Hourly accident distribution.
- Day-of-week and monthly patterns.
- Weather impact analysis.
- Road-type comparisons.
- Severity and trend insights.

### Predictions

- ML-powered accident risk prediction.
- Location, time, weather, and road-type inputs.
- Risk level output with probability and contributing factors.
- Safety recommendations for operational users.

### Reports

- Weekly, half-monthly, monthly, and custom date reports.
- Summary statistics and severity breakdowns.
- Report view suitable for printing/exporting through the browser.

### Admin And Security

- JWT login and protected API routes.
- Role-based access control for `admin`, `traffic_police`, and `user`.
- Admin-only user management screen.
- Admin can change user roles.
- Admin can enable or disable accounts.
- New public registrations are always created as normal `user` accounts.
- Login activity audit log with username, IP address, user agent, result, and timestamp.
- Inactive users are blocked from signing in.

## Role Access

| Module | Admin | Traffic Police | User |
| --- | --- | --- | --- |
| Dashboard | Yes | Yes | Yes |
| Map | Yes | Yes | Yes |
| Analytics | Yes | No | No |
| Predictions | Yes | Yes | No |
| Reports | Yes | Yes | No |
| Admin | Yes | No | No |

## Tech Stack

### Backend

- FastAPI
- Uvicorn
- SQLAlchemy
- SQLite
- Pydantic
- JWT authentication with `python-jose`
- Password hashing with Passlib/Bcrypt
- Pandas, NumPy, Scikit-learn, XGBoost

### Frontend

- React
- Vite
- Axios
- Recharts
- Leaflet and React Leaflet
- CSS modules/global CSS styling

## Project Structure

```text
traffic-portal/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   └── auth.py
│   │   ├── routes/
│   │   │   ├── accident_routes.py
│   │   │   ├── auth_routes.py
│   │   │   ├── prediction_routes.py
│   │   │   ├── report_routes.py
│   │   │   └── stats_routes.py
│   │   ├── database.py
│   │   └── main.py
│   ├── data/
│   ├── ml/
│   ├── requirements.txt
│   └── traffic_db.db
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   ├── pages/
│   │   │   ├── Admin.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── Predictions.jsx
│   │   │   ├── Register.jsx
│   │   │   └── Reports.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── data/
├── ml/
├── scripts/
└── README.md
```

## Requirements

- Python 3.10 or higher
- Node.js 20.19+ or 22.12+ recommended for Vite 7
- npm

Node 18 may build with warnings in some environments, but Vite 7 officially requires Node 20.19+ or 22.12+.

## Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend runs at:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/api/docs
http://localhost:8000/api/redoc
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Frontend runs at:

```text
http://localhost:5173
```

To build production assets:

```bash
cd frontend
npm run build
```

To serve the built `dist` folder locally:

```bash
cd frontend/dist
python3 -m http.server 5173 --bind 0.0.0.0
```

## Environment Configuration

Create `backend/.env`:

```env
DATABASE_URL=sqlite:///./traffic_db.db
SECRET_KEY=change-this-secret-key
API_HOST=0.0.0.0
API_PORT=8000
ENVIRONMENT=development
```

## API Endpoints

### Authentication

- `POST /token` - Login and receive JWT token.
- `POST /register` - Register a new normal user account.
- `GET /users/me` - Get current authenticated user profile.

### Admin

- `GET /api/admin/users` - List users with roles, status, and last login.
- `PATCH /api/admin/users/{user_id}/role` - Change a user's role.
- `PATCH /api/admin/users/{user_id}/status` - Enable or disable a user account.
- `GET /api/admin/login-activity` - View recent login activity.
- `GET /api/admin/security-summary` - View security summary metrics.

### Accidents

- `GET /api/accidents/` - List accident records.
- `GET /api/accidents/{id}` - Get one accident record.
- `GET /api/accidents/hotspots` - Get high-risk hotspot data.

### Statistics

- `GET /api/stats/overview` - Dashboard overview.
- `GET /api/stats/by-time` - Time distribution.
- `GET /api/stats/by-weather` - Weather distribution.
- `GET /api/stats/by-road-type` - Road-type distribution.
- `GET /api/stats/severity-analysis` - Severity analysis.
- `GET /api/stats/trends/monthly` - Monthly trends.
- `GET /api/stats/trends/yearly` - Yearly trends.

### Predictions And Reports

- `POST /api/predictions/predict` - Predict accident risk.
- `GET /api/reports/generate` - Generate report data.

## Database

- Database: SQLite
- Main file: `backend/traffic_db.db`
- Core tables include accidents, roads, weather, predictions, users, and login audit records.

The backend creates missing tables on startup through SQLAlchemy metadata.

## Machine Learning

- Model type: Random Forest Classifier
- Features: latitude, longitude, hour/time, weather, and road type
- Output: accident risk level and probability
- Model file: `backend/ml/trained_model.pkl`

If the installed Scikit-learn version differs from the version used to train the model, startup may show an `InconsistentVersionWarning`. The app can still run, but retraining the model with the current environment is recommended for long-term stability.

## Verification

Backend syntax/import check:

```bash
cd backend
venv/bin/python -m py_compile app/database.py app/core/auth.py app/routes/auth_routes.py app/main.py
venv/bin/python -c "from app.main import app; print('backend import ok')"
```

Frontend build:

```bash
cd frontend
npm run build
```

Frontend lint:

```bash
cd frontend
npm run lint
```

Note: the current project may still contain older lint warnings/errors in existing pages. Build verification is the main frontend smoke check unless those lint issues are cleaned up.

## Security Notes

- Change `SECRET_KEY` before production use.
- Keep `.env`, databases, generated model files, and secrets out of public repositories.
- Use HTTPS in production.
- Consider adding rate limiting for login and prediction endpoints.
- Consider adding password reset, account lockout, and refresh-token rotation for production deployment.

## Future Enhancements

- Real-time incident feed integration.
- Email or SMS alerts for high-risk areas.
- Improved model retraining pipeline.
- Advanced audit filtering and export.
- Deployment configuration with Docker.
- API rate limiting and account lockout policy.
