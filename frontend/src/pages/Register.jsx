import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

function Register({ onSwitchToLogin }) {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await register(username, email, password);
            // Registration successful, token is set, redirect handled by App.jsx
        } catch (err) {
            if (err.response && err.response.data) {
                setError(err.response.data.detail);
            } else {
                setError('Registration failed. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)'
        }}>
            <div className="glass-card" style={{ padding: '2.5rem', width: '100%', maxWidth: '400px' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <h1 className="gradient-text" style={{ fontSize: '2rem', fontWeight: 'bold' }}>Create Account</h1>
                    <p style={{ color: 'var(--color-text-muted)' }}>Join the portal today</p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'white',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'white',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--color-text-secondary)' }}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-bg-tertiary)',
                                color: 'white',
                                outline: 'none'
                            }}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                            width: '100%',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: 'white',
                            fontWeight: 'bold',
                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                            opacity: isSubmitting ? 0.7 : 1,
                            marginBottom: '1rem'
                        }}
                    >
                        {isSubmitting ? 'Creating Account...' : 'Register'}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={onSwitchToLogin}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--color-primary)',
                                cursor: 'pointer',
                                textDecoration: 'underline'
                            }}
                        >
                            Already have an account? Sign In
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Register;
