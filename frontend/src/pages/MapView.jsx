import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap } from 'react-leaflet'
import ErrorBoundary from '../components/ErrorBoundary'
import FullscreenControl from '../components/FullscreenControl'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import axios from 'axios'
import { API_URL } from '../config/api'

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
function MapController({ activeView, setZoom }) {
    const map = useMap()

    useEffect(() => {
        if (setZoom) {
            setZoom(map.getZoom())
            map.on('zoomend', () => setZoom(map.getZoom()))
        }
        const t = setTimeout(() => {
            map.invalidateSize()
        }, 100)
        return () => {
            clearTimeout(t)
            if (setZoom) map.off('zoomend')
        }
    }, [map, activeView, setZoom])

    return null
}

const severityIcons = {
    'Minor': createColoredIcon('#10b981'),
    'Moderate': createColoredIcon('#f59e0b'),
    'Severe': createColoredIcon('#f97316'),
    'Fatal': createColoredIcon('#ef4444')
}

const severityColors = {
    'Minor': '#10b981',
    'Moderate': '#f59e0b',
    'Severe': '#f97316',
    'Fatal': '#ef4444'
}

// Heatmap Layer using Leaflet.heat
function HeatmapLayer({ points, loaded }) {
    const map = useMap()

    useEffect(() => {
        if (!map || !loaded || !window.L || !window.L.heatLayer) return

        const heatPoints = points.map(p => [
            p.latitude,
            p.longitude,
            p.intensity || 1
        ])

        const heatLayer = window.L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 15,
            max: 5.0
        }).addTo(map)

        return () => {
            map.removeLayer(heatLayer)
        }
    }, [map, points, loaded])

    return null
}

const DEFAULT_MAP_START_DATE = '2025-03-01'
const DEFAULT_MAP_END_DATE = '2025-03-31'

function MapView({ startDate, endDate }) {
    const [accidents, setAccidents] = useState([])
    const [hotspots, setHotspots] = useState([])
    const [heatmapData, setHeatmapData] = useState([])
    const [heatmapLoaded, setHeatmapLoaded] = useState(false)
    const [loading, setLoading] = useState(true)
    const [activeView, setActiveView] = useState('accidents')
    const [mapCenter] = useState([32.574, 74.075]) // Gujrat, Pakistan
    const [mapZoom, setMapZoom] = useState(13)

    // Load leaflet.heat script dynamically
    useEffect(() => {
        window.L = L;
        if (window.L.heatLayer) {
            setHeatmapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
        script.async = true;
        script.onload = () => {
            setHeatmapLoaded(true);
        };
        document.body.appendChild(script);

        return () => {
            try {
                document.body.removeChild(script);
            } catch (e) {}
        };
    }, []);

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    const fetchData = async () => {
        try {
            const usingDefaultWindow = !startDate && !endDate
            const params = usingDefaultWindow
                ? { start_date: DEFAULT_MAP_START_DATE, end_date: DEFAULT_MAP_END_DATE }
                : {}
            if (!usingDefaultWindow && startDate) params.start_date = startDate
            if (!usingDefaultWindow && endDate) params.end_date = endDate

            const [accidentsRes, hotspotsRes, heatmapRes] = await Promise.all([
                axios.get(`${API_URL}/accidents`, { params: { ...params, limit: 20000 } }),
                axios.get(`${API_URL}/predictions/hotspots`, { params: { ...params, limit: 15 } }),
                axios.get(`${API_URL}/accidents/heatmap/data`, { params })
            ])
            setAccidents(accidentsRes.data)
            setHotspots(hotspotsRes.data)
            setHeatmapData(heatmapRes.data)
            setLoading(false)
            if (usingDefaultWindow) {
                console.info(`Map default window: ${DEFAULT_MAP_START_DATE} to ${DEFAULT_MAP_END_DATE}`)
            }
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

    const isDefaultMapWindow = !startDate && !endDate
    const mapWindowLabel = isDefaultMapWindow
        ? `${DEFAULT_MAP_START_DATE} to ${DEFAULT_MAP_END_DATE}`
        : `${startDate || 'beginning'} to ${endDate || 'latest'}`

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>
                        Interactive Operations Map
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        Showing {isDefaultMapWindow ? 'default last-month window' : 'selected date range'}: {mapWindowLabel}
                    </p>
                    {activeView === 'accidents' && accidents.length > 500 && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                            Performance mode: displaying lightweight vector markers for {accidents.length} locations.
                        </p>
                    )}
                </div>
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
                            color: activeView === 'accidents' ? 'white' : 'var(--color-text-primary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Accident Points ({accidents.length})
                    </button>
                    <button
                        onClick={() => setActiveView('heatmap')}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            background: activeView === 'heatmap' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--color-bg-tertiary)',
                            color: activeView === 'heatmap' ? 'white' : 'var(--color-text-primary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Heatmap Density ({heatmapData.length})
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
                            color: activeView === 'risk' ? 'white' : 'var(--color-text-primary)',
                            transition: 'all 0.2s'
                        }}
                    >
                        Risk Zones ({hotspots.length})
                    </button>
                </div>
            </div>

            {/* Main Map Container */}
            <div className="glass-card" style={{ padding: '0', overflow: 'hidden', height: '700px' }}>
                <ErrorBoundary>
                    <MapContainer
                        center={mapCenter}
                        zoom={13}
                        preferCanvas={true}
                        style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
                    >
                        <MapController activeView={activeView} setZoom={setMapZoom} />
                        <FullscreenControl />
                        {/* OpenStreetMap Tiles */}
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />

                        {/* Accident Points View (Hybrid Marker/CircleMarker Rendering) */}
                        {activeView === 'accidents' && Array.isArray(accidents) && accidents
                            .filter(a => a.latitude != null && a.longitude != null && !isNaN(a.latitude) && !isNaN(a.longitude))
                            .map((accident) => {
                                const position = [accident.latitude, accident.longitude];
                                const popupContent = (
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
                                );

                                if (accidents.length <= 500 && mapZoom >= 15) {
                                    return (
                                        <Marker
                                            key={accident.id}
                                            position={position}
                                            icon={severityIcons[accident.severity] || severityIcons.Minor}
                                        >
                                            <Popup>{popupContent}</Popup>
                                        </Marker>
                                    );
                                } else {
                                    // Scale points: base radius 5 at zoom 13, scales up/down
                                    const dynamicRadius = Math.max(2, Math.min(mapZoom - 8, 12));
                                    return (
                                        <CircleMarker
                                            key={accident.id}
                                            center={position}
                                            radius={dynamicRadius}
                                            pathOptions={{
                                                color: 'rgba(255, 255, 255, 0.7)',
                                                fillColor: severityColors[accident.severity] || severityColors.Minor,
                                                fillOpacity: 0.85,
                                                weight: 1
                                            }}
                                        >
                                            <Popup>{popupContent}</Popup>
                                        </CircleMarker>
                                    );
                                }
                            })}

                        {/* Heatmap Layer View */}
                        {activeView === 'heatmap' && (
                            <HeatmapLayer points={heatmapData} loaded={heatmapLoaded} />
                        )}

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
                                                    Hotspot Zone
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
                    ) : activeView === 'heatmap' ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '40px', height: '10px', background: 'linear-gradient(to right, blue, cyan, lime, yellow, red)', borderRadius: '2px' }}></div>
                                <span>Density Scale (Low ➔ High)</span>
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
