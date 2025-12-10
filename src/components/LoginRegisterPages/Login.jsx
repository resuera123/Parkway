import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { BsBusFrontFill } from "react-icons/bs";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { login, createAdminParkingLot } = useAuth();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'user' 
    });
    const [pendingUser, setPendingUser] = useState(null);
    const [tempPassword, setTempPassword] = useState(''); 
    const [showRoleSelect, setShowRoleSelect] = useState(false);
    const [showAdminForm, setShowAdminForm] = useState(false);
    const [showVehicleForm, setShowVehicleForm] = useState(false);
    const [parkingLotData, setParkingLotData] = useState({
        parking_lot_name: '',
        capacity: '',
        price: ''
    });
    const [vehicleData, setVehicleData] = useState({
        plate_number: '',
        model: '',
        vehicle_type: 'Car'
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
        
       
        setTempPassword(formData.password);

        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

       
        if (formData.email === 'admin@cit.edu' && formData.password === '123456') {
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
                
                const idx = users.findIndex(u => u.username === 'admin@cit.edu');
                users[idx].role = 'admin';
                localStorage.setItem('users', JSON.stringify(users));
            }
            localStorage.setItem('currentUser', JSON.stringify(adminUser));
            navigate('/admin');
            return;
        }

        const result = await login(formData.email, formData.password);
        if (!result.success) {
            setError(result.message);
            return;
        }

        const loggedUser = result.user;
        console.log('Logged in user:', loggedUser);

        
        if (loggedUser.role === 'admin') {
        
            try {
                console.log('Checking parking lot for admin:', loggedUser);
                
                
                console.log('Using email-based lookup to avoid backend ID bug');
                let response = await fetch(`http://localhost:8080/api/admins/email/${encodeURIComponent(loggedUser.email)}`);
                console.log('Email-based lookup response status:', response.status);
                
               
                if (response.status === 404) {
                    console.log('Method 2 failed, checking all parking lots');
                    response = await fetch('http://localhost:8080/api/admin/parking-lots');
                    console.log('Method 3 - Get all lots response status:', response.status);
                    
                    if (response.ok) {
                        const allLots = await response.json();
                        console.log('All parking lots from database:', allLots);
                        console.log('Looking for admin with email:', loggedUser.email);
                        
                        const userLot = allLots.find(lot => {
                            const lotEmail = (lot.email || '').toLowerCase().trim();
                            const userEmail = (loggedUser.email || '').toLowerCase().trim();
                            console.log(`Comparing: "${lotEmail}" === "${userEmail}"`);
                            return lotEmail === userEmail;
                        });
                        
                        if (userLot && (userLot.parkingLotName || userLot.parking_lot_name)) {
                            console.log('✓ Found parking lot via Method 3:', userLot);
                            
                           
                            const updatedUser = {
                                ...loggedUser,
                                parkingLotId: userLot.admin_id || userLot.staffID || userLot.staff_id || userLot.id,
                                parkingLotName: userLot.parkingLotName || userLot.parking_lot_name
                            };
                            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                            console.log('Stored parking lot info with user:', updatedUser);
                            
                            navigate('/admin');
                            return;
                        } else {
                            console.log('✗ No parking lot found matching this email');
                        }
                    }
                }
                
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Parking lot check data:', data);
                    
                    if (data && (data.parkingLotName || data.parking_lot_name)) {
                        
                        console.log('Parking lot found, navigating to admin dashboard');
                        
                       
                        const updatedUser = {
                            ...loggedUser,
                            parkingLotId: data.admin_id || data.staffID || data.staff_id || data.id,
                            parkingLotName: data.parkingLotName || data.parking_lot_name
                        };
                        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
                        console.log('Stored parking lot info with user:', updatedUser);
                        
                        navigate('/admin');
                        return;
                    }
                }
                
              
                console.log('No parking lot found after all methods, showing form');
                setPendingUser(loggedUser);
                setShowAdminForm(true);
                
            } catch (error) {
                console.error('Error checking parking lot:', error);
                setPendingUser(loggedUser);
                setShowAdminForm(true);
            }
        } else {
           
            try {
                console.log('Checking vehicle for user ID:', loggedUser.id);
                const response = await fetch(`http://localhost:8080/api/vehicles/user/${loggedUser.id}`);
                console.log('Vehicle check response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('Vehicle check data:', data);
                    
                    if (data && (data.plate_number || data.plateNumber)) {
                       
                        console.log('Vehicle found, navigating to user dashboard');
                        navigate('/dashboard');
                    } else {
                       
                        console.log('No vehicle found, showing form');
                        setPendingUser(loggedUser);
                        setShowVehicleForm(true);
                    }
                } else {
                   
                    console.log('No vehicle found (404), showing form');
                    setPendingUser(loggedUser);
                    setShowVehicleForm(true);
                }
            } catch (error) {
                console.error('Error checking vehicle:', error);
                setPendingUser(loggedUser);
                setShowVehicleForm(true);
            }
        }
    };

    const chooseRole = async (role) => {
        if (!pendingUser) return;
        
        
        try {
            await fetch('http://localhost:8080/api/users/update-role', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    staffID: pendingUser.id,
                    role: role
                }),
            });
        } catch (error) {
            console.error('Error updating user role:', error);
        }
        
        const updatedUser = { ...pendingUser, role };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        setPendingUser(updatedUser);
        setShowRoleSelect(false);
        
        
        if (role === 'admin') {
            try {
                const response = await fetch(`http://localhost:8080/api/admins/${pendingUser.id}`);
                if (response.ok) {
                   
                    setPendingUser(null);
                    navigate('/admin');
                } else {
                   
                    setShowAdminForm(true);
                }
            } catch (error) {
                console.error('Error checking parking lot:', error);
                setShowAdminForm(true);
            }
        } else {
            setPendingUser(null);
            navigate('/dashboard');
        }
    };

    const handleParkingLotChange = (e) => {
        const { name, value } = e.target;
        setParkingLotData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVehicleChange = (e) => {
        const { name, value } = e.target;
        setVehicleData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleVehicleFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!vehicleData.plate_number || !vehicleData.model || !vehicleData.vehicle_type) {
            setError('All vehicle fields are required');
            return;
        }

        console.log('Submitting vehicle data:', {
            user_id: pendingUser.id,
            plate_number: vehicleData.plate_number,
            model: vehicleData.model,
            vehicle_type: vehicleData.vehicle_type
        });

        try {
            const response = await fetch('http://localhost:8080/api/vehicles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: pendingUser.id,
                    plateNumber: vehicleData.plate_number,
                    model: vehicleData.model,
                    vehicleType: vehicleData.vehicle_type
                }),
            });

            const data = await response.json();
            console.log('Vehicle creation response:', data);

            if (!response.ok) {
                setError(data.message || 'Failed to add vehicle');
                return;
            }

            setShowVehicleForm(false);
            setPendingUser(null);
            navigate('/dashboard');
        } catch (error) {
            console.error('Vehicle creation error:', error);
            setError('Network error. Please try again.');
        }
    };

    const handleAdminFormSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!parkingLotData.parking_lot_name || !parkingLotData.capacity || !parkingLotData.price) {
            setError('All parking lot fields are required');
            return;
        }

        console.log('Pending user:', pendingUser);
        console.log('Submitting parking lot data:', {
            user_id: pendingUser.id,
            parking_lot_name: parkingLotData.parking_lot_name,
            capacity: parseInt(parkingLotData.capacity),
            price: parseFloat(parkingLotData.price)
        });

        const result = await createAdminParkingLot({
            user_id: pendingUser.id,
            email: pendingUser.email,
            password: tempPassword || formData.password,
            firstname: pendingUser.firstname,
            lastname: pendingUser.lastname,
            parking_lot_name: parkingLotData.parking_lot_name,
            capacity: parseInt(parkingLotData.capacity),
            price: parseFloat(parkingLotData.price)
        });

        console.log('Result:', result);

        if (result.success) {
          
            setShowAdminForm(false);
            setPendingUser(null);
            navigate('/admin');
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
                                type="email" 
                                placeholder="Email" 
                                name="email"
                                value={formData.email}
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
            {showAdminForm && (
                <div className="role-select-overlay">
                    <div className="role-select-modal">
                        <h2>Admin Parking Lot Information</h2>
                        <p className="role-note">Please provide details about your parking lot.</p>
                        
                        {error && <div className="error-message" style={{ color: '#ff4444', marginBottom: '1rem' }}>{error}</div>}
                        
                        <form onSubmit={handleAdminFormSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                    Parking Lot Name
                                </label>
                                <div className="input-box">
                                    <input 
                                        type="text" 
                                        placeholder="Enter parking lot name" 
                                        name="parking_lot_name"
                                        value={parkingLotData.parking_lot_name}
                                        onChange={handleParkingLotChange}
                                        required 
                                        style={{color: '#000', backgroundColor: '#fff', border: 'solid', borderColor: 'grey', borderWidth: '0.5px'}}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                    Capacity
                                </label>
                                <div className="input-box">
                                    <input 
                                        type="number" 
                                        placeholder="Enter capacity" 
                                        name="capacity"
                                        value={parkingLotData.capacity}
                                        onChange={handleParkingLotChange}
                                        min="1"
                                        required 
                                        style={{color: '#000', backgroundColor: '#fff', border: 'solid', borderColor: 'grey', borderWidth: '0.5px'}}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                    Price per Hour
                                </label>
                                <div className="input-box">
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        placeholder="Enter price per hour" 
                                        name="price"
                                        value={parkingLotData.price}
                                        onChange={handleParkingLotChange}
                                        min="0"
                                        required 
                                        style={{ color: '#000', backgroundColor: '#fff', border: 'solid', borderColor: 'grey', borderWidth: '0.5px'}}
                                    />
                                </div>
                            </div>
                            <div style = {{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <button type="submit" className="role-cancel-btn btn-danger" style={{width: '200px',  fontSize: '14px' }}>
                                    Create Parking Lot
                                </button>
                                <button
                                type="button"
                                className="role-cancel-btn"
                                onClick={() => {
                                    setShowAdminForm(false);
                                    setPendingUser(null);
                                    localStorage.removeItem('currentUser');
                                }}
                                style={{ width: '200px' , fontSize: '14px', }}
                                >
                                Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {showVehicleForm && (
                <div className="role-select-overlay">
                    <div className="role-select-modal">
                        <h2>Vehicle Information</h2>
                        <p className="role-note">Please provide details about your vehicle (one time only).</p>
                        
                        {error && <div className="error-message" style={{ color: '#ff4444', marginBottom: '1rem' }}>{error}</div>}
                        
                        <form onSubmit={handleVehicleFormSubmit}>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                    Plate Number
                                </label>
                                <div className="input-box">
                                    <input 
                                        type="text" 
                                        placeholder="Enter plate number (e.g., ABC 1234)" 
                                        name="plate_number"
                                        value={vehicleData.plate_number}
                                        onChange={handleVehicleChange}
                                        required 
                                        style={{ color: '#000', backgroundColor: '#fff', border: 'solid', borderColor: 'grey', borderWidth: '0.5px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                    Model
                                </label>
                                <div className="input-box">
                                    <input 
                                        type="text" 
                                        placeholder="Enter vehicle model (e.g., Toyota Vios)" 
                                        name="model"
                                        value={vehicleData.model}
                                        onChange={handleVehicleChange}
                                        required 
                                        style={{ color: '#000', backgroundColor: '#fff', border: 'solid', borderColor: 'grey', borderWidth: '0.5px' }}
                                    />
                                </div>
                            </div>
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                                    Vehicle Type
                                </label>
                                <div className="input-box">
                                    <select 
                                        name="vehicle_type"
                                        value={vehicleData.vehicle_type}
                                        onChange={handleVehicleChange}
                                        required 
                                        style={{ color: '#000', backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', width: '100%' }}
                                    >
                                        <option value="Car">Car</option>
                                        <option value="Motorcycle">Motorcycle</option>
                                    </select>
                                </div>
                            </div>
                            <div style = {{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <button type="submit" className="role-cancel-btn btn-danger" style={{width: '200px',  fontSize: '14px' }}>
                                    Add Vehicle
                                </button>
                                <button
                                type="button"
                                className="role-cancel-btn"
                                onClick={() => {
                                    setShowVehicleForm(false);
                                    setPendingUser(null);
                                    localStorage.removeItem('currentUser');
                                }}
                                style={{ width: '200px' , fontSize: '14px', }}
                                >
                                Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
