import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { BsBusFrontFill } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        role: 'user' // default to user
    });
    const [pendingUser, setPendingUser] = useState(null);
    const [showRoleSelect, setShowRoleSelect] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        // Admin fixed credentials
        if (formData.username === 'admin@cit.edu' && formData.password === '123456') {
            const adminUser = {
                username: 'admin@cit.edu',
                firstName: 'Admin',
                lastName: '',
                middleInitial: '',
                email: 'admin@cit.edu',
                password: '123456',
                role: 'admin'
            };
            const users = JSON.parse(localStorage.getItem('users')) || [];
            if (!users.find(u => u.username === 'admin@cit.edu')) {
                users.push(adminUser);
                localStorage.setItem('users', JSON.stringify(users));
            } else {
                // ensure role stays admin if user record exists
                const idx = users.findIndex(u => u.username === 'admin@cit.edu');
                users[idx].role = 'admin';
                localStorage.setItem('users', JSON.stringify(users));
            }
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            navigate('/admin');
            return;
        }

        const result = login(formData.username, formData.password);
        if (!result.success) {
            setError(result.message);
            return;
        }

        const loggedUser = result.user;

        // If user already chose a role previously, go straight in
        if (loggedUser.role) {
            navigate(loggedUser.role === 'admin' ? '/admin' : '/dashboard');
            return;
        }

        // First time: show role selection overlay
        setPendingUser(loggedUser);
        setShowRoleSelect(true);
    };

    const chooseRole = (role) => {
        if (!pendingUser) return;
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const idx = users.findIndex(u => u.username === pendingUser.username);
        if (idx !== -1) {
            users[idx] = { ...users[idx], role };
            localStorage.setItem('users', JSON.stringify(users));
        }
        const updatedCurrent = { ...pendingUser, role };
        localStorage.setItem('currentUser', JSON.stringify(updatedCurrent));
        setShowRoleSelect(false);
        setPendingUser(null);
        navigate(role === 'admin' ? '/admin' : '/dashboard');
    };

    return (
        <div>
            <div className="center-wrapper">
                <div className="wrapper">
                    <form onSubmit={handleSubmit}>
                        <div className="logo-login">
                            <BsBusFrontFill className="logo-icon" />
                            <h1>&nbsp;ParkWay</h1>
                        </div>

                        {error && <div className="error-message" style={{ color: '#ff4444', marginBottom: '1rem' }}>{error}</div>}

                        <div className="input-box">
                            <input 
                                type="text" 
                                placeholder="Username" 
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                required 
                            />
                            <i className="bx bx-user"></i>
                        </div>

                        <div className="input-box">
                            <input 
                                type="password" 
                                placeholder="Password" 
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required 
                            />
                            <i className="bx bx-lock"></i>
                        </div>

                        <button type="submit" className="login_btn">
                            Login
                        </button>

                        <div className="register-link">
                            <p>
                                Don't have an account? <Link to="/register">Register</Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
            {showRoleSelect && (
                <div className="role-select-overlay">
                    <div className="role-select-modal">
                        <h2>Select Your Role <span className="one-time-text">(one time)</span></h2>
                        <p className="role-note">This choice will be saved for future logins.</p>
                        <div className="role-select-buttons">
                            <button
                              type="button"
                              className="role-btn"
                              onClick={() => chooseRole('user')}
                            >
                              I am a User
                            </button>
                            <button
                              type="button"
                              className="role-btn"
                              onClick={() => chooseRole('admin')}
                            >
                              I am an Admin
                            </button>
                        </div>
                        <button
                          type="button"
                          className="role-cancel-btn"
                          onClick={() => {
                            setShowRoleSelect(false);
                            setPendingUser(null);
                            localStorage.removeItem('currentUser');
                          }}
                        >
                          Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
