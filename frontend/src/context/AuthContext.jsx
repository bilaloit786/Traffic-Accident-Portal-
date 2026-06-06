import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);

    // Configure axios defaults
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }

    useEffect(() => {
        const fetchUser = async () => {
            if (token) {
                try {
                    const response = await axios.get(`${API_BASE_URL}/users/me`);
                    setUser(response.data);
                } catch (error) {
                    console.error("Failed to fetch user", error);
                    logout();
                }
            }
            setLoading(false);
        };

        fetchUser();
    }, [token]);

    const login = async (username, password) => {
        try {
            const formData = new FormData();
            formData.append('username', username);
            formData.append('password', password);

            const response = await axios.post(`${API_BASE_URL}/token`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' } // FastAPI OAuth2 expects form data
            });

            const { access_token, role } = response.data;
            localStorage.setItem('token', access_token);
            setToken(access_token);
            // User will be fetched by useEffect
            return true;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const register = async (username, email, password) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/register`, {
                username,
                email,
                password,
                role: 'user' // Default role
            });
            const { access_token } = response.data;
            localStorage.setItem('token', access_token);
            setToken(access_token);
            return true;
        } catch (error) {
            console.error("Registration failed", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization'];
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, register, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
