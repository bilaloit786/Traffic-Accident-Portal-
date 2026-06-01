import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import Analytics from './pages/Analytics'
import Predictions from './pages/Predictions'
import Reports from './pages/Reports'
import Admin from './pages/Admin'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'

const icons = {
  dashboard: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  map: 'M9 18 3 21V6l6-3 6 3 6-3v15l-6 3-6-3Zm0 0V3m6 18V6',
  analytics: 'M4 19V5m0 14h16M8 16V9m4 7V7m4 9v-5',
  predictions: 'M12 3l1.7 5.2H19l-4.3 3.1 1.7 5.2L12 13.4l-4.4 3.1 1.7-5.2L5 8.2h5.3L12 3Z',
  reports: 'M6 3h9l3 3v15H6V3Zm8 0v4h4M9 11h6M9 15h6M9 19h3',
  admin: 'M12 3 5 6v5c0 4.6 3 8.4 7 10 4-1.6 7-5.4 7-10V6l-7-3Zm-3 9 2 2 4-5',
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14v16H5V5Z',
  logout: 'M14 8V5a2 2 0 0 0-2-2H5v18h7a2 2 0 0 0 2-2v-3m3-8 4 4-4 4m4-4H9',
  shield: 'M12 3 5 6v5c0 4.6 3 8.4 7 10 4-1.6 7-5.4 7-10V6l-7-3Z',
  pulse: 'M3 12h4l2-6 4 12 2-6h6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6 6 18'
}

const MAP_DEFAULT_START_DATE = '2025-03-01'
const MAP_DEFAULT_END_DATE = '2025-03-31'
const DATA_MIN_DATE = '2020-01-01'
const DATA_MAX_DATE = '2025-03-31'

function Icon({ name, size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={icons[name]} />
    </svg>
  )
}

function MainApp() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [pendingStartDate, setPendingStartDate] = useState('')
  const [pendingEndDate, setPendingEndDate] = useState('')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout } = useAuth()

  const navigation = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['admin', 'traffic_police', 'user'] },
    { id: 'map', label: 'Live Map', icon: 'map', roles: ['admin', 'traffic_police', 'user'] },
    { id: 'analytics', label: 'Analytics', icon: 'analytics', roles: ['admin'] },
    { id: 'predictions', label: 'AI Risk', icon: 'predictions', roles: ['admin', 'traffic_police', 'user'] },
    { id: 'reports', label: 'Reports', icon: 'reports', roles: ['admin', 'traffic_police'] },
    { id: 'admin', label: 'Admin', icon: 'admin', roles: ['admin'] }
  ].filter(item => item.roles.includes(user?.role))

  const hasAccess = (pageId) => {
    if (user?.role === 'admin') return true
    if (user?.role === 'traffic_police' && ['dashboard', 'map', 'predictions', 'reports'].includes(pageId)) return true
    if (user?.role === 'user' && ['dashboard', 'map', 'predictions'].includes(pageId)) return true
    return false
  }

  const clearDateWindow = () => {
    setPendingStartDate('')
    setPendingEndDate('')
    setStartDate('')
    setEndDate('')
  }

  const openDatePicker = (event) => {
    event.currentTarget.showPicker?.()
  }

  const clampDateToDataRange = (value) => {
    if (!value) return ''
    if (value < DATA_MIN_DATE) return DATA_MIN_DATE
    if (value > DATA_MAX_DATE) return DATA_MAX_DATE
    return value
  }

  const applyDateWindow = () => {
    const normalizedStartDate = clampDateToDataRange(pendingStartDate)
    const normalizedEndDate = clampDateToDataRange(pendingEndDate)

    if (normalizedStartDate && normalizedEndDate && normalizedStartDate > normalizedEndDate) {
      setStartDate(normalizedEndDate)
      setEndDate(normalizedStartDate)
      setPendingStartDate(normalizedEndDate)
      setPendingEndDate(normalizedStartDate)
      return
    }

    setStartDate(normalizedStartDate)
    setEndDate(normalizedEndDate)
    setPendingStartDate(normalizedStartDate)
    setPendingEndDate(normalizedEndDate)
  }

  const renderPage = () => {
    if (!hasAccess(currentPage)) {
      return (
        <div className="glass-card access-denied">
          <Icon name="shield" size={42} />
          <h2>Access Denied</h2>
          <p>You do not have permission to view this operational module.</p>
        </div>
      )
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard startDate={startDate} endDate={endDate} />
      case 'map':
        return <MapView startDate={startDate} endDate={endDate} />
      case 'analytics':
        return <Analytics startDate={startDate} endDate={endDate} />
      case 'predictions':
        return <Predictions />
      case 'reports':
        return <Reports />
      case 'admin':
        return <Admin />
      default:
        return <Dashboard startDate={startDate} endDate={endDate} />
    }
  }

  const activePage = navigation.find(item => item.id === currentPage)
  const shellClass = `app-shell ${collapsed ? 'is-collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`
  const hasPendingDates = pendingStartDate || pendingEndDate
  const hasAppliedDates = startDate || endDate
  const hasUnappliedDateChanges = pendingStartDate !== startDate || pendingEndDate !== endDate
  const dateWindowSummary = startDate || endDate
    ? `Showing data from ${startDate || 'beginning'} to ${endDate || 'latest'}`
    : currentPage === 'map'
      ? `Map default: ${MAP_DEFAULT_START_DATE} to ${MAP_DEFAULT_END_DATE}. Select dates to change it.`
      : `Select a date range between ${DATA_MIN_DATE} and ${DATA_MAX_DATE}`
  const dateWindowHelper = hasUnappliedDateChanges
    ? 'Date selection changed. Click Search to update results.'
    : dateWindowSummary

  return (
    <div className="app">
      <div className="animated-bg"></div>
      <div className={shellClass}>
        <aside className="command-sidebar">
          <div className="sidebar-brand">
            <div className="brand-mark">
              <Icon name="pulse" size={22} />
            </div>
            <div className="brand-copy">
              <strong>Traffic Accident Analysis Portal</strong>
            </div>
          </div>

          <button
            className="sidebar-collapse"
            onClick={() => setCollapsed(value => !value)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'menu' : 'close'} size={17} />
          </button>

          <nav className="sidebar-nav" aria-label="Primary">
            {navigation.map(item => (
              <button
                key={item.id}
                className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                onClick={() => {
                  setCurrentPage(item.id)
                  setMobileOpen(false)
                }}
                title={item.label}
              >
                <span className="nav-icon"><Icon name={item.icon} /></span>
                <span className="nav-label">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-status">
            <span className="live-dot"></span>
            <div>
              <strong>Live Ops</strong>
              <span>API telemetry online</span>
            </div>
          </div>
        </aside>

        <div className="mobile-backdrop" onClick={() => setMobileOpen(false)}></div>

        <div className="workspace">
          <header className="topbar">
            <button className="mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open navigation">
              <Icon name="menu" />
            </button>

            <div className="topbar-title">
              <div className="eyebrow">
                <span className="live-dot"></span>
                Emergency Operations Center
              </div>
              <h1>{activePage?.label || 'Dashboard'}</h1>
            </div>

            <div className="topbar-actions">
              <div className="ops-ticker" aria-label="Live status ticker">
                <span>High-risk corridors monitored</span>
                <span>ML inference ready</span>
                <span>Incident feed synchronized</span>
              </div>

              {user && (
                <span className={`role-chip ${user.role === 'admin' ? 'danger' : user.role === 'traffic_police' ? 'warning' : 'success'}`}>
                  {user.role.replace('_', ' ')}
                </span>
              )}

              <button className="logout-button" onClick={logout}>
                <Icon name="logout" size={16} />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <main className="content-shell">
            {!['predictions', 'reports', 'admin'].includes(currentPage) && (
              <section className="filter-bar glass-card fade-in">
                <div className="filter-title">
                  <span className="filter-icon"><Icon name="calendar" /></span>
                  <div>
                    <h3>Operational Date Window</h3>
                    <p>{dateWindowHelper}</p>
                  </div>
                </div>

                <div className="filter-controls">
                  <div className="date-range">
                    <label>
                      <span>From</span>
                      <input
                        type="date"
                        value={pendingStartDate}
                        min={DATA_MIN_DATE}
                        max={pendingEndDate || DATA_MAX_DATE}
                        onClick={openDatePicker}
                        onChange={(e) => setPendingStartDate(e.target.value)}
                      />
                    </label>

                    <label>
                      <span>To</span>
                      <input
                        type="date"
                        value={pendingEndDate}
                        min={pendingStartDate || DATA_MIN_DATE}
                        max={DATA_MAX_DATE}
                        onClick={openDatePicker}
                        onChange={(e) => setPendingEndDate(e.target.value)}
                      />
                    </label>

                    <button
                      className="search-filter btn-primary"
                      onClick={applyDateWindow}
                      disabled={!hasPendingDates && !hasAppliedDates}
                    >
                      Search
                    </button>

                    {(hasPendingDates || hasAppliedDates) && (
                      <button className="clear-filter" onClick={clearDateWindow}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {renderPage()}
          </main>
        </div>
      </div>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()
  const [showRegister, setShowRegister] = useState(false)

  if (loading) {
    return (
      <div className="boot-screen">
        <div className="spinner"></div>
      </div>
    )
  }

  if (!user) {
    return showRegister
      ? <Register onSwitchToLogin={() => setShowRegister(false)} />
      : <Login onSwitchToRegister={() => setShowRegister(true)} />
  }

  return <MainApp />
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
