"""
Main FastAPI application
Traffic Accident Prediction & Analysis Portal
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
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
    ]
    configured_origins = [
        origin.strip()
        for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
        if origin.strip()
    ]
    return local_origins + configured_origins

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
