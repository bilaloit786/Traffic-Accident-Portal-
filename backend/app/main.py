"""
Main FastAPI application
Traffic Accident Prediction & Analysis Portal
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.core.auth import get_password_hash
from app.database import Base, SessionLocal, User, engine, init_db
from app.routes import accident_routes, prediction_routes, stats_routes, auth_routes, report_routes


def get_allowed_origins():
    """Build CORS origins from local defaults plus FRONTEND_ORIGINS."""
    local_origins = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
        "https://traffic-accident-portal-front-end.vercel.app",
        "https://traffic-accident-portal-front-bjqqkzkye.vercel.app",
    ]
    configured_origins = [
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return local_origins + configured_origins


def sync_postgres_sequences():
    """Keep PostgreSQL identity sequences aligned after SQLite data imports."""
    if engine.dialect.name != "postgresql":
        return

    preparer = engine.dialect.identifier_preparer
    with engine.begin() as connection:
        for table in Base.metadata.sorted_tables:
            id_column = table.columns.get("id")
            if id_column is None:
                continue

            sequence_name = connection.execute(
                text("SELECT pg_get_serial_sequence(:table_name, :column_name)"),
                {"table_name": table.name, "column_name": id_column.name},
            ).scalar()
            if not sequence_name:
                continue

            quoted_table = preparer.quote(table.name)
            quoted_id_column = preparer.quote(id_column.name)
            max_id = connection.execute(
                text(f"SELECT COALESCE(MAX({quoted_id_column}), 0) FROM {quoted_table}")
            ).scalar() or 0

            connection.execute(
                text(
                    "SELECT setval("
                    "CAST(:sequence_name AS regclass), "
                    ":sequence_value, "
                    ":is_called"
                    ")"
                ),
                {
                    "sequence_name": sequence_name,
                    "sequence_value": max(max_id, 1),
                    "is_called": max_id > 0,
                },
            )

    print("✓ PostgreSQL sequences synchronized")


def seed_admin_user():
    """Create or reset an admin account from Render environment variables."""
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    email = os.getenv("ADMIN_EMAIL", "admin@gmail.com")

    if not username or not password:
        print("Admin seed skipped: ADMIN_USERNAME and ADMIN_PASSWORD are not set")
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        hashed_password = get_password_hash(password)

        if user:
            user.email = email
            user.hashed_password = hashed_password
            user.role = "admin"
            user.is_active = 1
            action = "updated"
        else:
            user = User(
                username=username,
                email=email,
                hashed_password=hashed_password,
                role="admin",
                is_active=1,
            )
            db.add(user)
            action = "created"

        db.commit()
        print(f"✓ Admin user {action}: {username}")
    except Exception as exc:
        db.rollback()
        print(f"Admin seed failed: {type(exc).__name__}: {exc}")
        raise
    finally:
        db.close()

# Create FastAPI app
app = FastAPI(
    title="Traffic Accident Prediction & Analysis Portal",
    description="Intelligent web-based platform for predicting and analyzing traffic accidents",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(accident_routes.router)
app.include_router(prediction_routes.router)
app.include_router(stats_routes.router)
app.include_router(auth_routes.router)
app.include_router(report_routes.router)


@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("\n" + "="*60)
    print("TRAFFIC ACCIDENT PREDICTION & ANALYSIS PORTAL")
    print("="*60)
    print("\nStarting server...")
    init_db()
    print("✓ Database initialized")
    sync_postgres_sequences()
    seed_admin_user()
    print("✓ API routes loaded")
    print("\nServer ready!")
    print("  - API Documentation: http://localhost:8000/api/docs")
    print("  - Alternative Docs: http://localhost:8000/api/redoc")
    print("="*60 + "\n")


@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Traffic Accident Prediction & Analysis Portal API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "endpoints": {
            "accidents": "/api/accidents",
            "predictions": "/api/predictions",
            "statistics": "/api/stats"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "traffic-portal-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
