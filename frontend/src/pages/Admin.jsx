import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const roles = [
    { value: 'admin', label: 'Admin' },
    { value: 'traffic_police', label: 'Traffic Police' },
    { value: 'user', label: 'User' }
];

const formatDateTime = (value) => {
    if (!value) return 'Never';
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short'
    }).format(new Date(value));
};

const getBrowserLabel = (agent) => {
    if (!agent) return 'Unknown device';
    if (agent.includes('Chrome')) return 'Chrome';
    if (agent.includes('Firefox')) return 'Firefox';
    if (agent.includes('Safari')) return 'Safari';
    if (agent.includes('Edg')) return 'Edge';
    return agent.slice(0, 48);
};

function Admin() {
    const [users, setUsers] = useState([]);
    const [activity, setActivity] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [savingUserId, setSavingUserId] = useState(null);

    const loadAdminData = async () => {
        setError('');
        try {
            const [usersResponse, activityResponse, summaryResponse] = await Promise.all([
                axios.get('http://localhost:8000/api/admin/users'),
                axios.get('http://localhost:8000/api/admin/login-activity?limit=80'),
                axios.get('http://localhost:8000/api/admin/security-summary')
            ]);
            setUsers(usersResponse.data);
            setActivity(activityResponse.data);
            setSummary(summaryResponse.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Unable to load admin controls.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAdminData();
    }, []);

    const failedLogins = useMemo(
        () => activity.filter(item => !item.success).length,
        [activity]
    );

    const updateRole = async (userId, role) => {
        setSavingUserId(userId);
        setError('');
        try {
            const response = await axios.patch(`http://localhost:8000/api/admin/users/${userId}/role`, { role });
            setUsers(current => current.map(user => (
                user.id === userId ? { ...user, ...response.data } : user
            )));
            await loadAdminData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Unable to update user role.');
        } finally {
            setSavingUserId(null);
        }
    };

    const updateStatus = async (userId, isActive) => {
        setSavingUserId(userId);
        setError('');
        try {
            const response = await axios.patch(`http://localhost:8000/api/admin/users/${userId}/status`, {
                is_active: isActive
            });
            setUsers(current => current.map(user => (
                user.id === userId ? { ...user, ...response.data } : user
            )));
            await loadAdminData();
        } catch (err) {
            setError(err.response?.data?.detail || 'Unable to update user status.');
        } finally {
            setSavingUserId(null);
        }
    };

    if (loading) {
        return (
            <div className="glass-card admin-empty">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="admin-page fade-in">
            <section className="admin-hero glass-card">
                <div>
                    <span className="eyebrow">Access Control</span>
                    <h2>Admin Security Center</h2>
                    <p>Manage user roles, disable accounts, and review login activity by device and location signal.</p>
                </div>
                <button className="btn btn-secondary" onClick={loadAdminData}>Refresh</button>
            </section>

            {error && <div className="admin-alert">{error}</div>}

            <section className="admin-metrics">
                <div className="glass-card admin-metric">
                    <span>Total Users</span>
                    <strong>{summary?.total_users ?? 0}</strong>
                </div>
                <div className="glass-card admin-metric">
                    <span>Active Accounts</span>
                    <strong>{summary?.active_users ?? 0}</strong>
                </div>
                <div className="glass-card admin-metric">
                    <span>Administrators</span>
                    <strong>{summary?.admins ?? 0}</strong>
                </div>
                <div className="glass-card admin-metric">
                    <span>Failed Logins</span>
                    <strong>{failedLogins}</strong>
                </div>
            </section>

            <section className="admin-grid">
                <div className="glass-card admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h3>User Roles</h3>
                            <p>Only admins can promote users or suspend portal access.</p>
                        </div>
                    </div>

                    <div className="admin-table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Last Login</th>
                                    <th>Control</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <strong>{user.username}</strong>
                                            <span>{user.email}</span>
                                        </td>
                                        <td>
                                            <select
                                                value={user.role}
                                                disabled={savingUserId === user.id}
                                                onChange={(event) => updateRole(user.id, event.target.value)}
                                            >
                                                {roles.map(role => (
                                                    <option key={role.value} value={role.value}>{role.label}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td>
                                            <span className={`role-chip ${user.is_active ? 'success' : 'danger'}`}>
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{formatDateTime(user.last_login)}</td>
                                        <td>
                                            <button
                                                className={`btn ${user.is_active ? 'btn-danger' : 'btn-primary'}`}
                                                disabled={savingUserId === user.id}
                                                onClick={() => updateStatus(user.id, !user.is_active)}
                                            >
                                                {user.is_active ? 'Disable' : 'Enable'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-card admin-panel">
                    <div className="admin-panel-header">
                        <div>
                            <h3>Login Activity</h3>
                            <p>Recent successful and failed sign-in attempts.</p>
                        </div>
                    </div>

                    <div className="activity-list">
                        {activity.map(item => (
                            <article key={item.id} className="activity-item">
                                <div className={`activity-dot ${item.success ? 'success' : 'danger'}`}></div>
                                <div>
                                    <div className="activity-title">
                                        <strong>{item.username}</strong>
                                        <span className={`role-chip ${item.success ? 'success' : 'danger'}`}>
                                            {item.success ? 'Allowed' : 'Blocked'}
                                        </span>
                                    </div>
                                    <p>{item.ip_address || 'Unknown IP'} | {getBrowserLabel(item.user_agent)}</p>
                                    <small>{formatDateTime(item.created_at)}{item.failure_reason ? ` | ${item.failure_reason}` : ''}</small>
                                </div>
                            </article>
                        ))}

                        {activity.length === 0 && (
                            <div className="admin-empty">
                                <p>No login activity has been recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="glass-card admin-policy">
                <h3>Security Rules Active</h3>
                <div>
                    <span>New registrations always start as user</span>
                    <span>Admin APIs require bearer token plus admin role</span>
                    <span>Inactive accounts cannot sign in</span>
                    <span>Tokens expire after {summary?.token_expiry_minutes ?? 30} minutes</span>
                </div>
            </section>
        </div>
    );
}

export default Admin;
