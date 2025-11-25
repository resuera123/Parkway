import React, { useState, useEffect } from 'react';
import '../styles/ParkingLocations.css';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";
import BookingModal from './BookingModal';

export default function ParkingLocations() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('parkingSlots')) || [];
    if (!stored.length) {
      const base = [
        { id: 1, name: 'SM City Cebu', totalSlots: 10, bookedSlots: 0 },
        { id: 2, name: 'SM Mabolo', totalSlots: 10, bookedSlots: 0 },
        { id: 3, name: 'IT Park', totalSlots: 10, bookedSlots: 0 },
        { id: 4, name: 'Ayala Center Cebu', totalSlots: 10, bookedSlots: 0 },
        { id: 5, name: 'E-Mall', totalSlots: 10, bookedSlots: 0 }
      ];
      localStorage.setItem('parkingSlots', JSON.stringify(base));
      setLocations(base);
    } else {
      // migrate any totals not 10
      const migrated = stored.map(p => {
        if (p.totalSlots !== 10) {
          const key = `slotStatuses_${p.id}`;
          let statuses = JSON.parse(localStorage.getItem(key)) || [];
          if (statuses.length !== 10) {
            statuses = Array.from({ length: 10 }, (_, i) => ({
              slotNumber: i + 1,
              reserved: statuses[i] ? !!statuses[i].reserved : false
            }));
            localStorage.setItem(key, JSON.stringify(statuses));
          }
          const booked = statuses.filter(s => s.reserved).length;
          return { ...p, totalSlots: 10, bookedSlots: booked };
        }
        return p;
      });
      localStorage.setItem('parkingSlots', JSON.stringify(migrated));
      setLocations(migrated);
    }
  }, []);

  const getStatusColor = (loc) => {
    if (loc.bookedSlots >= loc.totalSlots) return '#f44336';
    if (loc.bookedSlots >= loc.totalSlots * 0.7) return '#ff9800';
    return '#4caf50';
  };

  const getStatusText = (loc) => {
    if (loc.bookedSlots >= loc.totalSlots) return 'Full';
    if (loc.bookedSlots >= loc.totalSlots * 0.7) return 'Limited';
    return 'Available';
  };

  const handleBookNow = (location) => {
    setSelectedLocation(location);
    setShowBookingModal(true);
  };

  return (
    <>
      <nav className="locations-navbar">
        <div className="navbar-left">
          <BsBusFrontFill className="dashboard-logo-icon" />
          <div className="logo">PARKWAY</div>
        </div>
        <button className="back-to-dashboard" onClick={() => navigate('/dashboard')}>
          ← Back to Dashboard
        </button>
      </nav>

      <div className="locations-container">
        <div className="locations-header">
          <h1>All Parking Locations</h1>
          <p>Find the perfect parking spot near you</p>
        </div>

        <div className="locations-grid">
          {locations.map(location => (
            <div
              key={location.id}
              className={`location-card ${location.bookedSlots >= location.totalSlots ? 'full' : 'available'}`}
              onClick={() => setSelectedLocation(location)}
            >
              <div className="location-image-container">
                <div className="location-image-placeholder">
                  <span className="location-icon">🅿️</span>
                </div>
                <div
                  className="status-badge"
                  style={{ backgroundColor: getStatusColor(location) }}
                >
                  {getStatusText(location)}
                </div>
              </div>
              <div className="location-content">
                <h3>{location.name}</h3>

                <div className="location-stats">
                  <div className="stat">
                    <span className="stat-label">Occupied</span>
                    <span className="stat-value">{location.bookedSlots}/{location.totalSlots}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Vacant</span>
                    <span className="stat-value">{location.totalSlots - location.bookedSlots}/{location.totalSlots}</span>
                  </div>
                </div>

                <button
                  className="book-btn"
                  disabled={location.bookedSlots >= location.totalSlots}
                  onClick={() => handleBookNow(location)}
                >
                  {location.bookedSlots >= location.totalSlots ? 'Not Available' : 'Book Now'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showBookingModal && selectedLocation && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          parkingSlot={selectedLocation}
        />
      )}
    </>
  );
}
