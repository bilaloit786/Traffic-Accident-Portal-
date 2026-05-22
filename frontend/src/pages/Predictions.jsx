import { useState, useEffect } from 'react'
import axios from 'axios'
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import ErrorBoundary from '../components/ErrorBoundary'

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Map helpers for click selection and auto-recentering
function MapClickSelector({ setLocation }) {
    useMapEvents({
        click(e) {
            setLocation(e.latlng.lat, e.latlng.lng)
        }
    })
    return null
}

function MapRecenter({ lat, lng }) {
    const map = useMap()
    useEffect(() => {
        const latitude = parseFloat(lat)
        const longitude = parseFloat(lng)
        if (!isNaN(latitude) && !isNaN(longitude) && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180) {
            map.setView([latitude, longitude], map.getZoom())
        }
    }, [lat, lng, map])
    return null
}

const API_URL = 'http://localhost:8000/api'

function Predictions() {
    const [formData, setFormData] = useState({
        latitude: 32.574,
        longitude: 74.075,
        hour: 18,
        weather: 'Clear',
        road_type: 'Highway',
        day_of_week: 'Monday',
        vehicles_involved: 2
    })
    const [prediction, setPrediction] = useState(null)
    const [loading, setLoading] = useState(false)
    const [showModal, setShowModal] = useState(false)

    const handleMapClick = (lat, lng) => {
        const roundedLat = Math.round(lat * 1000000) / 1000000
        const roundedLng = Math.round(lng * 1000000) / 1000000
        setFormData(prev => ({
            ...prev,
            latitude: roundedLat,
            longitude: roundedLng
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await axios.post(`${API_URL}/predictions/predict`, formData)
            setPrediction(response.data)
            setShowModal(true)
            setLoading(false)
        } catch (error) {
            console.error('Error getting prediction:', error)
            setLoading(false)
        }
    }

    const riskColors = {
        'Low': { bg: 'rgba(16, 185, 129, 0.1)', border: '#10b981', text: '#10b981' },
        'Medium': { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' },
        'High': { bg: 'rgba(239, 68, 68, 0.1)', border: '#ef4444', text: '#ef4444' }
    }

    const getRiskIcon = (level) => {
        switch (level) {
            case 'High': return '⚠️'
            case 'Medium': return '⚡'
            case 'Low': return '✅'
            default: return '❓'
        }
    }

    return (
        <div className="fade-in">
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
                🔮 Accident Risk Prediction
            </h2>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', 
                gap: '2rem',
                alignItems: 'start'
            }}>
                {/* Left Column: Interactive Map Selector */}
                <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '550px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        📍 Select Location on Map
                    </h3>
                     <div style={{ borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--glass-border)', position: 'relative', zIndex: 1 }}>
                        <ErrorBoundary>
                            <MapContainer
                                center={[
                                    typeof formData.latitude === 'number' && !isNaN(formData.latitude) ? formData.latitude : 32.574,
                                    typeof formData.longitude === 'number' && !isNaN(formData.longitude) ? formData.longitude : 74.075
                                ]}
                                zoom={13}
                                style={{ height: '450px', width: '100%', borderRadius: '0.5rem' }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <MapClickSelector setLocation={handleMapClick} />
                                <MapRecenter lat={formData.latitude} lng={formData.longitude} />
                                {!isNaN(parseFloat(formData.latitude)) && !isNaN(parseFloat(formData.longitude)) && (
                                    <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
                                )}
                            </MapContainer>
                        </ErrorBoundary>
                    </div>
                    <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
                        Click anywhere on the map to set coordinates automatically.
                    </div>
                </div>

                {/* Right Column: Input Form & Prediction Result */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {/* Input Form */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                            Enter Location & Conditions
                        </h3>

                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Latitude
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={formData.latitude}
                                    onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Longitude
                                </label>
                                <input
                                    type="number"
                                    step="0.000001"
                                    value={formData.longitude}
                                    onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Hour of Day (0-23)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    value={formData.hour}
                                    onChange={e => setFormData({ ...formData, hour: parseInt(e.target.value) })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Weather Condition
                                </label>
                                <select
                                    value={formData.weather}
                                    onChange={e => setFormData({ ...formData, weather: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        color: 'var(--color-text-primary)'
                                    }}
                                >
                                    <option value="Clear">Clear</option>
                                    <option value="Cloudy">Cloudy</option>
                                    <option value="Rain">Rain</option>
                                    <option value="Heavy Rain">Heavy Rain</option>
                                    <option value="Fog">Fog</option>
                                    <option value="Snow">Snow</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Road Type
                                </label>
                                <select
                                    value={formData.road_type}
                                    onChange={e => setFormData({ ...formData, road_type: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        color: 'var(--color-text-primary)'
                                    }}
                                >
                                    <option value="Highway">Highway</option>
                                    <option value="Arterial">Arterial</option>
                                    <option value="Residential">Residential</option>
                                    <option value="Intersection">Intersection</option>
                                    <option value="Rural">Rural</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                                    Day of Week
                                </label>
                                <select
                                    value={formData.day_of_week}
                                    onChange={e => setFormData({ ...formData, day_of_week: e.target.value })}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--color-bg-tertiary)',
                                        border: '1px solid var(--glass-border)',
                                        borderRadius: '0.5rem',
                                        color: 'var(--color-text-primary)'
                                    }}
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    marginTop: '1rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: '700',
                                    fontSize: '1rem',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.6 : 1
                                }}
                            >
                                {loading ? 'Predicting...' : '🔮 Predict Risk'}
                            </button>
                        </div>
                    </form>
                </div>

                    {/* Reopen/View Results Button */}
                    {prediction && !showModal && (
                        <div className="glass-card fade-in" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                                Prediction generated for:<br />
                                <strong style={{ color: 'var(--color-primary)', fontSize: '1.05rem', display: 'block', margin: '0.25rem 0' }}>
                                    {prediction.nearest_road || 'Custom Location'}
                                </strong>
                                <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                                    ({formData.latitude}, {formData.longitude})
                                </span>
                            </div>
                            <button
                                onClick={() => setShowModal(true)}
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    boxShadow: 'var(--shadow-md)'
                                }}
                            >
                                🔍 View Prediction Results
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Popup for Prediction Results */}
            {prediction && showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 1000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '2rem'
                }}>
                    <div className="glass-card fade-in" style={{
                        width: '100%',
                        maxWidth: '900px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                        borderRadius: '1rem'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: 'rgba(0, 0, 0, 0.1)'
                        }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', margin: 0, color: 'var(--color-text-primary)' }}>
                                🔮 Risk Prediction Results
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: 'var(--color-text-muted)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '0.25rem',
                                    lineHeight: 1
                                }}
                                onMouseEnter={e => e.target.style.color = 'var(--color-danger)'}
                                onMouseLeave={e => e.target.style.color = 'var(--color-text-muted)'}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
                            {/* Physical Location Address */}
                            <div style={{
                                padding: '1rem 1.5rem',
                                marginBottom: '1.5rem',
                                borderRadius: '0.75rem',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>📍</span>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em' }}>Resolved Location Address</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-primary)', marginTop: '0.15rem' }}>
                                        {prediction.nearest_road || 'Unknown Location'}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.1rem' }}>
                                        Coordinates: {formData.latitude}, {formData.longitude}
                                    </div>
                                </div>
                            </div>

                            {/* Ensemble/Consensus Prediction */}
                            {prediction.ensemble_risk_level && (
                                <div style={{
                                    padding: '2rem',
                                    marginBottom: '2rem',
                                    borderRadius: '1rem',
                                    background: 'linear-gradient(135deg, rgba(96, 165, 250, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)',
                                    border: '2px solid #6366f1',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: '600' }}>
                                        ENSEMBLE PREDICTION (Combined)
                                    </div>
                                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                                        {getRiskIcon(prediction.ensemble_risk_level)}
                                    </div>
                                    <div style={{
                                        fontSize: '2.5rem',
                                        fontWeight: '700',
                                        color: riskColors[prediction.ensemble_risk_level]?.text || '#6366f1'
                                    }}>
                                        {prediction.ensemble_risk_level} Risk
                                    </div>
                                </div>
                            )}

                            {/* Model Predictions Side by Side */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                                {/* Random Forest */}
                                {prediction.random_forest && (
                                    <div style={{
                                        padding: '1.5rem',
                                        borderRadius: '1rem',
                                        background: riskColors[prediction.random_forest.risk_level]?.bg || riskColors.Low.bg,
                                        border: `2px solid ${riskColors[prediction.random_forest.risk_level]?.border || riskColors.Low.border}`
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontWeight: '600' }}>
                                            🌲 RANDOM FOREST
                                        </div>
                                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                                {getRiskIcon(prediction.random_forest.risk_level)}
                                            </div>
                                            <div style={{
                                                fontSize: '1.75rem',
                                                fontWeight: '700',
                                                color: riskColors[prediction.random_forest.risk_level]?.text
                                            }}>
                                                {prediction.random_forest.risk_level} Risk
                                            </div>
                                            <div style={{ fontSize: '0.95rem', marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                                Confidence: {(prediction.random_forest.risk_score * 100).toFixed(1)}%
                                            </div>
                                        </div>

                                        {/* RF Probabilities */}
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                                            Probabilities:
                                        </div>
                                        {Object.entries(prediction.random_forest.probabilities).map(([level, prob]) => (
                                            <div key={level} style={{ marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                    <span style={{ textTransform: 'capitalize' }}>{level}</span>
                                                    <span>{(prob * 100).toFixed(1)}%</span>
                                                </div>
                                                <div style={{
                                                    height: '6px',
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${prob * 100}%`,
                                                        background: level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981'
                                                    }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* XGBoost */}
                                {prediction.xgboost && (
                                    <div style={{
                                        padding: '1.5rem',
                                        borderRadius: '1rem',
                                        background: riskColors[prediction.xgboost.risk_level]?.bg || riskColors.Low.bg,
                                        border: `2px solid ${riskColors[prediction.xgboost.risk_level]?.border || riskColors.Low.border}`
                                    }}>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem', fontWeight: '600' }}>
                                            🚀 XGBOOST
                                        </div>
                                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
                                                {getRiskIcon(prediction.xgboost.risk_level)}
                                            </div>
                                            <div style={{
                                                fontSize: '1.75rem',
                                                fontWeight: '700',
                                                color: riskColors[prediction.xgboost.risk_level]?.text
                                            }}>
                                                {prediction.xgboost.risk_level} Risk
                                            </div>
                                            <div style={{ fontSize: '0.95rem', marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                                Confidence: {(prediction.xgboost.risk_score * 100).toFixed(1)}%
                                            </div>
                                        </div>

                                        {/* XGB Probabilities */}
                                        <div style={{ fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.75rem' }}>
                                            Probabilities:
                                        </div>
                                        {Object.entries(prediction.xgboost.probabilities).map(([level, prob]) => (
                                            <div key={level} style={{ marginBottom: '0.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                                                    <span style={{ textTransform: 'capitalize' }}>{level}</span>
                                                    <span>{(prob * 100).toFixed(1)}%</span>
                                                </div>
                                                <div style={{
                                                    height: '6px',
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        height: '100%',
                                                        width: `${prob * 100}%`,
                                                        background: level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981'
                                                    }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Model Comparison Table */}
                            {prediction.model_comparison && (
                                <div style={{ marginBottom: '2rem' }}>
                                    <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Model Comparison:</h4>
                                    <div style={{
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: '0.5rem',
                                        overflow: 'hidden',
                                        border: '1px solid var(--color-border)'
                                    }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid var(--color-border)' }}>
                                            <div style={{ padding: '1rem', fontWeight: '600', borderRight: '1px solid var(--color-border)' }}>Model</div>
                                            <div style={{ padding: '1rem', fontWeight: '600', borderRight: '1px solid var(--color-border)' }}>Risk Level</div>
                                            <div style={{ padding: '1rem', fontWeight: '600' }}>Confidence</div>
                                        </div>
                                        {Object.entries(prediction.model_comparison).map(([model, data]) => (
                                            <div key={model} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                                                <div style={{ padding: '1rem', borderRight: '1px solid var(--color-border)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '600' }}>
                                                    {model === 'random_forest' ? '🌲 Random Forest' : '🚀 XGBoost'}
                                                </div>
                                                <div style={{ padding: '1rem', borderRight: '1px solid var(--color-border)', color: riskColors[data.risk_level]?.text }}>
                                                    {data.risk_level}
                                                </div>
                                                <div style={{ padding: '1rem' }}>{data.confidence}%</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recommendations */}
                            <div>
                                <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Safety Recommendations:</h4>
                                <div style={{ display: 'grid', gap: '0.5rem' }}>
                                    {prediction.recommendations.map((rec, idx) => (
                                        <div key={idx} style={{
                                            padding: '0.75rem',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            borderRadius: '0.5rem',
                                            borderLeft: '3px solid var(--color-primary)'
                                        }}>
                                            {rec}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--glass-border)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            background: 'rgba(0, 0, 0, 0.2)'
                        }}>
                            <button
                                className="btn-primary"
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Predictions
