import { useState, useEffect } from 'react'
import axios from 'axios'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { API_URL } from '../config/api'

function Analytics({ startDate, endDate }) {
    const [timeData, setTimeData] = useState(null)
    const [weatherData, setWeatherData] = useState([])
    const [roadData, setRoadData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    const fetchData = async () => {
        try {
            const params = {}
            if (startDate) params.start_date = startDate
            if (endDate) params.end_date = endDate

            const [timeRes, weatherRes, roadRes] = await Promise.all([
                axios.get(`${API_URL}/stats/by-time`, { params }),
                axios.get(`${API_URL}/stats/by-weather`, { params }),
                axios.get(`${API_URL}/stats/by-road-type`, { params })
            ])
            setTimeData(timeRes.data)
            setWeatherData(weatherRes.data)
            setRoadData(roadRes.data)
            setLoading(false)
        } catch (error) {
            console.error('Error fetching analytics:', error)
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

    const COLORS = ['#3B82F6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981', '#60A5FA']

    return (
        <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
                <div className="eyebrow"><span className="live-dot"></span>Predictive trend intelligence</div>
                <h2 style={{ fontSize: '2rem', fontWeight: '800' }}>
                    Analytics & Insights
                </h2>
            </div>

            {/* Hourly Distribution */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Accidents by Hour of Day
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={timeData?.by_hour || []}>
                        <defs>
                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.95} />
                                <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.55} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                        <XAxis dataKey="hour" stroke="#cbd5e1" />
                        <YAxis stroke="#cbd5e1" />
                        <Tooltip
                            contentStyle={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '0.5rem' }}
                            labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Legend />
                        <Bar dataKey="count" fill="url(#barGradient)" radius={[6, 6, 0, 0]} name="Accidents" animationDuration={900} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Weather Distribution */}
            <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Accidents by Weather Condition
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem', alignItems: 'center' }}>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={weatherData}
                                dataKey="total_accidents"
                                nameKey="weather"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label
                            >
                                {weatherData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>

                    <div>
                        {weatherData.map((weather, idx) => (
                            <div key={idx} style={{
                                padding: '1rem',
                                marginBottom: '0.5rem',
                                background: 'rgba(59, 130, 246, 0.1)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between'
                            }}>
                                <div>
                                    <strong>{weather.weather}</strong>
                                    <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                                        {weather.total_injuries} injured, {weather.total_fatalities} fatal
                                    </div>
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: COLORS[idx % COLORS.length] }}>
                                    {weather.total_accidents}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Road Type Distribution */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                    Accidents by Road Type
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={roadData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                        <XAxis type="number" stroke="#cbd5e1" />
                        <YAxis type="category" dataKey="road_type" stroke="#cbd5e1" />
                        <Tooltip
                            contentStyle={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '0.5rem' }}
                        />
                        <Legend />
                        <Bar dataKey="total_accidents" fill="#3B82F6" radius={[0, 6, 6, 0]} name="Total Accidents" animationDuration={900} />
                        <Bar dataKey="total_injuries" fill="#F59E0B" radius={[0, 6, 6, 0]} name="Total Injuries" animationDuration={900} />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Day of Week */}
            {timeData?.by_day_of_week && (
                <div className="glass-card" style={{ padding: '1.5rem', marginTop: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem' }}>
                        Accidents by Day of Week
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={timeData.by_day_of_week}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                            <XAxis dataKey="day" stroke="#cbd5e1" />
                            <YAxis stroke="#cbd5e1" />
                            <Tooltip
                                contentStyle={{ background: 'rgba(30, 41, 59, 0.9)', border: '1px solid rgba(148, 163, 184, 0.2)', borderRadius: '0.5rem' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 7 }} name="Accidents" animationDuration={1000} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    )
}

export default Analytics
