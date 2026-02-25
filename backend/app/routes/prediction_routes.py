"""
Prediction and analytics API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from pydantic import BaseModel
from app.database import get_db, Accident
from app.core.auth import get_current_police_user
from ml.model import AccidentPredictor
import pandas as pd

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

# Initialize ML model
predictor = AccidentPredictor()
try:
    predictor.load_model()
except FileNotFoundError:
    print("Warning: ML model not found. Please train the model first.")


class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    hour: int
    weather: str
    road_type: str
    day_of_week: Optional[str] = "Monday"
    vehicles_involved: Optional[int] = 2


class PredictionResponse(BaseModel):
    risk_level: str
    risk_score: float
    probabilities: dict
    recommendations: list


class HotspotResponse(BaseModel):
    latitude: float
    longitude: float
    accident_count: int
    severity: str


@router.post("/predict", response_model=PredictionResponse)
def predict_accident_risk(
    request: PredictionRequest,
    current_user: dict = Depends(get_current_police_user)
):
    """Predict accident risk for given conditions"""
    if predictor.model is None:
        raise HTTPException(status_code=503, detail="ML model not available. Please train the model first.")
    
    try:
        # Prepare features
        features = {
            'latitude': request.latitude,
            'longitude': request.longitude,
            'hour': request.hour,
            'weather': request.weather,
            'road_type': request.road_type,
            'day_of_week': request.day_of_week,
            'vehicles_involved': request.vehicles_involved,
            'is_weekend': 1 if request.day_of_week in ['Saturday', 'Sunday'] else 0
        }
        
        print(f"Predicting with features: {features}")
        
        # Get prediction
        result = predictor.predict_risk(features)
        print(f"Prediction result: {result}")
        
        # Generate recommendations based on risk level
        recommendations = []
        if result['risk_level'] == 'High':
            recommendations = [
                "⚠️ High accident risk detected",
                "Consider alternative routes if possible",
                "Drive with extra caution",
                "Reduce speed and maintain safe distance",
                "Avoid distractions"
            ]
        elif result['risk_level'] == 'Medium':
            recommendations = [
                "⚠️ Moderate accident risk",
                "Stay alert and drive carefully",
                "Follow traffic rules strictly",
                "Be prepared for sudden stops"
            ]
        else:
            recommendations = [
                "✓ Low accident risk",
                "Drive safely and follow traffic rules",
                "Stay alert for any changes in conditions"
            ]
        
        # Add weather-specific recommendations
        if request.weather in ['Rain', 'Heavy Rain']:
            recommendations.append("🌧️ Wet roads - reduce speed and increase following distance")
        elif request.weather == 'Fog':
            recommendations.append("🌫️ Low visibility - use fog lights and drive slowly")
        
        # Add time-specific recommendations
        if request.hour in [7, 8, 9, 17, 18, 19]:
            recommendations.append("🚗 Rush hour - expect heavy traffic")
        elif request.hour in range(22, 24) or request.hour in range(0, 6):
            recommendations.append("🌙 Night time - use headlights and be extra cautious")
        
        return PredictionResponse(
            risk_level=result['risk_level'],
            risk_score=result['risk_score'],
            probabilities=result['probabilities'],
            recommendations=recommendations
        )
    except Exception as e:
        print(f"ERROR in prediction endpoint: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/hotspots", response_model=list[HotspotResponse])
def get_accident_hotspots(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_police_user)
):
    """Get accident hotspot locations"""
    # Get all accidents
    accidents = db.query(Accident).all()
    
    if len(accidents) == 0:
        return []
    
    # Convert to DataFrame
    accidents_data = [{
        'latitude': a.latitude,
        'longitude': a.longitude,
        'severity': a.severity
    } for a in accidents]
    
    df = pd.DataFrame(accidents_data)
    
    # Use predictor to identify hotspots
    hotspots = predictor.predict_hotspots(df)
    
    return hotspots[:limit]


@router.get("/risk-zones")
def get_risk_zones(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_police_user)
):
    """Get risk level zones for map visualization"""
    # Create a grid of predictions
    lat_min, lat_max = 32.5, 32.7
    lon_min, lon_max = 74.0, 74.2
    grid_size = 0.02
    
    risk_zones = []
    
    import numpy as np
    lat_points = np.arange(lat_min, lat_max, grid_size)
    lon_points = np.arange(lon_min, lon_max, grid_size)
    
    # Sample predictions for grid points
    for lat in lat_points:
        for lon in lon_points:
            # Predict risk for typical conditions
            features = {
                'latitude': float(lat),
                'longitude': float(lon),
                'hour': 18,  # Evening rush hour
                'weather': 'Clear',
                'road_type': 'Arterial',
                'day_of_week': 'Monday',
                'vehicles_involved': 2,
                'is_weekend': 0
            }
            
            try:
                if predictor.model is not None:
                    result = predictor.predict_risk(features)
                    risk_zones.append({
                        'latitude': float(lat),
                        'longitude': float(lon),
                        'risk_level': result['risk_level'],
                        'risk_score': result['risk_score']
                    })
            except:
                pass
    
    return risk_zones


@router.post("/analyze-route")
def analyze_route(
    waypoints: list[dict],
    weather: str = "Clear",
    time_of_day: int = 12,
    current_user: dict = Depends(get_current_police_user)
):
    """Analyze safety of a planned route"""
    if predictor.model is None:
        raise HTTPException(status_code=503, detail="ML model not available")
    
    route_analysis = []
    total_risk_score = 0
    
    for point in waypoints:
        features = {
            'latitude': point['latitude'],
            'longitude': point['longitude'],
            'hour': time_of_day,
            'weather': weather,
            'road_type': point.get('road_type', 'Arterial'),
            'day_of_week': 'Monday',
            'vehicles_involved': 2,
            'is_weekend': 0
        }
        
        result = predictor.predict_risk(features)
        total_risk_score += result['risk_score']
        
        route_analysis.append({
            'location': point,
            'risk_level': result['risk_level'],
            'risk_score': result['risk_score']
        })
    
    avg_risk = total_risk_score / len(waypoints) if waypoints else 0
    overall_risk = 'High' if avg_risk > 0.6 else 'Medium' if avg_risk > 0.3 else 'Low'
    
    return {
        'overall_risk': overall_risk,
        'average_risk_score': avg_risk,
        'waypoint_analysis': route_analysis,
        'recommendation': 'Consider alternative route' if overall_risk == 'High' else 'Route is relatively safe'
    }
