"""
Prediction and analytics API routes
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import UJSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date
from pydantic import BaseModel
from app.database import get_db, Accident, Prediction, Road
from app.core.auth import get_current_active_user
from ml.model import AccidentPredictor
import json
import pandas as pd
import re
import numpy as np

router = APIRouter(prefix="/api/predictions", tags=["predictions"])

# Initialize ML model
predictor = AccidentPredictor()
try:
    predictor.load_model()
    if 'random_forest' in predictor.models:
        predictor.models['random_forest'].n_jobs = 1
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


class ModelPrediction(BaseModel):
    risk_level: str
    risk_score: float
    probabilities: dict


class PredictionResponse(BaseModel):
    random_forest: ModelPrediction = None
    xgboost: ModelPrediction = None
    ensemble_risk_level: str = None
    model_comparison: dict = None
    recommendations: list
    nearest_road: Optional[str] = None


class HotspotResponse(BaseModel):
    latitude: float
    longitude: float
    accident_count: int
    severity: str


@router.post("/predict", response_model=PredictionResponse)
def predict_accident_risk(
    request: PredictionRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Predict accident risk for given conditions using both Random Forest and XGBoost models"""
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
        
        # Get predictions from both models
        result = predictor.predict_risk(features)
        print(f"Prediction result: {result}")
        
        # Extract model predictions
        rf_pred = result.get('random_forest')
        xgb_pred = result.get('xgboost')
        ensemble_level = result.get('ensemble_risk_level', 'Medium')
        
        # Create model comparison
        model_comparison = {}
        if rf_pred:
            model_comparison['random_forest'] = {
                'risk_level': rf_pred['risk_level'],
                'confidence': round(rf_pred['risk_score'] * 100, 2)
            }
        if xgb_pred:
            model_comparison['xgboost'] = {
                'risk_level': xgb_pred['risk_level'],
                'confidence': round(xgb_pred['risk_score'] * 100, 2)
            }

        risk_probability = 0.0
        for model_prediction in [rf_pred, xgb_pred]:
            if model_prediction:
                risk_probability = max(risk_probability, float(model_prediction.get('risk_score', 0.0)))

        db.add(Prediction(
            latitude=request.latitude,
            longitude=request.longitude,
            risk_level=ensemble_level,
            risk_probability=risk_probability,
            factors=json.dumps({
                "input": features,
                "model_comparison": model_comparison
            })
        ))
        db.commit()
        
        # Generate recommendations based on ensemble prediction
        recommendations = []
        if ensemble_level == 'High':
            recommendations = [
                "⚠️ High accident risk detected",
                "Consider alternative routes if possible",
                "Drive with extra caution",
                "Reduce speed and maintain safe distance",
                "Avoid distractions"
            ]
        elif ensemble_level == 'Medium':
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
        
        # Find nearest road in DB
        nearest_road = db.query(Road).order_by(
            (Road.latitude - request.latitude) * (Road.latitude - request.latitude) +
            (Road.longitude - request.longitude) * (Road.longitude - request.longitude)
        ).first()
        nearest_road_name = get_base_name(nearest_road.name) if nearest_road else "Unknown Location"

        return PredictionResponse(
            random_forest=rf_pred,
            xgboost=xgb_pred,
            ensemble_risk_level=ensemble_level,
            model_comparison=model_comparison,
            recommendations=recommendations,
            nearest_road=nearest_road_name
        )
    except Exception as e:
        db.rollback()
        print(f"ERROR in prediction endpoint: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@router.get("/hotspots", response_model=list[HotspotResponse])
def get_accident_hotspots(
    limit: int = 20,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get accident hotspot locations"""
    # Get all accidents with optional date filter
    query = db.query(Accident)
    if start_date:
        query = query.filter(Accident.date >= start_date)
    if end_date:
        query = query.filter(Accident.date <= end_date)
    accidents = query.all()
    
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
    current_user: dict = Depends(get_current_active_user)
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
    current_user: dict = Depends(get_current_active_user)
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


road_cache = None


def get_base_name(name: str) -> str:
    # Strip everything starting with '#' or ' #' or similar
    return re.sub(r'\s*#\d+\s*$', '', name).strip()


def initialize_road_cache(db: Session):
    global road_cache
    if road_cache is not None:
        return
    
    print("Initializing topological road cache...")
    # Fetch all roads
    roads = db.query(Road).all()
    if not roads:
        road_cache = {}
        print("No roads found in the database.")
        return
    
    # Group by base name
    grouped_roads = {}
    for r in roads:
        if r.latitude is None or r.longitude is None:
            continue
        base = get_base_name(r.name)
        if base not in grouped_roads:
            grouped_roads[base] = []
        grouped_roads[base].append({
            'id': r.id,
            'type': r.type or 'Arterial',
            'latitude': r.latitude,
            'longitude': r.longitude
        })
    
    # Sort each road's points once using Nearest Neighbor
    sorted_roads = {}
    for base_name, pts in grouped_roads.items():
        if not pts:
            continue
        
        # Deduplicate coordinates to ensure clean line drawing
        unique_pts = {}
        for p in pts:
            coord_key = (round(p['latitude'], 6), round(p['longitude'], 6))
            if coord_key not in unique_pts:
                unique_pts[coord_key] = p
        
        pts_list = list(unique_pts.values())
        n_points = len(pts_list)
        if n_points == 0:
            continue
            
        coords = np.array([[p['latitude'], p['longitude']] for p in pts_list])
        
        unvisited = set(range(n_points))
        current_idx = np.argmin(coords[:, 0])
        unvisited.remove(current_idx)
        
        sorted_pts = [pts_list[current_idx]]
        
        while unvisited:
            curr = coords[current_idx]
            unvisited_list = list(unvisited)
            dists = np.sum((coords[unvisited_list] - curr)**2, axis=1)
            best_local_idx = np.argmin(dists)
            best_dist = np.sqrt(dists[best_local_idx])
            best_global_idx = unvisited_list[best_local_idx]
            
            sorted_pts[-1]['dist_to_next'] = float(best_dist)
            sorted_pts.append(pts_list[best_global_idx])
            current_idx = best_global_idx
            unvisited.remove(current_idx)
            
        sorted_pts[-1]['dist_to_next'] = 999.0
        sorted_roads[base_name] = sorted_pts

    # Build static dataframe for fast predictions
    all_pts_flat = []
    for base_name, pts in sorted_roads.items():
        all_pts_flat.extend(pts)
        
    if all_pts_flat:
        df_static = pd.DataFrame(all_pts_flat)
        col = 'road_type'
        df_static[col] = df_static['type'].fillna('Unknown')
        if col in predictor.label_encoders:
            mapping = {str(c): i for i, c in enumerate(predictor.label_encoders[col].classes_)}
            df_static['road_type_encoded'] = df_static[col].astype(str).map(lambda x: mapping.get(x, -1))
        else:
            df_static['road_type_encoded'] = -1
            
        static_df = df_static[['latitude', 'longitude', 'road_type_encoded']].copy()
    else:
        static_df = None
        
    road_cache = {
        'roads': sorted_roads,
        'static_df': static_df,
        'all_pts_flat': all_pts_flat
    }
    print(f"Topological road cache initialized with {len(sorted_roads)} unique roads and {len(all_pts_flat)} total points.")


road_severity_cache = {}


@router.get("/road-severity", response_class=UJSONResponse)
def get_road_severity(
    hour: int = 18,
    weather: str = "Clear",
    day_of_week: str = "Monday",
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_active_user)
):
    """Get predicted road severity layers (Google Maps style red/orange/green polylines)"""
    global road_cache
    
    # Check cache first
    cache_key = (hour, weather, day_of_week)
    if cache_key in road_severity_cache:
        return road_severity_cache[cache_key]
        
    if road_cache is None:
        initialize_road_cache(db)
        
    if not road_cache or road_cache['static_df'] is None:
        return []
        
    if predictor.model is None:
        raise HTTPException(status_code=503, detail="ML model not available")
        
    try:
        from datetime import datetime
        static_df = road_cache['static_df']
        all_pts_flat = road_cache['all_pts_flat']
        
        # Get encoded weather
        weather_val = weather or 'Clear'
        weather_col = 'weather'
        if weather_col in predictor.label_encoders:
            weather_mapping = {str(c): i for i, c in enumerate(predictor.label_encoders[weather_col].classes_)}
            weather_encoded = weather_mapping.get(weather_val, -1)
        else:
            weather_encoded = -1
            
        # Build X dataframe directly with static + dynamic inputs
        n_rows = len(static_df)
        data_dict = {
            'latitude': static_df['latitude'].values,
            'longitude': static_df['longitude'].values,
            'road_type_encoded': static_df['road_type_encoded'].values,
            'hour': np.full(n_rows, hour, dtype=np.int32),
            'weather_encoded': np.full(n_rows, weather_encoded, dtype=np.int32),
            'is_rush_hour': np.full(n_rows, 1 if hour in [7, 8, 9, 17, 18, 19] else 0, dtype=np.int32),
            'is_weekend': np.full(n_rows, 1 if day_of_week in ['Saturday', 'Sunday'] else 0, dtype=np.int32),
            'is_night': np.full(n_rows, 1 if (hour >= 22 or hour <= 5) else 0, dtype=np.int32),
            'vehicles_involved': np.full(n_rows, 2, dtype=np.int32),
        }
        if 'month' in predictor.feature_names:
            data_dict['month'] = np.full(n_rows, datetime.now().month, dtype=np.int32)
            
        X = pd.DataFrame(data_dict)[predictor.feature_names]
        
        # Get predictions
        preds_rf = None
        preds_xgb = None
        
        if 'random_forest' in predictor.models:
            preds_rf = predictor.models['random_forest'].predict(X)
        if 'xgboost' in predictor.models:
            preds_xgb = predictor.models['xgboost'].predict(X)
            
        # Vectorized severity level calculations
        if preds_rf is not None and preds_xgb is not None:
            max_preds = np.maximum(preds_rf, preds_xgb)
        elif preds_rf is not None:
            max_preds = preds_rf
        else:
            max_preds = preds_xgb
            
        mapping_arr = np.array(['Low', 'Medium', 'High'])
        severities = mapping_arr[max_preds]
        
        # Map severities back to flat list of points
        for idx, p in enumerate(all_pts_flat):
            p['severity'] = severities[idx]
            
    except Exception as e:
        print(f"Error in batch prediction: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to generate predictions: {str(e)}")
        
    # Assemble segments
    api_segments = []
    max_gap = 0.02  # max distance threshold between consecutive points (~2km)
    
    for base_name, pts in road_cache['roads'].items():
        if not pts:
            continue
            
        # Start the first segment
        current_segment = {
            'road_name': base_name,
            'severity': pts[0]['severity'],
            'coordinates': [[pts[0]['latitude'], pts[0]['longitude']]]
        }
        
        for i in range(len(pts) - 1):
            curr_pt = pts[i]
            next_pt = pts[i+1]
            dist = curr_pt.get('dist_to_next', 999.0)
            
            # Case 1: Gap in coordinates is too large
            if dist > max_gap:
                api_segments.append(current_segment)
                current_segment = {
                    'road_name': base_name,
                    'severity': next_pt['severity'],
                    'coordinates': [[next_pt['latitude'], next_pt['longitude']]]
                }
            # Case 2: Severity level changes
            elif curr_pt['severity'] != next_pt['severity']:
                # Close the current segment by connecting to the transition point
                current_segment['coordinates'].append([next_pt['latitude'], next_pt['longitude']])
                api_segments.append(current_segment)
                
                # Start new segment of different color from the transition point
                current_segment = {
                    'road_name': base_name,
                    'severity': next_pt['severity'],
                    'coordinates': [[next_pt['latitude'], next_pt['longitude']]]
                }
            # Case 3: Same severity, normal connection
            else:
                current_segment['coordinates'].append([next_pt['latitude'], next_pt['longitude']])
                
        api_segments.append(current_segment)
        
    road_severity_cache[cache_key] = api_segments
    return api_segments
