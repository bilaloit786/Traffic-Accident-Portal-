import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = 'http://localhost:8000/api'

function Dashboard({ startDate, endDate }) {
    const [stats, setStats] = useState(null)
    const [recentAccidents, setRecentAccidents] = useState([])
    const [loading, setLoading] = useState(true)

    // Interactive Detail Modal States
    const [selectedSection, setSelectedSection] = useState(null)
    const [modalData, setModalData] = useState([])
    const [modalLoading, setModalLoading] = useState(false)
    const [modalSearch, setModalSearch] = useState('')
    const [modalPage, setModalPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [sortField, setSortField] = useState('datetime')
    const [sortOrder, setSortOrder] = useState('desc')

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    const fetchData = async () => {
        try {
            const params = {}
            if (startDate) params.start_date = startDate
            if (endDate) params.end_date = endDate

            const [statsRes, accidentsRes] = await Promise.all([
                axios.get(`${API_URL}/stats/overview`, { params }),
                axios.get(`${API_URL}/accidents`, { params: { ...params, limit: 10 } })
            ])
            setStats(statsRes.data)
            setRecentAccidents(accidentsRes.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching data:', error)
            setLoading(false)
        }
    }

    // Handles clicking on any card/metric to query the detailed records
    const handleSectionClick = async (type, title, filterValue = null) => {
        setSelectedSection({ type, title, value: filterValue })
        setModalLoading(true)
        setModalPage(1)
        setModalSearch('')
        setSortField('datetime')
        setSortOrder('desc')

        try {
            const params = { limit: 20000 } // Fetch a large selection to allow interactive searching/sorting
            if (startDate) params.start_date = startDate
            if (endDate) params.end_date = endDate

            // Optimize by applying server-side filters if possible
            if (type === 'severity') {
                params.severity = filterValue
            } else if (type === 'weather') {
                params.weather = filterValue
            } else if (type === 'road_type') {
                params.road_type = filterValue
            }

            const res = await axios.get(`${API_URL}/accidents`, { params })
            let data = res.data

            // Apply custom client-side filters for statistics details that API doesn't support directly
            if (type === 'total_injuries') {
                data = data.filter(a => a.injuries > 0)
            } else if (type === 'total_fatalities') {
                data = data.filter(a => a.fatalities > 0)
            } else if (type === 'recent_30d') {
                const refDate = endDate ? new Date(endDate) : new Date()
                const cutoff = new Date(refDate)
                cutoff.setDate(cutoff.getDate() - 30)
                data = data.filter(a => {
                    const itemDate = new Date(a.datetime)
                    return itemDate >= cutoff && itemDate <= refDate
                })
            } else if (type === 'peak_hour') {
                data = data.filter(a => {
                    const hour = new Date(a.datetime).getHours()
                    return hour === filterValue
                })
            }

            setModalData(data)
            setModalLoading(false)
        } catch (err) {
            console.error('Error loading detail data:', err)
            setModalLoading(false)
        }
    }

    // Handles sorting toggle
    const handleSort = (field) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortField(field)
            setSortOrder('desc')
        }
        setModalPage(1)
    }

    const sortIndicator = (field) => {
        if (sortField !== field) return null
        return sortOrder === 'asc' ? ' 🔼' : ' 🔽'
    }

    // Client-side CSV generation & download using Blob
    const exportToCSV = () => {
        const headers = ['ID', 'Date & Time', 'Latitude', 'Longitude', 'Weather', 'Road Type', 'Severity', 'Injuries', 'Fatalities', 'Vehicles Involved', 'Description']
        const rows = filteredData.map(a => [
            a.id,
            new Date(a.datetime).toISOString(),
            a.latitude,
            a.longitude,
            a.weather,
            a.road_type,
            a.severity,
            a.injuries,
            a.fatalities,
            a.vehicles_involved,
            a.description || ''
        ])
        const csvString = [headers.join(','), ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n')
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `${selectedSection.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_details.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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

    // Filter & sort data locally for search bar
    const filteredData = modalData.filter(a => {
        if (!modalSearch) return true
        const search = modalSearch.toLowerCase()
        return (
            String(a.id).includes(search) ||
            a.weather.toLowerCase().includes(search) ||
            a.road_type.toLowerCase().includes(search) ||
            a.severity.toLowerCase().includes(search) ||
            (a.description && a.description.toLowerCase().includes(search)) ||
            a.latitude.toFixed(4).includes(search) ||
            a.longitude.toFixed(4).includes(search)
        )
    }).sort((a, b) => {
        let valA = a[sortField]
        let valB = b[sortField]
        
        if (sortField === 'datetime') {
            valA = new Date(valA).getTime()
            valB = new Date(valB).getTime()
        }
        
        if (valA < valB) return sortOrder === 'asc' ? -1 : 1
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1
        return 0
    })

    // Pagination calculations
    const totalPages = Math.ceil(filteredData.length / pageSize)
    const startIndex = (modalPage - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedData = filteredData.slice(startIndex, endIndex)

    return (
        <div className="fade-in">
            <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
                Dashboard Overview
            </h2>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div 
                    className="glass-card stat-card" 
                    onClick={() => handleSectionClick('total_accidents', 'Total Accidents')}
                    style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📊</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                        {stats?.total_accidents || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Total Accidents</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '1rem', textAlign: 'right' }}>View Details ➔</div>
                </div>

                <div 
                    className="glass-card stat-card" 
                    onClick={() => handleSectionClick('total_injuries', 'Accidents with Injuries')}
                    style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚑</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-warning)' }}>
                        {stats?.total_injuries || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Total Injuries</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-warning)', marginTop: '1rem', textAlign: 'right' }}>View Details ➔</div>
                </div>

                <div 
                    className="glass-card stat-card" 
                    onClick={() => handleSectionClick('total_fatalities', 'Accidents with Fatalities')}
                    style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⚠️</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-danger)' }}>
                        {stats?.total_fatalities || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Total Fatalities</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '1rem', textAlign: 'right' }}>View Details ➔</div>
                </div>

                <div 
                    className="glass-card stat-card" 
                    onClick={() => handleSectionClick('recent_30d', 'Accidents in the Last 30 Days')}
                    style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', color: 'var(--color-success)' }}>
                        {stats?.recent_accidents_30d || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Last 30 Days</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-success)', marginTop: '1rem', textAlign: 'right' }}>View Details ➔</div>
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
                                <div 
                                    key={severity} 
                                    onClick={() => handleSectionClick('severity', `${severity} Severity Accidents`, severity)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        background: colors.bg,
                                        border: `1px solid ${colors.border}`,
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s, box-shadow 0.2s',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-2px)'
                                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.3)'
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)'
                                        e.currentTarget.style.boxShadow = 'none'
                                    }}
                                >
                                    <div style={{ fontSize: '2rem', fontWeight: '700', color: colors.text }}>
                                        {count}
                                    </div>
                                    <div style={{ color: colors.text, fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{severity}</span>
                                        <span style={{ fontSize: '0.75rem' }}>➔</span>
                                    </div>
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
                    {stats?.peak_hour != null && (
                        <div 
                            onClick={() => handleSectionClick('peak_hour', `Accidents Occurred at Hour ${stats.peak_hour}:00`, stats.peak_hour)}
                            style={{ 
                                padding: '1rem', 
                                background: 'rgba(59, 130, 246, 0.1)', 
                                border: '1px solid rgba(59, 130, 246, 0.2)', 
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'
                                e.currentTarget.style.transform = 'translateX(4px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            <span><strong>Peak Hour:</strong> {stats.peak_hour}:00 - Most accidents occur during this time slot.</span>
                            <span style={{ color: 'var(--color-primary)', fontWeight: 'bold' }}>View List ➔</span>
                        </div>
                    )}
                    {stats?.most_dangerous_weather && (
                        <div 
                            onClick={() => handleSectionClick('weather', `Accidents during ${stats.most_dangerous_weather} Weather`, stats.most_dangerous_weather)}
                            style={{ 
                                padding: '1rem', 
                                background: 'rgba(245, 158, 11, 0.1)', 
                                border: '1px solid rgba(245, 158, 11, 0.2)', 
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'
                                e.currentTarget.style.transform = 'translateX(4px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            <span><strong>Dangerous Weather:</strong> {stats.most_dangerous_weather} condition is tied to high accident density.</span>
                            <span style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>View List ➔</span>
                        </div>
                    )}
                    {stats?.most_dangerous_road_type && (
                        <div 
                            onClick={() => handleSectionClick('road_type', `Accidents on ${stats.most_dangerous_road_type} Roads`, stats.most_dangerous_road_type)}
                            style={{ 
                                padding: '1rem', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)', 
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                                e.currentTarget.style.transform = 'translateX(4px)'
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'
                                e.currentTarget.style.transform = 'translateX(0)'
                            }}
                        >
                            <span><strong>High-Risk Roads:</strong> {stats.most_dangerous_road_type} accounts for the highest volume of events.</span>
                            <span style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>View List ➔</span>
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

            {/* Interactive Detail Modal */}
            {selectedSection && (
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
                        maxWidth: '1200px',
                        maxHeight: '90vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        background: 'var(--color-bg-secondary)',
                        border: '1px solid var(--glass-border)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '1.5rem',
                            borderBottom: '1px solid var(--glass-border)',
                            background: 'rgba(30, 41, 59, 0.4)'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                    📋 {selectedSection.title}
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                    Detailed database records matching your dashboard click selection.
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedSection(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-primary)',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    transition: 'opacity 0.2s',
                                }}
                                onMouseEnter={(e) => e.target.style.opacity = 0.7}
                                onMouseLeave={(e) => e.target.style.opacity = 1}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div style={{
                            padding: '1.5rem',
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            flex: 1
                        }}>
                            {modalLoading ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
                                    <div className="spinner"></div>
                                    <span style={{ color: 'var(--color-text-muted)' }}>Retrieving detailed database rows...</span>
                                </div>
                            ) : (
                                <>
                                    {/* Table Controls (Search, Row Count, Export) */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1, maxWidth: '450px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>🔍</span>
                                            <input
                                                type="text"
                                                placeholder="Search by weather, road, severity, coordinates..."
                                                value={modalSearch}
                                                onChange={(e) => {
                                                    setModalSearch(e.target.value)
                                                    setModalPage(1)
                                                }}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    background: 'var(--color-bg-tertiary)',
                                                    border: '1px solid var(--glass-border)',
                                                    color: 'white',
                                                    outline: 'none'
                                                }}
                                            />
                                        </div>

                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <button
                                                onClick={exportToCSV}
                                                className="btn btn-secondary"
                                                style={{
                                                    padding: '0.5rem 1rem',
                                                    fontSize: '0.875rem'
                                                }}
                                            >
                                                📥 Export CSV ({filteredData.length} rows)
                                            </button>
                                            
                                            <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                Filtered: <strong>{filteredData.length}</strong> of <strong>{modalData.length}</strong>
                                            </span>
                                        </div>
                                    </div>

                                    {/* Interactive Table */}
                                    <div style={{ overflowX: 'auto', border: '1px solid var(--glass-border)', borderRadius: '0.5rem' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                            <thead>
                                                <tr style={{ background: 'rgba(30, 41, 59, 0.6)', borderBottom: '1px solid var(--glass-border)' }}>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('id')}>
                                                        ID {sortIndicator('id')}
                                                    </th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('datetime')}>
                                                        Date & Time {sortIndicator('datetime')}
                                                    </th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', cursor: 'pointer' }} onClick={() => handleSort('severity')}>
                                                        Severity {sortIndicator('severity')}
                                                    </th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Location</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('injuries')}>
                                                        Injuries {sortIndicator('injuries')}
                                                    </th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('fatalities')}>
                                                        Fatalities {sortIndicator('fatalities')}
                                                    </th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', cursor: 'pointer' }} onClick={() => handleSort('vehicles_involved')}>
                                                        Vehicles {sortIndicator('vehicles_involved')}
                                                    </th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Weather</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Road Type</th>
                                                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left' }}>Description</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paginatedData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={10} style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                            No records match your filters/search query.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paginatedData.map(a => {
                                                        const colors = severityColors[a.severity] || severityColors.Minor
                                                        return (
                                                            <tr key={a.id} style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}>
                                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 'bold' }}>#{a.id}</td>
                                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                                    {new Date(a.datetime).toLocaleString()}
                                                                </td>
                                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                                    <span style={{
                                                                        padding: '0.25rem 0.6rem',
                                                                        borderRadius: '9999px',
                                                                        background: colors.bg,
                                                                        border: `1px solid ${colors.border}`,
                                                                        color: colors.text,
                                                                        fontSize: '0.75rem',
                                                                        fontWeight: '600'
                                                                    }}>
                                                                        {a.severity}
                                                                    </span>
                                                                </td>
                                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                                                                    {a.latitude.toFixed(4)}°N, {a.longitude.toFixed(4)}°E
                                                                </td>
                                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: a.injuries > 0 ? 'var(--color-warning)' : 'inherit' }}>
                                                                    {a.injuries}
                                                                </td>
                                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: a.fatalities > 0 ? 'var(--color-danger)' : 'inherit', fontWeight: a.fatalities > 0 ? 'bold' : 'normal' }}>
                                                                    {a.fatalities}
                                                                </td>
                                                                <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                                                                    {a.vehicles_involved}
                                                                </td>
                                                                <td style={{ padding: '0.75rem 1rem' }}>{a.weather}</td>
                                                                <td style={{ padding: '0.75rem 1rem' }}>{a.road_type}</td>
                                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.description}>
                                                                    {a.description || 'N/A'}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })
                                                )}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Pagination Controls */}
                                    {filteredData.length > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Rows per page:</span>
                                                <select
                                                    value={pageSize}
                                                    onChange={(e) => {
                                                        setPageSize(Number(e.target.value))
                                                        setModalPage(1)
                                                    }}
                                                    style={{
                                                        padding: '0.25rem 0.5rem',
                                                        borderRadius: '0.25rem',
                                                        background: 'var(--color-bg-tertiary)',
                                                        border: '1px solid var(--glass-border)',
                                                        color: 'white',
                                                        outline: 'none'
                                                    }}
                                                >
                                                    <option value={10}>10</option>
                                                    <option value={25}>25</option>
                                                    <option value={50}>50</option>
                                                    <option value={100}>100</option>
                                                </select>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                                    Showing {startIndex + 1} - {Math.min(endIndex, filteredData.length)} of {filteredData.length}
                                                </span>
                                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                    <button
                                                        onClick={() => setModalPage(p => Math.max(1, p - 1))}
                                                        disabled={modalPage === 1}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.25rem 0.75rem', opacity: modalPage === 1 ? 0.5 : 1, cursor: modalPage === 1 ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        ◀
                                                    </button>
                                                    <button
                                                        onClick={() => setModalPage(p => Math.min(totalPages, p + 1))}
                                                        disabled={modalPage === totalPages}
                                                        className="btn btn-secondary"
                                                        style={{ padding: '0.25rem 0.75rem', opacity: modalPage === totalPages ? 0.5 : 1, cursor: modalPage === totalPages ? 'not-allowed' : 'pointer' }}
                                                    >
                                                        ▶
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Dashboard
