"""
Accident-related API routes
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import List, Optional
from datetime import datetime, date
from app.database import get_db, Accident
from app.core.auth import get_current_active_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/accidents", tags=["accidents"])


# Pydantic models for request/response
class AccidentResponse(BaseModel):
    id: int
    latitude: float
    longitude: float
    datetime: datetime
    weather: str
    road_type: str
    severity: str
    injuries: int
    fatalities: int
    vehicles_involved: int
    description: Optional[str] = None
    
    class Config:
        from_attributes = True


class HeatmapPoint(BaseModel):
    latitude: float
    longitude: float
    intensity: int


class TimelineData(BaseModel):
    period: str
    count: int
    severity_breakdown: dict


@router.get("/", response_model=List[AccidentResponse])
def get_accidents(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=50000),
    severity: Optional[str] = None,
    weather: Optional[str] = None,
    road_type: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    """Get list of accidents with optional filters - PUBLIC endpoint"""
    query = db.query(Accident)
    
    # Apply filters
    if severity:
        query = query.filter(Accident.severity == severity)
    if weather:
        query = query.filter(Accident.weather == weather)
    if road_type:
        query = query.filter(Accident.road_type == road_type)
    if start_date:
        query = query.filter(Accident.date >= start_date)
    if end_date:
        query = query.filter(Accident.date <= end_date)
    
    # Order by most recent first
    query = query.order_by(Accident.datetime.desc())
    
    accidents = query.offset(skip).limit(limit).all()
    return accidents


@router.get("/{accident_id}", response_model=AccidentResponse)
def get_accident(
    accident_id: int, 
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get specific accident details"""
    accident = db.query(Accident).filter(Accident.id == accident_id).first()
    if not accident:
        raise HTTPException(status_code=404, detail="Accident not found")
    return accident


@router.get("/heatmap/data", response_model=List[HeatmapPoint])
def get_heatmap_data(
    severity: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get accident density data for heatmap visualization"""
    rounded_latitude = (func.floor(Accident.latitude * 1000) / 1000.0).label("latitude")
    rounded_longitude = (func.floor(Accident.longitude * 1000) / 1000.0).label("longitude")

    query = db.query(
        rounded_latitude,
        rounded_longitude,
        func.count(Accident.id).label('intensity')
    )
    
    # Apply filters
    if severity:
        query = query.filter(Accident.severity == severity)
    if start_date:
        query = query.filter(Accident.date >= start_date)
    if end_date:
        query = query.filter(Accident.date <= end_date)
    
    # Group by location (rounded to reduce points)
    query = query.group_by(rounded_latitude, rounded_longitude)
    
    results = query.all()
    
    heatmap_points = [
        HeatmapPoint(
            latitude=float(lat),
            longitude=float(lon),
            intensity=int(intensity)
        )
        for lat, lon, intensity in results
    ]
    
    return heatmap_points


@router.get("/timeline/hourly")
def get_hourly_timeline(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get accidents grouped by hour of day"""
    results = db.query(
        Accident.hour,
        func.count(Accident.id).label('count'),
        func.count(func.nullif(Accident.severity == 'Minor', False)).label('minor'),
        func.count(func.nullif(Accident.severity == 'Moderate', False)).label('moderate'),
        func.count(func.nullif(Accident.severity == 'Severe', False)).label('severe'),
        func.count(func.nullif(Accident.severity == 'Fatal', False)).label('fatal')
    ).group_by(Accident.hour).order_by(Accident.hour).all()
    
    timeline = []
    for row in results:
        timeline.append({
            'hour': row.hour,
            'count': row.count,
            'severity_breakdown': {
                'minor': row.minor,
                'moderate': row.moderate,
                'severe': row.severe,
                'fatal': row.fatal
            }
        })
    
    return timeline


@router.get("/timeline/daily")
def get_daily_timeline(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get accidents grouped by date"""
    query = db.query(
        Accident.date,
        func.count(Accident.id).label('count')
    )
    
    if start_date:
        query = query.filter(Accident.date >= start_date)
    if end_date:
        query = query.filter(Accident.date <= end_date)
    
    results = query.group_by(Accident.date).order_by(Accident.date).all()
    
    return [{'date': str(row.date), 'count': row.count} for row in results]


@router.get("/search/nearby")
def search_nearby(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
    radius: float = Query(0.05, description="Search radius in degrees (~5km)"),
    limit: int = Query(50, le=500),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Search for accidents near a specific location"""
    # Simple bounding box search
    lat_delta = radius
    lon_delta = radius
    
    accidents = db.query(Accident).filter(
        and_(
            Accident.latitude >= latitude - lat_delta,
            Accident.latitude <= latitude + lat_delta,
            Accident.longitude >= longitude - lon_delta,
            Accident.longitude <= longitude + lon_delta
        )
    ).order_by(Accident.datetime.desc()).limit(limit).all()
    
    return accidents


@router.get("/count/total")
def get_total_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get total accident count and breakdown by severity"""
    total = db.query(func.count(Accident.id)).scalar()
    
    severity_counts = db.query(
        Accident.severity,
        func.count(Accident.id).label('count')
    ).group_by(Accident.severity).all()
    
    return {
        'total': total,
        'by_severity': {row.severity: row.count for row in severity_counts}
    }
