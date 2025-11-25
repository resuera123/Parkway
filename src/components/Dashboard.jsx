import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";
import BookingModal from './BookingModal';

export default function Dashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showBookingHistory, setShowBookingHistory] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load user from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        setUser(userData);
        loadUserBookings(userData.username);
        loadNotifications(userData.username);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }
  }, []);

  const loadUserBookings = (username) => {
    const allBookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const userBookings = allBookings.filter(b => b.userId === username);
    setBookings(userBookings);
  };

  const loadNotifications = (username) => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const userNotifications = allNotifications.filter(n => n.userId === username);
    setNotifications(userNotifications);
    const unread = userNotifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  };

  const markNotificationAsRead = (notificationId) => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const updated = allNotifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    loadNotifications(user.username);
  };

  const markAllAsRead = () => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const updated = allNotifications.map(n => 
      n.userId === user.username ? { ...n, read: true } : n
    );
    localStorage.setItem('notifications', JSON.stringify(updated));
    loadNotifications(user.username);
  };

  const deleteNotification = (notificationId) => {
    const allNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const updated = allNotifications.filter(n => n.id !== notificationId);
    localStorage.setItem('notifications', JSON.stringify(updated));
    loadNotifications(user.username);
  };

  const handleCancelBooking = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const allBookings = JSON.parse(localStorage.getItem('bookings')) || [];
      const updatedBookings = allBookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: 'cancelled' } : booking
      );
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));
      loadUserBookings(user.username);
    }
  };

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

  const handleBookNow = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-left">
          <BsBusFrontFill className="dashboard-logo-icon" />
          <div className="logo">PARKWAY</div>
        </div>
        <div className="navbar-right">
          <button 
            className="booking-history-btn"
            onClick={() => setShowBookingHistory(!showBookingHistory)}
          >
            Booking History
          </button>
          <div 
            className="notification-icon-container"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <div className="notification-icon">🔔</div>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Notifications</h3>
                {notifications.length > 0 && (
                  <button 
                    className="mark-all-read"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="notification-icon-text">
                        {notification.type === 'booking' ? '✓' : 'ℹ'}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.timestamp).toLocaleString()}</small>
                      </div>
                      <button 
                        className="delete-notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    <p>No notifications yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

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
        {!showBookingHistory ? (
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
                        <button 
                          className="view-details-btn"
                          onClick={() => handleBookNow(slot)}
                        >
                          Book Now
                        </button>
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
        ) : (
          <div className="booking-history-container">
            <div className="booking-history-header">
              <button 
                className="back-btn"
                onClick={() => setShowBookingHistory(false)}
              >
                ← Back
              </button>
              <h2>My Booking History</h2>
            </div>

            <div className="bookings-list">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id} className={`booking-card ${booking.status}`}>
                    <div className="booking-header">
                      <h3>{booking.parkingSlot}</h3>
                      <span className={`status-badge ${booking.status}`}>
                        {booking.status === 'confirmed' ? '✓ Confirmed' : '✕ Cancelled'}
                      </span>
                    </div>
                    
                    <div className="booking-details">
                      <div className="detail-item">
                        <i className="bx bx-map"></i>
                        <span>{booking.address}</span>
                      </div>
                      <div className="detail-item">
                        <i className="bx bx-calendar"></i>
                        <span>{new Date(booking.dateReserved).toLocaleDateString()}</span>
                      </div>
                      <div className="detail-item">
                        <i className="bx bx-time"></i>
                        <span>{booking.timeIn} - {booking.timeOut}</span>
                      </div>
                      <div className="detail-item">
                        <i className="bx bx-car"></i>
                        <span>{booking.vehicleType}</span>
                      </div>
                      <div className="detail-item">
                        <i className="bx bx-timer"></i>
                        <span>{booking.duration} hours</span>
                      </div>
                      <div className="detail-item total-price">
                        <i className="bx bx-money"></i>
                        <span>₱{booking.totalPrice}</span>
                      </div>
                    </div>

                    {booking.status === 'confirmed' && (
                      <button 
                        className="cancel-booking-btn"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel Booking
                      </button>
                    )}

                    <div className="booking-footer">
                      <small>Booked on: {new Date(booking.bookingDate).toLocaleString()}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-bookings">
                  <i className="bx bx-calendar-x"></i>
                  <h3>No bookings yet</h3>
                  <p>Start by booking a parking slot!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showBookingModal && selectedSlot && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          parkingSlot={selectedSlot}
        />
      )}
    </>
  );
}
