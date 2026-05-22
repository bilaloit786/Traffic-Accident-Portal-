import { useState } from 'react'
import Dashboard from './pages/Dashboard'
import MapView from './pages/MapView'
import Analytics from './pages/Analytics'
import Predictions from './pages/Predictions'
import Reports from './pages/Reports'
import Login from './pages/Login'
import Register from './pages/Register'
import { AuthProvider, useAuth } from './context/AuthContext'

function MainApp() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const { user, logout } = useAuth()

  // Role-based access control
  const hasAccess = (pageId) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'traffic_police' && ['dashboard', 'map', 'predictions', 'reports'].includes(pageId)) return true;
    if (user?.role === 'user' && ['dashboard', 'map'].includes(pageId)) return true;
    return false;
  };

  const handlePresetClick = (preset) => {
    switch (preset) {
      case '2025':
        setStartDate('2025-01-01');
        setEndDate('2025-12-31');
        break;
      case '2024':
        setStartDate('2024-01-01');
        setEndDate('2024-12-31');
        break;
      case '2023':
        setStartDate('2023-01-01');
        setEndDate('2023-12-31');
        break;
      case 'all':
      default:
        setStartDate('');
        setEndDate('');
        break;
    }
  };

  const renderPage = () => {
    if (!hasAccess(currentPage)) {
      return (
        <div style={{ textAlign: 'center', marginTop: '4rem' }}>
          <h2>🚫 Access Denied</h2>
          <p>You do not have permission to view this page.</p>
        </div>
      );
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
      default:
        return <Dashboard startDate={startDate} endDate={endDate} />
    }
  }

  return (
    <div className="app">
      {/* Animated Background */}
      <div className="animated-bg"></div>

      {/* Navigation Header */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem'
            }}>
              🚗
            </div>
            <div>
              <h1 className="gradient-text" style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Traffic Accident Portal
              </h1>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                  Prediction & Analysis System
                </p>
                {user && (
                  <span
                    className={`badge ${user.role === 'admin' ? 'badge-danger' : user.role === 'traffic_police' ? 'badge-warning' : 'badge-success'}`}
                    style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', textTransform: 'capitalize' }}
                  >
                    {user.role.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <nav style={{ display: 'flex', gap: '1rem' }}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: '📊', roles: ['admin', 'traffic_police', 'user'] },
                { id: 'map', label: 'Map', icon: '🗺️', roles: ['admin', 'traffic_police', 'user'] },
                { id: 'analytics', label: 'Analytics', icon: '📈', roles: ['admin'] },
                { id: 'predictions', label: 'Predictions', icon: '🔮', roles: ['admin', 'traffic_police'] },
                { id: 'reports', label: 'Reports', icon: '📋', roles: ['admin', 'traffic_police'] }
              ]
                .filter(item => item.roles.includes(user?.role))
                .map(item => (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id)}
                    className={currentPage === item.id ? 'btn-primary' : 'btn-secondary'}
                    style={{
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      ...(currentPage === item.id ? {
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)'
                      } : {
                        background: 'var(--color-bg-tertiary)',
                        color: 'var(--color-text-primary)'
                      })
                    }}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
            </nav>

            <button
              onClick={logout}
              style={{
                background: 'none',
                border: '1px solid var(--color-danger)',
                color: 'var(--color-danger)',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => { e.target.style.background = 'var(--color-danger)'; e.target.style.color = 'white'; }}
              onMouseOut={(e) => { e.target.style.background = 'none'; e.target.style.color = 'var(--color-danger)'; }}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main style={{ maxWidth: '1400px', margin: '2rem auto', padding: '0 2rem' }}>
        {!['predictions', 'reports'].includes(currentPage) && (
          <div className="glass-card fade-in" style={{
            padding: '1.25rem 2rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.5rem',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.5rem' }}>📅</span>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--color-text-primary)' }}>
                  Filter Accidents by Date
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
                  {startDate || endDate ? `Showing data from ${startDate || 'beginning'} to ${endDate || 'present'}` : 'Showing all historical records'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              {/* Presets */}
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginRight: '0.25rem' }}>Presets:</span>
                {[
                  { id: 'all', label: 'All Time' },
                  { id: '2025', label: '2025' },
                  { id: '2024', label: '2024' },
                  { id: '2023', label: '2023' }
                ].map(preset => {
                  const isSelected = (preset.id === 'all' && !startDate && !endDate) ||
                                     (preset.id === '2025' && startDate === '2025-01-01' && endDate === '2025-12-31') ||
                                     (preset.id === '2024' && startDate === '2024-01-01' && endDate === '2024-12-31') ||
                                     (preset.id === '2023' && startDate === '2023-01-01' && endDate === '2023-12-31');
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handlePresetClick(preset.id)}
                      style={{
                        padding: '0.4rem 0.8rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        background: isSelected ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'var(--color-bg-tertiary)',
                        color: isSelected ? 'white' : 'var(--color-text-secondary)',
                        transition: 'all 0.2s',
                      }}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Custom Range */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>From</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      padding: '0.4rem 0.6rem',
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '0.375rem',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>To</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      padding: '0.4rem 0.6rem',
                      background: 'var(--color-bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '0.375rem',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.85rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {(startDate || endDate) && (
                  <button
                    onClick={() => handlePresetClick('all')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--color-danger)',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600',
                      padding: '0.4rem'
                    }}
                  >
                    Clear ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        {renderPage()}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '2rem',
        marginTop: '4rem',
        borderTop: '1px solid rgba(148, 163, 184, 0.1)',
        color: 'var(--color-text-muted)'
      }}>
        <p>Traffic Accident Prediction & Analysis Portal</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          ILM College Gujrat - Final Year Project 2025
        </p>
      </footer>
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--color-bg-primary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return showRegister ?
      <Register onSwitchToLogin={() => setShowRegister(false)} /> :
      <Login onSwitchToRegister={() => setShowRegister(true)} />;
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
