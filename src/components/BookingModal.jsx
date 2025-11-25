import React, { useState } from 'react';
import '../styles/BookingModal.css';

export default function BookingModal({ isOpen, onClose, parkingSlot }) {
  const [bookingData, setBookingData] = useState({
    dateReserved: '',
    timeIn: '',
    timeOut: '',
    vehicleType: 'Car'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateDuration = () => {
    if (bookingData.timeIn && bookingData.timeOut) {
      const timeIn = new Date(`2000-01-01 ${bookingData.timeIn}`);
      const timeOut = new Date(`2000-01-01 ${bookingData.timeOut}`);
      const diff = (timeOut - timeIn) / (1000 * 60 * 60); // hours
      return diff > 0 ? diff.toFixed(1) : 0;
    }
    return 0;
  };

  const calculateTotalPrice = () => {
    const duration = calculateDuration();
    const pricePerHour = parseInt(parkingSlot.price.replace(/[^0-9]/g, ''));
    return (duration * pricePerHour).toFixed(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!bookingData.dateReserved || !bookingData.timeIn || !bookingData.timeOut) {
      setError('All fields are required');
      return;
    }

    const timeIn = new Date(`2000-01-01 ${bookingData.timeIn}`);
    const timeOut = new Date(`2000-01-01 ${bookingData.timeOut}`);

    if (timeOut <= timeIn) {
      setError('Time Out must be after Time In');
      return;
    }

    // Save booking to localStorage
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];
    
    const newBooking = {
      id: Date.now(),
      userId: currentUser.username,
      parkingSlot: parkingSlot.name,
      address: parkingSlot.address || '',
      dateReserved: bookingData.dateReserved,
      timeIn: bookingData.timeIn,
      timeOut: bookingData.timeOut,
      vehicleType: bookingData.vehicleType,
      duration: calculateDuration(),
      totalPrice: calculateTotalPrice(),
      status: 'confirmed',
      bookingDate: new Date().toISOString()
    };

    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    // Create notification
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    const newNotification = {
      id: Date.now() + 1,
      userId: currentUser.username,
      type: 'booking',
      title: 'Booking Confirmed!',
      message: `Your parking slot at ${parkingSlot.name} has been successfully booked for ${bookingData.dateReserved}.`,
      timestamp: new Date().toISOString(),
      read: false
    };
    notifications.push(newNotification);
    localStorage.setItem('notifications', JSON.stringify(notifications));

    setSuccess('Booking confirmed successfully!');
    
    setTimeout(() => {
      onClose();
      setBookingData({
        dateReserved: '',
        timeIn: '',
        timeOut: '',
        vehicleType: 'Car'
      });
      setSuccess('');
      // Reload page to update notifications
      window.location.reload();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <h2>Book Parking Slot</h2>
          <p className="modal-subtitle">{parkingSlot.name}</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-group">
            <label>Date Reserved</label>
            <input
              type="date"
              name="dateReserved"
              value={bookingData.dateReserved}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Time In</label>
              <input
                type="time"
                name="timeIn"
                value={bookingData.timeIn}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Time Out</label>
              <input
                type="time"
                name="timeOut"
                value={bookingData.timeOut}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Vehicle Type</label>
            <select
              name="vehicleType"
              value={bookingData.vehicleType}
              onChange={handleChange}
              required
            >
              <option value="Car">Car</option>
              <option value="Motorcycle">Motorcycle</option>
            </select>
          </div>

          {bookingData.timeIn && bookingData.timeOut && (
            <div className="booking-summary">
              <div className="summary-item">
                <span>Duration:</span>
                <strong>{calculateDuration()} hours</strong>
              </div>
              <div className="summary-item">
                <span>Price per hour:</span>
                <strong>{parkingSlot.price}</strong>
              </div>
              <div className="summary-item total">
                <span>Total Price:</span>
                <strong>₱{calculateTotalPrice()}</strong>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-confirm">
              Confirm Booking
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
