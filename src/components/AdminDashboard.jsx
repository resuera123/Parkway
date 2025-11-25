import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [activeSection, setActiveSection] = useState('overview'); // overview | bookings | spaces | reports
  const [bookings, setBookings] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [locationSlots, setLocationSlots] = useState([]); // per-slot status for selected location
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    const cu = localStorage.getItem('currentUser');
    if (cu) setAdminUser(JSON.parse(cu));
    initParkingSlots();
    loadAdminNotifications();
    loadBookings();
  }, []);

  const initParkingSlots = () => {
    let stored = JSON.parse(localStorage.getItem('parkingSlots'));
    if (!stored || !Array.isArray(stored) || stored.length === 0) {
      stored = [
        { id: 1, name: 'SM City Cebu', totalSlots: 10, bookedSlots: 0, status: 'available' },
        { id: 2, name: 'SM Mabolo', totalSlots: 10, bookedSlots: 0, status: 'available' },
        { id: 3, name: 'IT Park', totalSlots: 10, bookedSlots: 0, status: 'available' },
        { id: 4, name: 'Ayala Center Cebu', totalSlots: 10, bookedSlots: 0, status: 'available' },
        { id: 5, name: 'E-Mall', totalSlots: 10, bookedSlots: 0, status: 'available' }
      ];
    }
    // migrate every record to 10 slots & recompute bookedSlots
    stored = stored.map(p => {
      const key = `slotStatuses_${p.id}`;
      let statuses = JSON.parse(localStorage.getItem(key));
      if (!statuses || statuses.length !== 10) {
        const old = statuses || [];
        statuses = Array.from({ length: 10 }, (_, i) => ({
          slotNumber: i + 1,
            reserved: old[i] ? !!old[i].reserved : false
        }));
        localStorage.setItem(key, JSON.stringify(statuses));
      }
      const bookedCount = statuses.filter(s => s.reserved).length;
      return { ...p, totalSlots: 10, bookedSlots: bookedCount };
    });
    localStorage.setItem('parkingSlots', JSON.stringify(stored));
    setParkingSlots(stored);
    if (!selectedLocationId && stored.length) {
      setSelectedLocationId(stored[0].id);
      loadLocationSlotStatuses(stored[0].id, 10);
    }
  };

  const loadAdminNotifications = () => {
    const notifications = JSON.parse(localStorage.getItem('adminNotifications')) || [];
    setAdminNotifications(notifications);
    setUnreadCount(notifications.filter(n => !n.read).length);
  };

  const loadBookings = () => {
    const allBookings = JSON.parse(localStorage.getItem('bookings')) || [];
    setBookings(allBookings);
  };

  const loadLocationSlotStatuses = (locationId) => {
    const key = `slotStatuses_${locationId}`;
    let statuses = JSON.parse(localStorage.getItem(key));
    if (!statuses || statuses.length !== 10) {
      const old = statuses || [];
      statuses = Array.from({ length: 10 }, (_, i) => ({
        slotNumber: i + 1,
        reserved: old[i] ? !!old[i].reserved : false
      }));
      localStorage.setItem(key, JSON.stringify(statuses));
    }
    setLocationSlots(statuses);
  };

  const handleSelectLocation = (id) => {
    setSelectedLocationId(id);
    loadLocationSlotStatuses(id);
    setUnsavedChanges(false);
  };

  const toggleSlot = (slotNumber) => {
    let statuses = [...locationSlots];
    const idx = statuses.findIndex(s => s.slotNumber === slotNumber);
    if (idx !== -1) {
      statuses[idx].reserved = !statuses[idx].reserved;
      setLocationSlots(statuses);
      setUnsavedChanges(true); // mark pending changes
    }
  };

  const commitLocationChanges = () => {
    if (!selectedLocationId) return;
    const key = `slotStatuses_${selectedLocationId}`;
    localStorage.setItem(key, JSON.stringify(locationSlots));
    const bookedCount = locationSlots.filter(s => s.reserved).length;
    const updatedParking = parkingSlots.map(p =>
      p.id === selectedLocationId ? { ...p, bookedSlots: bookedCount } : p
    );
    localStorage.setItem('parkingSlots', JSON.stringify(updatedParking));
    setParkingSlots(updatedParking);
    setUnsavedChanges(false);
  };

  const handleApproveBooking = (notificationId, bookingId) => {
    const bookingsAll = JSON.parse(localStorage.getItem('bookings')) || [];
    const booking = bookingsAll.find(b => b.id === bookingId);
    if (booking) {
      // simplistic: mark first free slot as reserved
      const loc = parkingSlots.find(p => p.name === booking.parkingSlot);
      if (loc) {
        const key = `slotStatuses_${loc.id}`;
        let statuses = JSON.parse(localStorage.getItem(key)) || [];
        const freeIndex = statuses.findIndex(s => !s.reserved);
        if (freeIndex !== -1) {
          statuses[freeIndex].reserved = true;
          localStorage.setItem(key, JSON.stringify(statuses));
          const bookedCount = statuses.filter(s => s.reserved).length;
          const updatedParking = parkingSlots.map(p =>
            p.id === loc.id ? { ...p, bookedSlots: bookedCount } : p
          );
          localStorage.setItem('parkingSlots', JSON.stringify(updatedParking));
          setParkingSlots(updatedParking);
          if (loc.id === selectedLocationId) setLocationSlots(statuses);
        }
      }
      const adminNotifs = JSON.parse(localStorage.getItem('adminNotifications')) || [];
      const updated = adminNotifs.map(n =>
        n.id === notificationId ? { ...n, read: true, status: 'approved' } : n
      );
      localStorage.setItem('adminNotifications', JSON.stringify(updated));
      loadAdminNotifications();
      loadBookings();
    }
  };

  const markNotificationAsRead = (id) => {
    const adminNotifs = JSON.parse(localStorage.getItem('adminNotifications')) || [];
    localStorage.setItem('adminNotifications', JSON.stringify(
      adminNotifs.map(n => n.id === id ? { ...n, read: true } : n)
    ));
    loadAdminNotifications();
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleConfirmBooking = (bookingId) => {
    const allBookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const bookingIndex = allBookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) return;
    
    const booking = allBookings[bookingIndex];
    
    // Update booking status to confirmed
    allBookings[bookingIndex] = { ...booking, status: 'confirmed' };
    localStorage.setItem('bookings', JSON.stringify(allBookings));
    
    // Create user notification
    const userNotifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const confirmNotification = {
      id: Date.now(),
      userId: booking.userId,
      type: 'booking',
      title: 'Booking Confirmed!',
      message: `Your booking at ${booking.parkingSlot} for ${booking.dateReserved} has been confirmed by admin. Time: ${booking.timeIn} - ${booking.timeOut}`,
      timestamp: new Date().toISOString(),
      read: false
    };
    userNotifications.push(confirmNotification);
    localStorage.setItem('notifications', JSON.stringify(userNotifications));
    
    // Reserve a parking slot
    const loc = parkingSlots.find(p => p.name === booking.parkingSlot);
    if (loc) {
      const key = `slotStatuses_${loc.id}`;
      let statuses = JSON.parse(localStorage.getItem(key)) || [];
      const freeIndex = statuses.findIndex(s => !s.reserved);
      if (freeIndex !== -1) {
        statuses[freeIndex].reserved = true;
        localStorage.setItem(key, JSON.stringify(statuses));
        const bookedCount = statuses.filter(s => s.reserved).length;
        const updatedParking = parkingSlots.map(p =>
          p.id === loc.id ? { ...p, bookedSlots: bookedCount } : p
        );
        localStorage.setItem('parkingSlots', JSON.stringify(updatedParking));
        setParkingSlots(updatedParking);
        if (loc.id === selectedLocationId) setLocationSlots(statuses);
      }
    }
    
    loadBookings();
    alert('Booking confirmed and user notified!');
  };

  // Monthly report calculations
  const currentMonthKey = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyReport = parkingSlots.map(loc => {
    const locBookings = bookings.filter(b =>
      b.parkingSlot === loc.name &&
      b.bookingDate.slice(0, 7) === currentMonthKey &&
      b.status === 'confirmed'
    );
    const totalRevenue = locBookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
    const avgDuration = locBookings.length
      ? (locBookings.reduce((s, b) => s + Number(b.duration || 0), 0) / locBookings.length).toFixed(1)
      : 0;
    return {
      id: loc.id,
      name: loc.name,
      count: locBookings.length,
      revenue: totalRevenue.toFixed(2),
      avgDuration
    };
  });

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <BsBusFrontFill className="admin-logo-icon" />
          <span>PARKWAY ADMIN</span>
        </div>
        <nav className="admin-nav">
          <button
            className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >Dashboard</button>
          <button
            className={`admin-nav-item ${activeSection === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveSection('bookings')}
          >Booking</button>
          <button
            className={`admin-nav-item ${activeSection === 'spaces' ? 'active' : ''}`}
            onClick={() => setActiveSection('spaces')}
          >Parking spaces</button>
          <button
            className={`admin-nav-item ${activeSection === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveSection('reports')}
          >Reports</button>
          <button
            className="admin-nav-item danger"
            onClick={handleLogout}
          >Logout</button>
        </nav>
        <div className="admin-user-mini">
          <span>{adminUser?.firstName || 'Admin'}</span>
          <span className="role-tag">Admin</span>
        </div>
      </aside>

      {/* Top bar */}
      <header className="admin-topbar">
        <div className="topbar-right">
          <div
            className="notification-icon-container"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <div className="notification-icon">🔔</div>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h3>Booking Requests</h3>
              </div>
              <div className="notifications-list">
                {adminNotifications.length ? adminNotifications.map(n => (
                  <div
                    key={n.id}
                    className={`notification-item ${n.read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <h4>{n.title}</h4>
                      <p>{n.message}</p>
                      <small>{new Date(n.timestamp).toLocaleString()}</small>
                    </div>
                    {!n.status && (
                      <button
                        className="approve-btn"
                        onClick={() => handleApproveBooking(n.id, n.bookingId)}
                      >Approve</button>
                    )}
                    {n.status === 'approved' && (
                      <span className="approved-badge">✓ Approved</span>
                    )}
                    {!n.read && (
                      <button
                        className="mark-read-btn"
                        onClick={() => markNotificationAsRead(n.id)}
                      >Mark Read</button>
                    )}
                  </div>
                )) : <div className="no-notifications"><p>No booking requests</p></div>}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="admin-main">
        {activeSection === 'overview' && (
          <div className="section-block overview-left">
            <h2 className="section-title">Parking Lot Overview</h2>
            <div className="slots-grid-overview">
              {parkingSlots.map(slot => (
                <div
                  key={slot.id}
                  className="overview-card clickable-overview"
                  onClick={() => {
                    setSelectedLocationId(slot.id);
                    loadLocationSlotStatuses(slot.id);
                    setActiveSection('spaces');
                  }}
                >
                  <div className="overview-top">
                    <h3>{slot.name}</h3>
                    <span className={`status-indicator ${slot.bookedSlots >= slot.totalSlots ? 'full' : 'available'}`}>
                      {slot.bookedSlots >= slot.totalSlots ? 'Full' : 'Available'}
                    </span>
                  </div>
                  <div className="overview-stats">
                    <div><span>Total:</span> {slot.totalSlots}</div>
                    <div><span>Booked:</span> {slot.bookedSlots}</div>
                    <div><span>Vacant:</span> {slot.totalSlots - slot.bookedSlots}</div>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(slot.bookedSlots / slot.totalSlots) * 100}%` }}
                    />
                  </div>
                  <p className="occupancy-text">{slot.bookedSlots}/{slot.totalSlots} slots occupied</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'bookings' && (
          <div className="section-block">
            <h2 className="section-title">All Bookings</h2>
            <div className="booking-list-admin">
              {bookings.length ? bookings.map(b => (
                <div key={b.id} className="booking-row">
                  <div className="b-col main">
                    <strong>{b.parkingSlot}</strong>
                    <small>{b.userId}</small>
                    <small>{new Date(b.bookingDate).toLocaleString()}</small>
                  </div>
                  <div className="b-col">{b.dateReserved}</div>
                  <div className="b-col">{b.timeIn} - {b.timeOut}</div>
                  <div className="b-col">{b.vehicleType}</div>
                  <div className="b-col">{b.duration}h</div>
                  <div className="b-col">₱{b.totalPrice}</div>
                  <div className="b-col status">
                    <span className={`mini-status ${b.status}`}>{b.status}</span>
                  </div>
                  <div className="b-col actions">
                    {b.status === 'pending' && (
                      <button 
                        className="confirm-booking-btn"
                        onClick={() => handleConfirmBooking(b.id)}
                      >
                        Confirm
                      </button>
                    )}
                    {b.status === 'confirmed' && (
                      <span className="confirmed-text">✓ Confirmed</span>
                    )}
                  </div>
                </div>
              )) : <div className="empty-text">No bookings recorded.</div>}
            </div>
          </div>
        )}

        {activeSection === 'spaces' && (
          <div className="section-block">
            <h2 className="section-title">Parking Spaces</h2>
            <div className="location-selector">
              {parkingSlots.map(loc => (
                <button
                  key={loc.id}
                  className={`loc-btn ${selectedLocationId === loc.id ? 'active' : ''}`}
                  onClick={() => handleSelectLocation(loc.id)}
                >
                  {loc.name}
                  <span className="loc-count">{loc.bookedSlots}/{loc.totalSlots}</span>
                </button>
              ))}
            </div>

            <div className="pending-info">
              <span>
                Current (saved): {
                  parkingSlots.find(p => p.id === selectedLocationId)?.bookedSlots || 0
                } / {
                  parkingSlots.find(p => p.id === selectedLocationId)?.totalSlots || 10
                }
              </span>
              <span>
                Pending (unsaved): {
                  locationSlots.filter(s => s.reserved).length
                } / 10
              </span>
              {locationSlots.filter(s => s.reserved).length === 10 && (
                <span className="full-indicator">Will be FULL after update</span>
              )}
            </div>

            <div className="slot-grid">
              {locationSlots.map(slot => (
                <div
                  key={slot.slotNumber}
                  className={`slot-cell ${slot.reserved ? 'reserved' : 'vacant'}`}
                  onClick={() => toggleSlot(slot.slotNumber)}
                  title={`Click to ${slot.reserved ? 'free' : 'reserve'} P${slot.slotNumber}`}
                >
                  P{slot.slotNumber}
                </div>
              ))}
            </div>

            <div className="spaces-actions">
              <button
                className="update-spaces-btn"
                disabled={!unsavedChanges}
                onClick={commitLocationChanges}
              >
                {unsavedChanges ? 'Update (Save Changes)' : 'Up to Date'}
              </button>
            </div>

            <div className="legend">
              <span className="legend-item"><span className="legend-box vacant-box" /> Vacant</span>
              <span className="legend-item"><span className="legend-box reserved-box" /> Reserved</span>
            </div>
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="section-block">
            <h2 className="section-title">Monthly Report ({currentMonthKey})</h2>
            <div className="report-grid">
              {monthlyReport.map(r => (
                <div key={r.id} className="report-card">
                  <h3>{r.name}</h3>
                  <div className="report-line"><span>Bookings:</span> {r.count}</div>
                  <div className="report-line"><span>Total Revenue:</span> ₱{r.revenue}</div>
                  <div className="report-line"><span>Avg Duration:</span> {r.avgDuration} hrs</div>
                  <div className="report-line"><span>Occupancy:</span> {parkingSlots.find(p => p.id === r.id)?.bookedSlots}/{parkingSlots.find(p => p.id === r.id)?.totalSlots}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
