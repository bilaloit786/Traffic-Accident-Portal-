import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const API_URL = 'http://localhost:8000/api'

function Reports() {
    const [periodType, setPeriodType] = useState('weekly') // weekly, half_monthly, monthly, custom
    const [startDate, setStartDate] = useState('2025-12-01')
    const [endDate, setEndDate] = useState('2025-12-07')
    const [reportData, setReportData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    // Automatically calculate end date when start date or period changes
    useEffect(() => {
        if (periodType === 'weekly') {
            const start = new Date(startDate)
            start.setDate(start.getDate() + 6)
            setEndDate(start.toISOString().split('T')[0])
        } else if (periodType === 'half_monthly') {
            const start = new Date(startDate)
            start.setDate(start.getDate() + 14)
            setEndDate(start.toISOString().split('T')[0])
        } else if (periodType === 'monthly') {
            const start = new Date(startDate)
            start.setDate(start.getDate() + 29)
            setEndDate(start.toISOString().split('T')[0])
        }
    }, [startDate, periodType])

    const handleGenerateReport = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await axios.get(`${API_URL}/reports/generate`, {
                params: {
                    start_date: startDate,
                    end_date: endDate,
                    period_type: periodType
                }
            })
            setReportData(response.data)
            setLoading(false)
        } catch (err) {
            console.error('Error generating report:', err)
            setError(err.response?.data?.detail || 'Failed to generate report. Please verify parameters.')
            setLoading(false)
        }
    }

    // Run report on initial load
    useEffect(() => {
        handleGenerateReport()
    }, [])

    const handlePrint = () => {
        window.print()
    }

    const severityColors = {
        'Minor': '#10b981',
        'Moderate': '#f59e0b',
        'Severe': '#f97316',
        'Fatal': '#ef4444'
    }

    return (
        <div className="fade-in">
            {/* CSS Print Styles */}
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    /* Hide site-wide headers, footers and navigation */
                    header, footer, .no-print, .report-controls {
                        display: none !important;
                    }
                    /* Reset body styling for print */
                    body {
                        background: #ffffff !important;
                        color: #1e293b !important;
                        font-size: 12pt;
                        margin: 0;
                        padding: 0;
                    }
                    /* Main print layout */
                    main {
                        margin: 0 !important;
                        padding: 0 !important;
                        max-width: 100% !important;
                    }
                    /* Make card boundaries printable */
                    .glass-card {
                        background: none !important;
                        border: 1px solid #94a3b8 !important;
                        box-shadow: none !important;
                        color: #1e293b !important;
                        page-break-inside: avoid;
                        margin-bottom: 1.5rem !important;
                        transform: none !important;
                    }
                    /* Headings color fix */
                    h1, h2, h3, h4, .gradient-text {
                        color: #0f172a !important;
                        background: none !important;
                        -webkit-text-fill-color: initial !important;
                        text-shadow: none !important;
                    }
                    .print-header-block {
                        display: flex !important;
                        flex-direction: column;
                        align-items: center;
                        border-bottom: 2px solid #0f172a;
                        padding-bottom: 1rem;
                        margin-bottom: 2rem;
                    }
                    table {
                        border-collapse: collapse !important;
                        width: 100% !important;
                    }
                    th, td {
                        border: 1px solid #cbd5e1 !important;
                        color: #000000 !important;
                    }
                    /* Keep charts clean on print */
                    .recharts-responsive-container {
                        max-height: 250px !important;
                    }
                }
                .print-header-block {
                    display: none;
                }
            ` }} />

            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: '700' }}>
                    📋 Report Generator
                </h2>
                {reportData && (
                    <button onClick={handlePrint} className="btn btn-primary">
                        🖨️ Export / Print PDF
                    </button>
                )}
            </div>

            {/* Controls panel */}
            <div className="glass-card report-controls" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '600', marginBottom: '1.25rem' }}>
                    Configure Report Parameters
                </h3>
                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    
                    {/* Period selection */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>Report Period</label>
                        <select
                            value={periodType}
                            onChange={(e) => setPeriodType(e.target.value)}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.5rem',
                                color: 'var(--color-text-primary)',
                                outline: 'none',
                                cursor: 'pointer',
                                minWidth: '150px'
                            }}
                        >
                            <option value="weekly">Weekly (7 Days)</option>
                            <option value="half_monthly">Half-Monthly (15 Days)</option>
                            <option value="monthly">Monthly (30 Days)</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Start Date */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>
                            {periodType === 'custom' ? 'Start Date' : 'Reference Start Date'}
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            style={{
                                padding: '0.45rem 0.8rem',
                                background: 'var(--color-bg-tertiary)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.5rem',
                                color: 'var(--color-text-primary)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* End Date (Disabled unless Custom) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: '600' }}>End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            disabled={periodType !== 'custom'}
                            style={{
                                padding: '0.45rem 0.8rem',
                                background: periodType === 'custom' ? 'var(--color-bg-tertiary)' : 'rgba(51, 65, 85, 0.4)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '0.5rem',
                                color: periodType === 'custom' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                                outline: 'none',
                                cursor: periodType === 'custom' ? 'text' : 'not-allowed'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleGenerateReport}
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ height: '38px', padding: '0 1.5rem', display: 'flex', alignItems: 'center' }}
                    >
                        {loading ? 'Generating...' : '🔍 Generate Report'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="glass-card" style={{ padding: '1.5rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)', marginBottom: '2rem' }}>
                    <strong>⚠️ Error:</strong> {error}
                </div>
            )}

            {loading && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                    <div className="spinner"></div>
                </div>
            )}

            {/* Generated Report Content */}
            {!loading && reportData && (
                <div className="report-print-area">
                    {/* Document Header for print output */}
                    <div className="print-header-block">
                        <h1 style={{ fontSize: '24pt', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>
                            TRAFFIC ACCIDENT ANALYTICAL REPORT
                        </h1>
                        <p style={{ margin: '0', fontSize: '11pt', color: '#64748b' }}>
                            Safety & Analysis Division | ILM College Gujrat Project
                        </p>
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '10pt', fontWeight: '600' }}>
                            Period: {reportData.start_date} to {reportData.end_date} ({reportData.period_type.replace('_', ' ').toUpperCase()})
                        </p>
                        <p style={{ margin: '0.2rem 0 0 0', fontSize: '9pt', color: '#94a3b8' }}>
                            Report Generated on: {new Date().toLocaleString()}
                        </p>
                    </div>

                    {/* Screen Title Details */}
                    <div className="no-print" style={{ marginBottom: '1.5rem' }}>
                        <span className="badge badge-success" style={{ textTransform: 'capitalize', padding: '0.3rem 0.8rem', fontSize: '0.875rem' }}>
                            Active Period: {reportData.start_date} ➔ {reportData.end_date} ({reportData.period_type.replace('_', ' ')})
                        </span>
                    </div>

                    {/* 1. Executive Narrative */}
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem', borderLeft: '4px solid var(--color-primary)' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            📝 Executive Summary
                        </h3>
                        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-secondary)', fontStyle: 'italic', lineHeight: '1.7' }}>
                            "{reportData.executive_summary}"
                        </p>
                    </div>

                    {/* 2. Key Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                {reportData.summary.total_accidents}
                            </div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Total Accidents</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-warning)' }}>
                                {reportData.summary.total_injuries}
                            </div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Total Injuries</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                                {reportData.summary.total_fatalities}
                            </div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Total Fatalities</div>
                        </div>
                        <div className="glass-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-success)' }}>
                                {reportData.summary.vehicles_involved}
                            </div>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Vehicles Involved</div>
                        </div>
                    </div>

                    {/* 3. Severity Breakdown */}
                    <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1.25rem' }}>
                            📈 Severity Breakdown
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                            {['Minor', 'Moderate', 'Severe', 'Fatal'].map(severity => {
                                const count = reportData.severity_breakdown[severity] || 0
                                const total = reportData.summary.total_accidents
                                const pct = total > 0 ? (count / total) * 100 : 0
                                const color = severityColors[severity]
                                
                                return (
                                    <div key={severity} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', fontSize: '0.95rem' }}>
                                            <span>{severity}</span>
                                            <span>{count} ({pct.toFixed(1)}%)</span>
                                        </div>
                                        <div style={{ height: '8px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
                                            <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '9999px' }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* 4. Trends (Charts side-by-side or stacked) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem', marginBottom: '2rem' }}>
                        
                        {/* Daily Trend */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.25rem' }}>
                                📅 Daily Accident Volume
                            </h3>
                            {reportData.daily_trends.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <BarChart data={reportData.daily_trends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                        <XAxis dataKey="date" stroke="#cbd5e1" tickFormatter={(tick) => tick.slice(5)} />
                                        <YAxis stroke="#cbd5e1" />
                                        <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)' }} />
                                        <Bar dataKey="count" fill="var(--color-primary)" name="Accidents" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                                    Insufficient data points for trend chart.
                                </div>
                            )}
                        </div>

                        {/* Hourly Trend */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1.25rem' }}>
                                ⏰ Hourly Accident Volume
                            </h3>
                            {reportData.hourly_trends.length > 0 ? (
                                <ResponsiveContainer width="100%" height={240}>
                                    <LineChart data={reportData.hourly_trends}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                                        <XAxis dataKey="hour" stroke="#cbd5e1" tickFormatter={(tick) => `${tick}:00`} />
                                        <YAxis stroke="#cbd5e1" />
                                        <Tooltip contentStyle={{ background: 'rgba(30, 41, 59, 0.95)', border: '1px solid rgba(148, 163, 184, 0.2)' }} />
                                        <Line type="monotone" dataKey="count" stroke="var(--color-secondary)" strokeWidth={2} name="Accidents" />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
                                    Insufficient data points for hourly chart.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Weather & Road Type Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                        
                        {/* Weather Distribution */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
                                🌦️ Weather Distribution
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {reportData.weather_breakdown.map((row, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{row.weather}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {row.injuries} injuries, {row.fatalities} fatalities
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                                            {row.count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Road Type Distribution */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
                                🛣️ Road Type Distribution
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {reportData.road_type_breakdown.map((row, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontWeight: '600' }}>{row.road_type}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                                {row.injuries} injuries, {row.fatalities} fatalities
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--color-secondary)' }}>
                                            {row.count}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 6. Hotspots & Recommendations Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                        
                        {/* Hotspots List */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-danger)' }}>
                                🔥 Hotspot Zones (Top 5)
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--glass-border)', textAlign: 'left' }}>
                                            <th style={{ padding: '0.5rem' }}>Location</th>
                                            <th style={{ padding: '0.5rem' }}>Coordinates</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Crashes</th>
                                            <th style={{ padding: '0.5rem', textAlign: 'center' }}>Risk</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.hotspots.map((hotspot, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                                <td style={{ padding: '0.65rem 0.5rem', fontWeight: '500' }}>
                                                    {hotspot.nearest_road_name || 'Unknown Location'}
                                                </td>
                                                <td style={{ padding: '0.65rem 0.5rem', color: 'var(--color-text-muted)' }}>
                                                    {hotspot.latitude.toFixed(3)}°N, {hotspot.longitude.toFixed(3)}°E
                                                </td>
                                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: '600' }}>
                                                    {hotspot.accident_count}
                                                </td>
                                                <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.15rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        background: hotspot.risk_level === 'High' ? 'rgba(239, 68, 68, 0.15)' :
                                                                    hotspot.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                        color: hotspot.risk_level === 'High' ? '#ef4444' :
                                                               hotspot.risk_level === 'Medium' ? '#f59e0b' : '#10b981',
                                                        border: `1px solid ${
                                                            hotspot.risk_level === 'High' ? 'rgba(239, 68, 68, 0.3)' :
                                                            hotspot.risk_level === 'Medium' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'
                                                        }`
                                                    }}>
                                                        {hotspot.risk_level}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {reportData.hotspots.length === 0 && (
                                            <tr>
                                                <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                    No hotspots identified.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="glass-card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--color-accent)' }}>
                                💡 Mitigations & Recommendations
                            </h3>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0', listStyle: 'none' }}>
                                {reportData.recommendations.map((rec, idx) => (
                                    <li key={idx} style={{
                                        display: 'flex',
                                        gap: '0.75rem',
                                        fontSize: '0.925rem',
                                        lineHeight: '1.5',
                                        alignItems: 'flex-start',
                                        borderBottom: idx < reportData.recommendations.length - 1 ? '1px solid rgba(148, 163, 184, 0.05)' : 'none',
                                        paddingBottom: '0.75rem'
                                    }}>
                                        <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Reports
