import React, { useState, useEffect } from 'react';
import '../styles/Dashboard.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";
import BookingModal from './BookingModal';
import mapImage from '../images/map.jpg';
import smcityImg from '../images/smcity.jpg';
import smmaboloImg from '../images/smmabolo.jpg';
import itparkImg from '../images/itpark.jpeg';
import ayalaImg from '../images/ayala.jpg';
import emallImg from '../images/emall.jpg';

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
  const [parkingSlots, setParkingSlots] = useState([]);

  // Load user from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        setUser(userData);
        loadUserBookings(userData.id);
        loadNotifications(userData.id);
        loadParkingSlots();
        
        // Test if notification endpoints exist
        console.log('🧪 Testing notification endpoints...');
        testNotificationEndpoints(userData.id);
      } catch (err) {
        console.error('Error loading user:', err);
      }
    }
  }, []);
  
  const testNotificationEndpoints = async (userId) => {
    try {
      // Test user notifications endpoint
      const userNotifTest = await fetch(`http://localhost:8080/api/notifications/user/${userId}`);
      console.log('📡 User notifications endpoint status:', userNotifTest.status, userNotifTest.ok ? '✅ EXISTS' : '❌ NOT FOUND');
      
      // Test admin notifications endpoint (if user is admin)
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (currentUser.role === 'admin') {
        const adminNotifTest = await fetch(`http://localhost:8080/api/notifications/admin/${userId}`);
        console.log('📡 Admin notifications endpoint status:', adminNotifTest.status, adminNotifTest.ok ? '✅ EXISTS' : '❌ NOT FOUND');
      }
    } catch (error) {
      console.error('❌ Error testing notification endpoints:', error);
    }
  };

  const loadUserBookings = async (userId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/bookings/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Check all possible admin confirmed bookings from localStorage
        // Since user might have bookings at different parking lots
        const mergedBookings = data.map(booking => {
          const bookingId = booking.booking_id || booking.id;
          const parkingLotId = booking.parking_lot_id;
          
          // Check if this booking was confirmed by the admin (stored in admin's localStorage)
          const confirmedBookingsKey = `confirmedBookings_${parkingLotId}`;
          const confirmedBookings = JSON.parse(localStorage.getItem(confirmedBookingsKey) || '[]');
          
          if (confirmedBookings.includes(bookingId)) {
            console.log(`Booking ${bookingId} is confirmed (from localStorage)`);
            return { ...booking, status: 'confirmed' };
          }
          
          return booking;
        });
        
        setBookings(mergedBookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    }
  };

  const loadNotifications = async (userId) => {
    try {
      console.log('🔔 Loading user notifications for user_id:', userId);
      console.log('Fetching from:', `http://localhost:8080/api/notifications/user/${userId}`);
      
      const response = await fetch(`http://localhost:8080/api/notifications/user/${userId}`);
      console.log('User notifications response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ User notifications received:', data);
        console.log('Number of notifications:', Array.isArray(data) ? data.length : 'Not an array');
        
        if (Array.isArray(data)) {
          setNotifications(data);
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
          console.log('Unread user notifications:', unread);
        } else {
          console.warn('⚠️ Response is not an array:', typeof data);
          setNotifications([]);
          setUnreadCount(0);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load user notifications:', response.status);
        console.error('Error details:', errorText);
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Exception loading user notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      loadNotifications(user.id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`http://localhost:8080/api/notifications/user/${user.id}/read-all`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      loadNotifications(user.id);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      loadNotifications(user.id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
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

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        alert('Failed to delete booking');
        return;
      }

      alert('Booking deleted successfully!');
      loadUserBookings(user.id);
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
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

  const loadParkingSlots = async () => {
    try {
      console.log('📊 Loading parking lots with occupancy...');
      const response = await fetch('http://localhost:8080/api/admin/parking-lots');
      const data = await response.json();
      console.log('Parking lots data:', data);
      
      if (response.ok && data.length > 0) {
        // Fetch occupied count for each parking lot
        const slotsWithOccupiedCount = await Promise.all(
          data.map(async (lot) => {
            let occupiedCount = 0;
            // Use admin_id as the parking lot ID (that's what the database uses)
            const lotId = lot.admin_id;
            
            console.log(`📊 Checking occupancy for "${lot.parking_lot_name}" (admin_id: ${lotId})`);
            
            try {
              // Fetch actual slots for this parking lot using admin_id
              const slotsUrl = `http://localhost:8080/api/parking-slots/${lotId}`;
              console.log(`Fetching slots from: ${slotsUrl}`);
              
              const slotsResponse = await fetch(slotsUrl);
              console.log(`Slots response status for ${lot.parking_lot_name}:`, slotsResponse.status);
              
              if (slotsResponse.ok) {
                const slots = await slotsResponse.json();
                console.log(`Slots data for ${lot.parking_lot_name}:`, slots);
                console.log(`Total slots returned: ${Array.isArray(slots) ? slots.length : 'Not an array'}`);
                
                if (Array.isArray(slots)) {
                  // Count slots that are occupied or reserved
                  const occupied = slots.filter(s => {
                    const status = (s.status || '').toLowerCase();
                    const reserved = s.reserved === true || s.reserved === 1 || s.reserved === 'true';
                    const isOccupied = status === 'occupied' || reserved;
                    
                    if (isOccupied) {
                      console.log(`  Slot ${s.slot_number}: status="${s.status}", reserved=${s.reserved}`);
                    }
                    
                    return isOccupied;
                  });
                  
                  occupiedCount = occupied.length;
                  console.log(`✅ ${lot.parking_lot_name}: ${occupiedCount}/${lot.capacity} occupied`);
                } else {
                  console.warn(`⚠️ Slots response is not an array for ${lot.parking_lot_name}`);
                }
              } else {
                const errorText = await slotsResponse.text();
                console.error(`❌ Failed to fetch slots for ${lot.parking_lot_name}:`, errorText);
              }
            } catch (slotError) {
              console.error(`❌ Error fetching slots for ${lot.parking_lot_name}:`, slotError);
            }
            
            return {
              id: lotId,
              name: lot.parking_lot_name,
              totalSlots: lot.capacity,
              bookedSlots: occupiedCount,
              price: `$${lot.price}/hr`
            };
          })
        );
        
        setParkingSlots(slotsWithOccupiedCount);
        console.log('📊 Final parking lots with occupancy:', slotsWithOccupiedCount);
      }
    } catch (error) {
      console.error('Error fetching parking lots:', error);
    }
  };

  // Function to get parking lot image based on name (case-insensitive, flexible matching)
  const getParkingImage = (name) => {
    const lowerName = name.toLowerCase().trim();
    
    // SM City variations
    if (lowerName.includes('sm city') || lowerName.includes('smcity')) {
      return smcityImg;
    }
    // SM Mabolo variations
    if (lowerName.includes('sm mabolo') || lowerName.includes('mabolo')) {
      return smmaboloImg;
    }
    // IT Park variations
    if (lowerName.includes('it park') || lowerName.includes('itpark') || lowerName === 'it park') {
      return itparkImg;
    }
    // Ayala variations
    if (lowerName.includes('ayala')) {
      return ayalaImg;
    }
    // E-Mall variations
    if (lowerName.includes('e-mall') || lowerName.includes('emall') || lowerName.includes('e mall')) {
      return emallImg;
    }
    
    // Default image if no match found
    return mapImage;
  };

  // Use parking lots directly from database instead of hardcoded list
  const slotsWithAvailability = parkingSlots.map(slot => {
    return {
      id: slot.id,
      name: slot.name,
      type: 'Parking Slot',
      description: 'Available for booking',
      image: getParkingImage(slot.name),
      available: `${slot.bookedSlots}/${slot.totalSlots}`,
      price: slot.price,
      totalSlots: slot.totalSlots,
      bookedSlots: slot.bookedSlots
    };
  });

  // Filter parking slots based on search query and selected filter
  const filteredSlots = slotsWithAvailability.filter(slot => {
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
                      key={notification.notification_id || notification.id} 
                      className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                      onClick={() => markNotificationAsRead(notification.notification_id || notification.id)}
                    >
                      <div className="notification-icon-text">
                        {notification.type === 'booking' ? '✓' : 'ℹ'}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.created_at || notification.timestamp).toLocaleString()}</small>
                      </div>
                      <button 
                        className="delete-notification"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.notification_id || notification.id);
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
            <span className="username">Welcome, {user?.firstname || 'User'}</span>
            {user?.role && (
              <span className={`role-badge ${user.role}`}>
                {user.role === 'admin' ? 'Admin' : 'User'}
              </span>
            )}
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
                      <div className="slot-image-container">
                        <img 
                          src={slot.image} 
                          alt={slot.name}
                          className="slot-image-photo"
                        />
                      </div>
                      <div className="slot-info">
                        <h3>{slot.name}</h3>
                        <p className="slot-type">{slot.type}</p>
                        <p className="slot-description">{slot.description}</p>
                        <div className="slot-details">
                          <div className="slot-price">
                            <i className="bx bx-money"></i>
                            <span>{slot.price}</span>
                          </div>
                          <div className="slot-available">
                            <i className="bx bx-check-circle"></i>
                            <span>{slot.available}</span>
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
                  <img 
                    src={mapImage} 
                    alt="Parking Locations Map" 
                    className="map-image"
                  />
                  <div className="map-marker marker-1">📍</div>
                  <div className="map-marker marker-2">📍</div>
                  <div className="map-marker marker-3">📍</div>
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

            <div className="bookings-table-container">
              {bookings.length > 0 ? (
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>Parking Lot</th>
                      <th>Date</th>
                      <th>Time In</th>
                      <th>Time Out</th>
                      <th>Vehicle</th>
                      <th>Duration</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.booking_id || booking.id} className={`booking-row-dashboard ${booking.status}`}>
                        <td><strong>{booking.parking_lot_name || 'N/A'}</strong></td>
                        <td>{new Date(booking.date_reserved).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td>{booking.time_in}</td>
                        <td>{booking.time_out}</td>
                        <td>{booking.vehicle_type}</td>
                        <td>{booking.duration} {booking.duration === 1 ? 'hr' : 'hrs'}</td>
                        <td><strong>₱{parseFloat(booking.total_price).toFixed(2)}</strong></td>
                        <td>
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status === 'confirmed'
                              ? '✓ Confirmed'
                              : booking.status === 'cancelled'
                              ? '✕ Cancelled'
                              : '⏳ Pending'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="delete-booking-btn-user"
                            onClick={() => handleDeleteBooking(booking.booking_id || booking.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
