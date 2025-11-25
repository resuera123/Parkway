import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load user from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        setUser(JSON.parse(currentUser));
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSettingsClick = (option) => {
    setShowSettings(false);
    if (option === 'profile') {
      navigate('/profile');
    } else if (option === 'about') {
      navigate('/about');
    } else if (option === 'services') {
      navigate('/services');
    } else if (option === 'contact') {
      navigate('/contact');
    } else if (option === 'logout') {
      handleLogout();
    }
  };

  const allParkingSlots = [
    {
      id: 1,
      name: 'SM City Cebu',
      type: 'Parking Slot',
      description: 'Good for motorcycle',
      distance: '2.3 KM',
      price: '$5/hr',
      image: '🅿️',
      available: 12
    },
    {
      id: 2,
      name: 'SM Mabolo',
      type: 'Parking Slot',
      description: 'Good for motorcycle & vehicle',
      distance: '5 KM',
      price: '$4/hr',
      image: '🅿️',
      available: 8
    },
    {
      id: 3,
      name: 'IT Park',
      type: 'Parking Slot',
      description: 'Good for all vehicles',
      distance: '3.5 KM',
      price: '$6/hr',
      image: '🅿️',
      available: 15
    },
    {
      id: 4,
      name: 'Ayala Center Cebu',
      type: 'Parking Slot',
      description: 'Good for motorcycle & vehicle',
      distance: '4.2 KM',
      price: '$7/hr',
      image: '🅿️',
      available: 20
    },
    {
      id: 5,
      name: 'E-Mall',
      type: 'Parking Slot',
      description: 'Good for all vehicles',
      distance: '1.8 KM',
      price: '$5/hr',
      image: '🅿️',
      available: 10
    }
  ];

  // Filter parking slots based on search query and selected filter
  const filteredSlots = allParkingSlots.filter(slot => {
    const matchesSearch = slot.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = selectedFilter === 'ALL' || 
                         (selectedFilter === 'MOTORCYCLE' && slot.description.toLowerCase().includes('motorcycle')) ||
                         (selectedFilter === 'CARS' && slot.description.toLowerCase().includes('vehicle'));
    
    return matchesSearch && matchesFilter;
  });

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <BsBusFrontFill className="dashboard-logo-icon" />
          <div className="logo">PARKWAY</div>
        </div>
        <div className="navbar-right">
          <div className="notification-icon">🔔</div>
          <div className="user-info">
            <span className="username">Welcome, {user?.firstName || 'User'}</span>
          </div>
          <div className="settings-container-nav">
            <div 
              className="settings-icon-nav"
              onClick={() => setShowSettings(!showSettings)}
            >
              <i className="bx bx-menu"></i>
            </div>
            
            {showSettings && (
              <div className="settings-menu-nav">
                <button 
                  className="settings-option-nav"
                  onClick={() => handleSettingsClick('profile')}
                >
                  <i className="bx bx-user-circle"></i>
                  <span>Profile</span>
                </button>
                <button 
                  className="settings-option-nav"
                  onClick={() => handleSettingsClick('about')}
                >
                  <i className="bx bx-info-circle"></i>
                  <span>About Us</span>
                </button>
                <button 
                  className="settings-option-nav"
                  onClick={() => handleSettingsClick('services')}
                >
                  <i className="bx bx-briefcase"></i>
                  <span>Services</span>
                </button>
                <button 
                  className="settings-option-nav"
                  onClick={() => handleSettingsClick('contact')}
                >
                  <i className="bx bx-phone"></i>
                  <span>Contact</span>
                </button>
                <div className="settings-divider"></div>
                <button 
                  className="settings-option-nav logout-option"
                  onClick={() => handleSettingsClick('logout')}
                >
                  <i className="bx bx-log-out"></i>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="dashboard-container">
        <div className="main-content">
          {/* Left Section */}
          <div className="left-section">
            <div className="parking-header">
              <h2>Popular Parking Slot</h2>
              <p>Available Close by</p>
            </div>

            {/* Filter Buttons */}
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${selectedFilter === 'ALL' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('ALL')}
              >
                ALL
              </button>
              <button 
                className={`filter-btn ${selectedFilter === 'MOTORCYCLE' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('MOTORCYCLE')}
              >
                MOTORCYCLE
              </button>
              <button 
                className={`filter-btn ${selectedFilter === 'CARS' ? 'active' : ''}`}
                onClick={() => setSelectedFilter('CARS')}
              >
                CARS
              </button>
            </div>

            {/* Search Bar */}
            <div className="parking-search">
              <i className="bx bx-map"></i>
              <input 
                type="text" 
                placeholder="Search location..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Parking Slots List */}
            <div className="slots-list">
              {filteredSlots.length > 0 ? (
                filteredSlots.map((slot) => (
                  <div key={slot.id} className="slot-card">
                    <div className="slot-image">{slot.image}</div>
                    <div className="slot-info">
                      <h3>{slot.name}</h3>
                      <p className="slot-type">{slot.type}</p>
                      <p className="slot-description">{slot.description}</p>
                      <div className="slot-details">
                        <div className="slot-distance">
                          <i className="bx bx-map"></i>
                          <span>{slot.distance}</span>
                        </div>
                        <div className="slot-price">
                          <i className="bx bx-money"></i>
                          <span>{slot.price}</span>
                        </div>
                        <div className="slot-available">
                          <i className="bx bx-check-circle"></i>
                          <span>{slot.available} slots</span>
                        </div>
                      </div>
                    </div>
                    <div className="slot-action">
                      <button className="view-details-btn">Book Now</button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-results">
                  <p>No parking slots found matching your search.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Section - Map */}
          <div className="right-section">
            <div className="map-container">
              <div className="map-placeholder">
                <div className="map-marker marker-1">📍</div>
                <div className="map-marker marker-2">📍</div>
                <div className="map-marker marker-3">📍</div>
                <p className="map-text">Map View</p>
              </div>
              <button 
                className="open-maps-btn"
                onClick={() => navigate('/parking-locations')}
              >
                Open Maps
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
