import { useState } from 'react'
import axios from 'axios'

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

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const response = await axios.post(`${API_URL}/predictions/predict`, formData)
            setPrediction(response.data)
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

    return (
        <div className="fade-in">
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
                🔮 Accident Risk Prediction
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: prediction ? '1fr 1fr' : '1fr', gap: '2rem' }}>
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

                {/* Prediction Result */}
                {prediction && (
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                            Prediction Result
                        </h3>

                        {/* Risk Level */}
                        <div style={{
                            padding: '2rem',
                            marginBottom: '2rem',
                            borderRadius: '1rem',
                            background: riskColors[prediction.risk_level]?.bg || riskColors.Low.bg,
                            border: `2px solid ${riskColors[prediction.risk_level]?.border || riskColors.Low.border}`,
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
                                {prediction.risk_level === 'High' ? '⚠️' : prediction.risk_level === 'Medium' ? '⚡' : '✅'}
                            </div>
                            <div style={{
                                fontSize: '2.5rem',
                                fontWeight: '700',
                                color: riskColors[prediction.risk_level]?.text || riskColors.Low.text
                            }}>
                                {prediction.risk_level} Risk
                            </div>
                            <div style={{ fontSize: '1.25rem', marginTop: '0.5rem', color: 'var(--color-text-secondary)' }}>
                                Confidence: {(prediction.risk_score * 100).toFixed(1)}%
                            </div>
                        </div>

                        {/* Probabilities */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h4 style={{ marginBottom: '1rem', fontWeight: '600' }}>Risk Breakdown:</h4>
                            <div style={{ display: 'grid', gap: '0.75rem' }}>
                                {Object.entries(prediction.probabilities).map(([level, prob]) => (
                                    <div key={level}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ textTransform: 'capitalize' }}>{level}</span>
                                            <span>{(prob * 100).toFixed(1)}%</span>
                                        </div>
                                        <div style={{
                                            height: '8px',
                                            background: 'var(--color-bg-tertiary)',
                                            borderRadius: '4px',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${prob * 100}%`,
                                                background: level === 'high' ? '#ef4444' : level === 'medium' ? '#f59e0b' : '#10b981',
                                                transition: 'width 0.5s'
                                            }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

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
                )}
            </div>
        </div>
    )
}

export default Predictions
