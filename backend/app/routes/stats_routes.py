"""
Statistics and analytics API routes
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.database import get_db, Accident
from app.core.auth import get_current_active_user, get_current_admin_user
from datetime import date, datetime
from typing import Optional

router = APIRouter(prefix="/api/stats", tags=["statistics"])


@router.get("/overview")
def get_overview_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get overall statistics and trends"""
    # Total accidents
    total = db.query(func.count(Accident.id)).scalar()
    
    # Severity breakdown
    severity_counts = db.query(
        Accident.severity,
        func.count(Accident.id).label('count')
    ).group_by(Accident.severity).all()
    
    # Total casualties
    total_injuries = db.query(func.sum(Accident.injuries)).scalar() or 0
    total_fatalities = db.query(func.sum(Accident.fatalities)).scalar() or 0
    
    # Recent accidents (last 30 days)
    from datetime import timedelta
    thirty_days_ago = datetime.now() - timedelta(days=30)
    recent_count = db.query(func.count(Accident.id)).filter(
        Accident.datetime >= thirty_days_ago
    ).scalar()
    
    # Most dangerous time
    peak_hour = db.query(
        Accident.hour,
        func.count(Accident.id).label('count')
    ).group_by(Accident.hour).order_by(func.count(Accident.id).desc()).first()
    
    # Most dangerous weather
    dangerous_weather = db.query(
        Accident.weather,
        func.count(Accident.id).label('count')
    ).group_by(Accident.weather).order_by(func.count(Accident.id).desc()).first()
    
    # Most dangerous road type
    dangerous_road = db.query(
        Accident.road_type,
        func.count(Accident.id).label('count')
    ).group_by(Accident.road_type).order_by(func.count(Accident.id).desc()).first()
    
    return {
        'total_accidents': total,
        'severity_breakdown': {row.severity: row.count for row in severity_counts},
        'total_injuries': int(total_injuries),
        'total_fatalities': int(total_fatalities),
        'recent_accidents_30d': recent_count,
        'peak_hour': peak_hour.hour if peak_hour else None,
        'most_dangerous_weather': dangerous_weather.weather if dangerous_weather else None,
        'most_dangerous_road_type': dangerous_road.road_type if dangerous_road else None
    }


@router.get("/by-time")
def get_time_distribution(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Get accident distribution by time periods"""
    # By hour
    by_hour = db.query(
        Accident.hour,
        func.count(Accident.id).label('count')
    ).group_by(Accident.hour).order_by(Accident.hour).all()
    
    # By day of week
    by_day = db.query(
        Accident.day_of_week,
        func.count(Accident.id).label('count')
    ).group_by(Accident.day_of_week).all()
    
    # By month
    by_month = db.query(
        extract('month', Accident.datetime).label('month'),
        func.count(Accident.id).label('count')
    ).group_by('month').order_by('month').all()
    
    return {
        'by_hour': [{'hour': row.hour, 'count': row.count} for row in by_hour],
        'by_day_of_week': [{'day': row.day_of_week, 'count': row.count} for row in by_day],
        'by_month': [{'month': int(row.month), 'count': row.count} for row in by_month]
    }


@router.get("/by-weather")
def get_weather_distribution(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Get accident distribution by weather conditions"""
    weather_stats = db.query(
        Accident.weather,
        func.count(Accident.id).label('total_count'),
        func.count(func.nullif(Accident.severity == 'Minor', False)).label('minor'),
        func.count(func.nullif(Accident.severity == 'Moderate', False)).label('moderate'),
        func.count(func.nullif(Accident.severity == 'Severe', False)).label('severe'),
        func.count(func.nullif(Accident.severity == 'Fatal', False)).label('fatal'),
        func.sum(Accident.injuries).label('total_injuries'),
        func.sum(Accident.fatalities).label('total_fatalities')
    ).group_by(Accident.weather).all()
    
    return [{
        'weather': row.weather,
        'total_accidents': row.total_count,
        'severity_breakdown': {
            'minor': row.minor,
            'moderate': row.moderate,
            'severe': row.severe,
            'fatal': row.fatal
        },
        'total_injuries': int(row.total_injuries or 0),
        'total_fatalities': int(row.total_fatalities or 0)
    } for row in weather_stats]


@router.get("/by-road-type")
def get_road_type_distribution(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Get accident distribution by road type"""
    road_stats = db.query(
        Accident.road_type,
        func.count(Accident.id).label('total_count'),
        func.avg(Accident.injuries).label('avg_injuries'),
        func.avg(Accident.fatalities).label('avg_fatalities'),
        func.sum(Accident.injuries).label('total_injuries'),
        func.sum(Accident.fatalities).label('total_fatalities')
    ).group_by(Accident.road_type).all()
    
    return [{
        'road_type': row.road_type,
        'total_accidents': row.total_count,
        'average_injuries': float(row.avg_injuries or 0),
        'average_fatalities': float(row.avg_fatalities or 0),
        'total_injuries': int(row.total_injuries or 0),
        'total_fatalities': int(row.total_fatalities or 0)
    } for row in road_stats]


@router.get("/severity-analysis")
def get_severity_analysis(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Detailed severity analysis"""
    severity_stats = db.query(
        Accident.severity,
        func.count(Accident.id).label('count'),
        func.avg(Accident.injuries).label('avg_injuries'),
        func.avg(Accident.fatalities).label('avg_fatalities'),
        func.avg(Accident.vehicles_involved).label('avg_vehicles')
    ).group_by(Accident.severity).all()
    
    return [{
        'severity': row.severity,
        'count': row.count,
        'average_injuries': float(row.avg_injuries or 0),
        'average_fatalities': float(row.avg_fatalities or 0),
        'average_vehicles_involved': float(row.avg_vehicles or 0)
    } for row in severity_stats]


@router.get("/trends/monthly")
def get_monthly_trends(
    start_year: Optional[int] = 2020,
    end_year: Optional[int] = 2025,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Get monthly accident trends over time"""
    trends = db.query(
        extract('year', Accident.datetime).label('year'),
        extract('month', Accident.datetime).label('month'),
        func.count(Accident.id).label('count')
    ).filter(
        extract('year', Accident.datetime).between(start_year, end_year)
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    return [{
        'year': int(row.year),
        'month': int(row.month),
        'count': row.count
    } for row in trends]


@router.get("/trends/yearly")
def get_yearly_trends(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_admin_user)
):
    """Get yearly accident trends"""
    trends = db.query(
        extract('year', Accident.datetime).label('year'),
        func.count(Accident.id).label('total_accidents'),
        func.sum(Accident.injuries).label('total_injuries'),
        func.sum(Accident.fatalities).label('total_fatalities')
    ).group_by('year').order_by('year').all()
    
    return [{
        'year': int(row.year),
        'total_accidents': row.total_accidents,
        'total_injuries': int(row.total_injuries or 0),
        'total_fatalities': int(row.total_fatalities or 0)
    } for row in trends]
