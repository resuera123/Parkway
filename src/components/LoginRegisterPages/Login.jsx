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
        password: ''
    });

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

        const result = login(formData.username, formData.password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
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
        </div>
    );
}
