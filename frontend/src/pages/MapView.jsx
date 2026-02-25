import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'
import ErrorBoundary from '../components/ErrorBoundary'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Create colored marker icons for different severities
const createColoredIcon = (color) => {
    return new L.Icon({
        iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 8.5 12.5 28.5 12.5 28.5S25 21 25 12.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
        <circle cx="12.5" cy="12.5" r="6" fill="white"/>
      </svg>
    `)}`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
    })
}

// Map controller to handle map instance and resizing
function MapController({ activeView }) {
    const map = useMap()

    useEffect(() => {
        const t = setTimeout(() => {
            map.invalidateSize()
        }, 100)
        return () => clearTimeout(t)
    }, [map, activeView])

    return null
}

const severityIcons = {
    'Minor': createColoredIcon('#10b981'),
    'Moderate': createColoredIcon('#f59e0b'),
    'Severe': createColoredIcon('#f97316'),
    'Fatal': createColoredIcon('#ef4444')
}

const API_URL = 'http://localhost:8000/api'

function MapView() {
    const [accidents, setAccidents] = useState([])
    const [hotspots, setHotspots] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeView, setActiveView] = useState('accidents')
    const [mapCenter] = useState([32.574, 74.075]) // Gujrat, Pakistan

    useEffect(() => {
        fetchData()
    }, [])

    // Ensure the Leaflet map updates its size when the view becomes visible or active

    const fetchData = async () => {
        try {
            const [accidentsRes, hotspotsRes] = await Promise.all([
                axios.get(`${API_URL}/accidents?limit=200`),
                axios.get(`${API_URL}/predictions/hotspots?limit=15`)
            ])
            setAccidents(accidentsRes.data)
            setHotspots(hotspotsRes.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching map data:', error)
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <div className="spinner"></div>
            </div>
        )
    }

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>
                    🗺️ Interactive Maps
                </h2>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setActiveView('accidents')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            background: activeView === 'accidents' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--color-bg-tertiary)',
                            color: 'white',
                            transition: 'all 0.2s'
                        }}
                    >
                        📍 Accident Points ({accidents.length})
                    </button>
                    <button
                        onClick={() => setActiveView('risk')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            background: activeView === 'risk' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--color-bg-tertiary)',
                            color: 'white',
                            transition: 'all 0.2s'
                        }}
                    >
                        🔥 Risk Zones ({hotspots.length})
                    </button>
                </div>
            </div>

            {/* Main Map Container */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '700px' }}>
                <ErrorBoundary>
                    <MapContainer
                        center={mapCenter}
                        zoom={13}
                        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                    >
                        <MapController activeView={activeView} />
                        {/* OpenStreetMap Tiles */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Accident Points View */}
                        {activeView === 'accidents' && Array.isArray(accidents) && accidents
                            .filter(a => a.latitude != null && a.longitude != null && !isNaN(a.latitude) && !isNaN(a.longitude))
                            .map((accident) => (
                                <Marker
                                    key={accident.id}
                                    position={[accident.latitude, accident.longitude]}
                                    icon={severityIcons[accident.severity] || severityIcons.Minor}
                                >
                                    <Popup>
                                        <div style={{ color: '#000', minWidth: '200px' }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                                                Accident #{accident.id}
                                            </h4>
                                            <div style={{ fontSize: '0.875rem' }}>
                                                <strong>Severity:</strong> <span style={{
                                                    color: accident.severity === 'Fatal' ? '#ef4444' :
                                                        accident.severity === 'Severe' ? '#f97316' :
                                                            accident.severity === 'Moderate' ? '#f59e0b' : '#10b981'
                                                }}>{accident.severity}</span><br />
                                                <strong>Date:</strong> {new Date(accident.datetime).toLocaleDateString()}<br />
                                                <strong>Time:</strong> {new Date(accident.datetime).toLocaleTimeString()}<br />
                                                <strong>Weather:</strong> {accident.weather}<br />
                                                <strong>Road Type:</strong> {accident.road_type}<br />
                                                <strong>Vehicles:</strong> {accident.vehicles_involved || 'N/A'}<br />
                                                <strong>Casualties:</strong> {accident.injuries} injured, {accident.fatalities} fatal
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}

                        {/* Risk Zones View */}
                        {activeView === 'risk' && Array.isArray(hotspots) && hotspots
                            .filter(h => h.latitude != null && h.longitude != null && !isNaN(h.latitude) && !isNaN(h.longitude))
                            .map((hotspot, idx) => {
                                const color = hotspot.severity === 'High' ? '#ef4444' :
                                    hotspot.severity === 'Medium' ? '#f59e0b' : '#10b981'
                                const radius = Math.min(Math.max(hotspot.accident_count * 2, 100), 400)

                                return (
                                    <Circle
                                        key={idx}
                                        center={[hotspot.latitude, hotspot.longitude]}
                                        radius={radius}
                                        pathOptions={{
                                            color: color,
                                            fillColor: color,
                                            fillOpacity: 0.4,
                                            weight: 3
                                        }}
                                    >
                                        <Popup>
                                            <div style={{ color: '#000', minWidth: '180px' }}>
                                                <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                                                    🔥 Hotspot Zone
                                                </h4>
                                                <div style={{ fontSize: '0.875rem' }}>
                                                    <strong>Risk Level:</strong> <span style={{ color: color, fontWeight: 'bold' }}>
                                                        {hotspot.severity}
                                                    </span><br />
                                                    <strong>Total Accidents:</strong> {hotspot.accident_count}<br />
                                                    <strong>Location:</strong> {Number(hotspot.latitude).toFixed(4)}°N, {Number(hotspot.longitude).toFixed(4)}°E
                                                </div>
                                            </div>
                                        </Popup>
                                    </Circle>
                                )
                            })}
                    </MapContainer>
                </ErrorBoundary>
            </div>

            {/* Legend */}
            <div className="glass-card" style={{ padding: '1rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <strong>Legend:</strong>
                    {activeView === 'accidents' ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '16px', height: '16px', background: '#10b981', borderRadius: '50%', border: '2px solid white' }}></div>
                                <span>Minor</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '16px', height: '16px', background: '#f59e0b', borderRadius: '50%', border: '2px solid white' }}></div>
                                <span>Moderate</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '16px', height: '16px', background: '#f97316', borderRadius: '50%', border: '2px solid white' }}></div>
                                <span>Severe</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '16px', height: '16px', background: '#ef4444', borderRadius: '50%', border: '2px solid white' }}></div>
                                <span>Fatal</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '20px', height: '20px', background: '#10b981', borderRadius: '50%', opacity: 0.6 }}></div>
                                <span>Low Risk Zone</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '20px', height: '20px', background: '#f59e0b', borderRadius: '50%', opacity: 0.6 }}></div>
                                <span>Moderate Risk Zone</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '20px', height: '20px', background: '#ef4444', borderRadius: '50%', opacity: 0.6 }}></div>
                                <span>High Risk Zone</span>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📍</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {accidents.length}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Accident Locations</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔥</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                        {hotspots.filter(h => h.severity === 'High').length}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>High Risk Zones</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-warning)' }}>
                        {hotspots.filter(h => h.severity === 'Medium').length}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Medium Risk Zones</div>
                </div>

                <div className="glass-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                    <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-success)' }}>
                        {hotspots.filter(h => h.severity === 'Low').length}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Low Risk Zones</div>
                </div>
            </div>
        </div>
    )
}

export default MapView
