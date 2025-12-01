import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        username: '',
        firstName: '',
        middleInitial: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
            setError('All fields are required');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        const result = await register({
            firstname: formData.firstName,
            lastname: formData.lastName,
            email: formData.email,
            password: formData.password
        });

        if (result.success) {
            navigate('/');
        } else {
            setError(result.message);
        }
    };

    return (
        <div>
            <div className="center-wrapper register-wrapper">
                <div className="wrapper">
                    <form onSubmit={handleSubmit}>
                        <h1>Create an Account!</h1>

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
                                type="text" 
                                placeholder="First Name" 
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required 
                            />
                            <i className="bx bx-id-card"></i>
                        </div>

                        <div className="input-box">
                            <input 
                                type="text" 
                                placeholder="M.I." 
                                maxLength="1" 
                                name="middleInitial"
                                value={formData.middleInitial}
                                onChange={handleChange}
                            />
                            <i className="bx bx-id-card"></i>
                        </div>

                        <div className="input-box">
                            <input 
                                type="text" 
                                placeholder="Last Name" 
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required 
                            />
                            <i className="bx bx-id-card"></i>
                        </div>

                        <div className="input-box">
                            <input 
                                type="email" 
                                placeholder="Email" 
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required 
                            />
                            <i className="bx bx-envelope"></i>
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

                        <div className="input-box">
                            <input 
                                type="password" 
                                placeholder="Confirm Password" 
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required 
                            />
                            <i className="bx bx-lock"></i>
                        </div>

                        <button type="submit" className="login_btn">
                            Register
                        </button>

                        <div className="register-link">
                            <p>
                                Already have an account? <Link to="/">Login</Link>
                            </p>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}