import React, { useState, useEffect } from 'react';
import '../styles/ParkingLocations.css';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";
import smcityImg from '../images/smcity.jpg';
import smmaboloImg from '../images/smmabolo.jpg';
import itparkImg from '../images/itpark.jpeg';
import ayalaImg from '../images/ayala.jpg';
import emallImg from '../images/emall.jpg';
import BookingModal from './BookingModal';

export default function ParkingLocations() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [locations, setLocations] = useState([]);

  const getLocationImage = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('sm city') || lowerName.includes('smcity')) return smcityImg;
    if (lowerName.includes('sm mabolo') || lowerName.includes('smmabolo') || lowerName.includes('mabolo')) return smmaboloImg;
    if (lowerName.includes('it park') || lowerName.includes('itpark')) return itparkImg;
    if (lowerName.includes('ayala')) return ayalaImg;
    if (lowerName.includes('emall') || lowerName.includes('e-mall')) return emallImg;
    return smmaboloImg; // Default image
  };

  useEffect(() => {
    fetchParkingLots();
  }, []);

  const fetchParkingLots = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/parking-lots');
      const data = await response.json();
      
      if (response.ok && data.length > 0) {
        // Fetch occupied count for each parking lot
        const locationsWithOccupancy = await Promise.all(
          data.map(async (lot) => {
            let occupiedCount = 0;
            const lotId = lot.admin_id; // Use admin_id as parking lot identifier
            
            console.log(`Fetching occupancy for ${lot.parking_lot_name} (admin_id: ${lotId})`);
            
            try {
              const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${lotId}`);
              if (slotsResponse.ok) {
                const slots = await slotsResponse.json();
                if (Array.isArray(slots)) {
                  // Count occupied or reserved slots
                  occupiedCount = slots.filter(s => 
                    (s.status || '').toLowerCase() === 'occupied' || s.reserved === true
                  ).length;
                  console.log(`${lot.parking_lot_name}: ${occupiedCount}/${lot.capacity} occupied`);
                }
              }
            } catch (error) {
              console.error(`Error fetching slots for ${lot.parking_lot_name}:`, error);
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
        
        setLocations(locationsWithOccupancy);
        console.log('Final locations with occupancy:', locationsWithOccupancy);
      } else {
        setLocations([]);
      }
    } catch (error) {
      console.error('Error fetching parking lots:', error);
      setLocations([]);
    }
  };

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
                <img 
                  src={getLocationImage(location.name)} 
                  alt={location.name}
                  className="location-image"
                />
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
                    <span 
                      className={`stat-value ${location.bookedSlots >= location.totalSlots ? 'full-badge' : ''}`}
                    >
                      {location.bookedSlots}/{location.totalSlots}
                    </span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Vacant</span>
                    <span className="stat-value">{location.totalSlots - location.bookedSlots}/{location.totalSlots}</span>
                  </div>
                  <div className="stat stat-price">
                    <span className="stat-label">Rate</span>
                    <span className="stat-value">{location.price || '$0/hr'}</span>
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
