import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

function Dashboard() {
    const [stats, setStats] = useState(null)
    const [recentAccidents, setRecentAccidents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [statsRes, accidentsRes] = await Promise.all([
                axios.get(`${API_URL}/stats/overview`),
                axios.get(`${API_URL}/accidents?limit=10`)
            ])
            setStats(statsRes.data)
            setRecentAccidents(accidentsRes.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
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

    const severityColors = {
        'Minor': { bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.3)', text: '#10b981' },
        'Moderate': { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)', text: '#f59e0b' },
        'Severe': { bg: 'rgba(249, 115, 22, 0.1)', border: 'rgba(249, 115, 22, 0.3)', text: '#f97316' },
        'Fatal': { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)', text: '#ef4444' }
    }

    return (
        <div className="fade-in">
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
                Dashboard Overview
            </h2>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {stats?.total_accidents || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Total Accidents</div>
                </div>

                <div className="glass-card stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚑</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-warning)' }}>
                        {stats?.total_injuries || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Total Injuries</div>
                </div>

                <div className="glass-card stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                        {stats?.total_fatalities || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Total Fatalities</div>
                </div>

                <div className="glass-card stat-card" style={{ padding: '1.5rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-success)' }}>
                        {stats?.recent_accidents_30d || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Last 30 Days</div>
                </div>
            </div>

            {/* Severity Breakdown */}
            {stats?.severity_breakdown && (
                <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        Severity Distribution
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {Object.entries(stats.severity_breakdown).map(([severity, count]) => {
                            const colors = severityColors[severity] || severityColors.Minor
                            return (
                                <div key={severity} style={{
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    background: colors.bg,
                                    border: `1px solid ${colors.border}`
                                }}>
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.text }}>
                                        {count}
                                    </div>
                                    <div style={{ color: colors.text, fontWeight: '600' }}>{severity}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Key Insights */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    🔍 Key Insights
                </h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {stats?.peak_hour && (
                        <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '0.5rem' }}>
                            <strong>Peak Hour:</strong> {stats.peak_hour}:00 - Most accidents occur
                        </div>
                    )}
                    {stats?.most_dangerous_weather && (
                        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem' }}>
                            <strong>Dangerous Weather:</strong> {stats.most_dangerous_weather}
                        </div>
                    )}
                    {stats?.most_dangerous_road_type && (
                        <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '0.5rem' }}>
                            <strong>High-Risk Roads:</strong> {stats.most_dangerous_road_type}
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Accidents */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Recent Accidents
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Date & Time</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Location</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Weather</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Road Type</th>
                                <th style={{ padding: '1rem', textAlign: 'left' }}>Severity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentAccidents.map(accident => {
                                const colors = severityColors[accident.severity] || severityColors.Minor
                                return (
                                    <tr key={accident.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            {new Date(accident.datetime).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            {accident.latitude.toFixed(4)}, {accident.longitude.toFixed(4)}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{accident.weather}</td>
                                        <td style={{ padding: '1rem' }}>{accident.road_type}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '9999px',
                                                background: colors.bg,
                                                border: `1px solid ${colors.border}`,
                                                color: colors.text,
                                                fontSize: '0.875rem',
                                                fontWeight: '600'
                                            }}>
                                                {accident.severity}
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default Dashboard
