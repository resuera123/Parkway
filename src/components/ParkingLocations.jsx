import React, { useState } from 'react';
import '../styles/ParkingLocations.css';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";
import BookingModal from './BookingModal';

export default function ParkingLocations() {
  const navigate = useNavigate();
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const parkingLocations = [
    {
      id: 1,
      name: 'SM City Cebu',
      address: 'North Reclamation Area, Cebu City',
      totalSlots: 50,
      availableSlots: 30,
      status: 'available',
      price: '₱100/hr',
      distance: '3.5 KM',
      vehicleTypes: ['Car', 'Motorcycle']
    },
    {
      id: 2,
      name: 'SM Mabolo',
      address: 'Mabolo, Cebu City',
      totalSlots: 50,
      availableSlots: 25,
      status: 'available',
      price: '₱90/hr',
      distance: '2.8 KM',
      vehicleTypes: ['Car', 'Motorcycle']
    },
    {
      id: 3,
      name: 'IT Park',
      address: 'Apas, Lahug, Cebu City',
      totalSlots: 50,
      availableSlots: 40,
      status: 'available',
      price: '₱80/hr',
      distance: '2.3 KM',
      vehicleTypes: ['Car', 'Motorcycle']
    },
    {
      id: 4,
      name: 'Ayala Center Cebu',
      address: 'Cebu Business Park, Cebu City',
      totalSlots: 50,
      availableSlots: 35,
      status: 'available',
      price: '₱120/hr',
      distance: '5 KM',
      vehicleTypes: ['Car', 'Motorcycle']
    },
    {
      id: 5,
      name: 'E-Mall',
      address: 'Mandaue City, Cebu',
      totalSlots: 50,
      availableSlots: 20,
      status: 'available',
      price: '₱70/hr',
      distance: '4.2 KM',
      vehicleTypes: ['Car', 'Motorcycle']
    }
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'available': return '#4caf50';
      case 'limited': return '#ff9800';
      case 'full': return '#f44336';
      default: return '#999';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'available': return 'Available';
      case 'limited': return 'Limited Slots';
      case 'full': return 'Full';
      default: return 'Unknown';
    }
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
          {parkingLocations.map((location) => (
            <div 
              key={location.id} 
              className={`location-card ${location.status}`}
              onClick={() => setSelectedLocation(location)}
            >
              <div className="location-image-container">
                <div className="location-image-placeholder">
                  <span className="location-icon">🅿️</span>
                </div>
                <div 
                  className="status-badge" 
                  style={{ backgroundColor: getStatusColor(location.status) }}
                >
                  {getStatusText(location.status)}
                </div>
              </div>

              <div className="location-content">
                <h3>{location.name}</h3>
                <p className="location-address">
                  <i className="bx bx-map"></i>
                  {location.address}
                </p>

                <div className="location-stats">
                  <div className="stat">
                    <span className="stat-label">Available</span>
                    <span className="stat-value">{location.availableSlots}/{location.totalSlots}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Distance</span>
                    <span className="stat-value">{location.distance}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Price</span>
                    <span className="stat-value">{location.price}</span>
                  </div>
                </div>

                <div className="vehicle-types">
                  {location.vehicleTypes.map((type, index) => (
                    <span key={index} className="vehicle-badge">{type}</span>
                  ))}
                </div>

                <button 
                  className="book-btn"
                  disabled={location.status === 'full'}
                  onClick={() => handleBookNow(location)}
                >
                  {location.status === 'full' ? 'Not Available' : 'Book Now'}
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
