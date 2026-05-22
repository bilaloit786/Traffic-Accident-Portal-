"""
API routes for report generation
"""

import re
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date, datetime, timedelta
from app.database import get_db, Accident, Road
from app.core.auth import get_current_police_user, User
from pydantic import BaseModel

router = APIRouter(prefix="/api/reports", tags=["reports"])


class ReportSummary(BaseModel):
    total_accidents: int
    total_injuries: int
    total_fatalities: int
    vehicles_involved: int


class HotspotDetail(BaseModel):
    latitude: float
    longitude: float
    accident_count: int
    total_injuries: int
    total_fatalities: int
    risk_level: str
    nearest_road_name: Optional[str] = None


class WeatherReportDetail(BaseModel):
    weather: str
    count: int
    injuries: int
    fatalities: int


class RoadReportDetail(BaseModel):
    road_type: str
    count: int
    injuries: int
    fatalities: int


class DailyTrendDetail(BaseModel):
    date: str
    count: int


class HourlyTrendDetail(BaseModel):
    hour: int
    count: int


class ReportResponse(BaseModel):
    start_date: str
    end_date: str
    period_type: str
    summary: ReportSummary
    severity_breakdown: dict
    weather_breakdown: List[WeatherReportDetail]
    road_type_breakdown: List[RoadReportDetail]
    daily_trends: List[DailyTrendDetail]
    hourly_trends: List[HourlyTrendDetail]
    hotspots: List[HotspotDetail]
    recommendations: List[str]
    executive_summary: str


@router.get("/generate", response_model=ReportResponse)
def generate_report(
    start_date: date = Query(..., description="Start date for the report"),
    end_date: date = Query(..., description="End date for the report"),
    period_type: str = Query("custom", description="Type of period: weekly, half_monthly, monthly, custom"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_police_user)
):
    """Generate structured analytical reports for a specific time period"""
    if start_date > end_date:
        raise HTTPException(status_code=400, detail="Start date cannot be after end_date")

    # Helper filter
    def filter_query(q):
        return q.filter(Accident.date >= start_date, Accident.date <= end_date)

    # 1. Main counts
    total_accidents = filter_query(db.query(func.count(Accident.id))).scalar() or 0

    if total_accidents == 0:
        return ReportResponse(
            start_date=str(start_date),
            end_date=str(end_date),
            period_type=period_type,
            summary=ReportSummary(total_accidents=0, total_injuries=0, total_fatalities=0, vehicles_involved=0),
            severity_breakdown={},
            weather_breakdown=[],
            road_type_breakdown=[],
            daily_trends=[],
            hourly_trends=[],
            hotspots=[],
            recommendations=["No accidents recorded in this period. No recommendations necessary."],
            executive_summary=f"No traffic accidents were recorded in the system between {start_date} and {end_date}."
        )

    total_injuries = filter_query(db.query(func.sum(Accident.injuries))).scalar() or 0
    total_fatalities = filter_query(db.query(func.sum(Accident.fatalities))).scalar() or 0
    vehicles_involved = filter_query(db.query(func.sum(Accident.vehicles_involved))).scalar() or 0

    # 2. Severity breakdown
    severity_counts = filter_query(db.query(
        Accident.severity,
        func.count(Accident.id).label('count')
    )).group_by(Accident.severity).all()
    severity_dict = {row.severity: row.count for row in severity_counts}

    # 3. Weather breakdown
    weather_stats = filter_query(db.query(
        Accident.weather,
        func.count(Accident.id).label('count'),
        func.sum(Accident.injuries).label('injuries'),
        func.sum(Accident.fatalities).label('fatalities')
    )).group_by(Accident.weather).order_by(func.count(Accident.id).desc()).all()

    weather_list = [
        WeatherReportDetail(
            weather=row.weather,
            count=row.count,
            injuries=int(row.injuries or 0),
            fatalities=int(row.fatalities or 0)
        )
        for row in weather_stats
    ]

    # 4. Road type breakdown
    road_stats = filter_query(db.query(
        Accident.road_type,
        func.count(Accident.id).label('count'),
        func.sum(Accident.injuries).label('injuries'),
        func.sum(Accident.fatalities).label('fatalities')
    )).group_by(Accident.road_type).order_by(func.count(Accident.id).desc()).all()

    road_list = [
        RoadReportDetail(
            road_type=row.road_type,
            count=row.count,
            injuries=int(row.injuries or 0),
            fatalities=int(row.fatalities or 0)
        )
        for row in road_stats
    ]

    # 5. Daily trends
    daily_stats = filter_query(db.query(
        Accident.date,
        func.count(Accident.id).label('count')
    )).group_by(Accident.date).order_by(Accident.date).all()

    daily_list = [
        DailyTrendDetail(date=str(row.date), count=row.count)
        for row in daily_stats
    ]

    # 6. Hourly trends
    hourly_stats = filter_query(db.query(
        Accident.hour,
        func.count(Accident.id).label('count')
    )).group_by(Accident.hour).order_by(Accident.hour).all()

    hourly_list = [
        HourlyTrendDetail(hour=row.hour, count=row.count)
        for row in hourly_stats
    ]

    # 7. Hotspots (top 5 rounded clusters)
    hotspot_results = filter_query(db.query(
        func.round(Accident.latitude, 3).label('lat'),
        func.round(Accident.longitude, 3).label('lon'),
        func.count(Accident.id).label('count'),
        func.sum(Accident.injuries).label('injuries'),
        func.sum(Accident.fatalities).label('fatalities')
    )).group_by('lat', 'lon').order_by(func.count(Accident.id).desc()).limit(5).all()

    hotspots_list = []
    for row in hotspot_results:
        # Determine risk level based on count
        if row.count >= 8:
            risk_level = "High"
        elif row.count >= 4:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        # Find nearest road in DB
        nearest_road = db.query(Road).order_by(
            (Road.latitude - row.lat) * (Road.latitude - row.lat) +
            (Road.longitude - row.lon) * (Road.longitude - row.lon)
        ).first()
        nearest_road_name = re.sub(r'\s*#\d+\s*$', '', nearest_road.name).strip() if nearest_road else "Unknown Location"

        hotspots_list.append(
            HotspotDetail(
                latitude=float(row.lat),
                longitude=float(row.lon),
                accident_count=row.count,
                total_injuries=int(row.injuries or 0),
                total_fatalities=int(row.fatalities or 0),
                risk_level=risk_level,
                nearest_road_name=nearest_road_name
            )
        )

    # 8. Recommendation Generation Logic
    recommendations = []
    
    # Analyze peak hours
    max_hour_count = 0
    peak_hour = 18
    for row in hourly_stats:
        if row.count > max_hour_count:
            max_hour_count = row.count
            peak_hour = row.hour
    
    # Peak hour recommendation
    recommendations.append(
        f"Increase traffic police deployment and speed checks during peak accident hour: {peak_hour}:00 - {peak_hour+1}:00."
    )

    # Weather analysis
    if len(weather_list) > 0:
        most_dangerous_weather = weather_list[0].weather
        if most_dangerous_weather not in ["Clear", "Sunny"]:
            recommendations.append(
                f"Implement active warning displays (VMS boards) and reduce speed limits on major routes during {most_dangerous_weather} conditions."
            )
        else:
            recommendations.append(
                "Establish defensive driving campaigns and speed limit enforcement on clear-weather corridors where drivers tend to speed."
            )

    # Road type analysis
    if len(road_list) > 0:
        top_road = road_list[0].road_type
        recommendations.append(
            f"Review safety signage, lane markings, and pedestrian crossings on {top_road} roads, which logged the highest accident volume ({road_list[0].count})."
        )
    
    # Severity analysis
    fatal_count = severity_dict.get("Fatal", 0)
    severe_count = severity_dict.get("Severe", 0)
    fatal_ratio = (fatal_count + severe_count) / total_accidents if total_accidents > 0 else 0
    if fatal_ratio > 0.2:
        recommendations.append(
            f"High proportion of severe/fatal accidents ({fatal_ratio*100:.1f}%). Deploy ambulance standby points closer to the identified hotspots for faster emergency response times."
        )

    if len(hotspots_list) > 0:
        top_hot = hotspots_list[0]
        recommendations.append(
            f"Prioritize structural road audit and install high-visibility flashing beacons near key hotspot cluster at {top_hot.nearest_road_name} ({top_hot.latitude:.3f}, {top_hot.longitude:.3f})."
        )

    # 9. Executive Summary Text Generation
    days = (end_date - start_date).days + 1
    
    most_common_severity = max(severity_dict, key=severity_dict.get) if severity_dict else "N/A"
    weather_summary = f"predominantly under '{weather_list[0].weather}' weather conditions" if weather_list else ""
    road_summary = f"on '{road_list[0].road_type}' road types" if road_list else ""
    
    exec_summary = (
        f"This official traffic safety report covers a {days}-day period from {start_date} to {end_date}. "
        f"A total of {total_accidents} accidents were recorded, involving {vehicles_involved} vehicles. "
        f"These incidents resulted in {total_injuries} injuries and {total_fatalities} fatalities. "
        f"The highest proportion of accidents were classified as '{most_common_severity}' severity. "
        f"Accidents occurred {weather_summary} and were most frequent {road_summary}. "
        f"The peak crash frequency was recorded around {peak_hour}:00. "
        f"Based on the analysis, {len(recommendations)} target mitigations have been proposed to improve road safety in the region."
    )

    return ReportResponse(
        start_date=str(start_date),
        end_date=str(end_date),
        period_type=period_type,
        summary=ReportSummary(
            total_accidents=total_accidents,
            total_injuries=int(total_injuries),
            total_fatalities=int(total_fatalities),
            vehicles_involved=int(vehicles_involved)
        ),
        severity_breakdown=severity_dict,
        weather_breakdown=weather_list,
        road_type_breakdown=road_list,
        daily_trends=daily_list,
        hourly_trends=hourly_list,
        hotspots=hotspots_list,
        recommendations=recommendations,
        executive_summary=exec_summary
    )
