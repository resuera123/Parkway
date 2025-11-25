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
    if (!bookingData.timeIn || !bookingData.timeOut) return 0;
    const timeIn = new Date(`2000-01-01 ${bookingData.timeIn}`);
    const timeOut = new Date(`2000-01-01 ${bookingData.timeOut}`);
    const diff = timeOut - timeIn;
    return Math.max(0, Math.round(diff / (1000 * 60 * 60)));
  };

  const calculateTotalPrice = () => {
    const duration = calculateDuration();
    if (!duration || !parkingSlot?.price) return '0.00';
    
    // Extract numeric value from price string (e.g., "$5/hr" -> 5)
    const pricePerHour = parseFloat(parkingSlot.price.replace(/[^0-9.]/g, '')) || 0;
    return (pricePerHour * duration).toFixed(2);
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

    // Check if slot is available
    const slots = JSON.parse(localStorage.getItem('parkingSlots')) || [];
    const slot = slots.find(s => s.name === parkingSlot.name);
    
    if (slot && slot.bookedSlots >= slot.totalSlots) {
      setError('Sorry, this parking slot is fully booked');
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
      status: 'pending', // changed from confirmed
      bookingDate: new Date().toISOString()
    };
    bookings.push(newBooking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    // User notification (pending)
    const notifications = JSON.parse(localStorage.getItem('notifications')) || [];
    notifications.push({
      id: Date.now() + 1,
      userId: currentUser.username,
      type: 'booking-pending',
      title: 'Booking Submitted',
      message: `Your booking at ${parkingSlot.name} is awaiting admin confirmation.`,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('notifications', JSON.stringify(notifications));

    // Admin notification (request)
    const adminNotifications = JSON.parse(localStorage.getItem('adminNotifications')) || [];
    adminNotifications.push({
      id: Date.now() + 2,
      bookingId: newBooking.id,
      title: 'New Booking Request',
      message: `${currentUser.firstName} booked ${parkingSlot.name} on ${bookingData.dateReserved} (${bookingData.timeIn} - ${bookingData.timeOut})`,
      timestamp: new Date().toISOString(),
      read: false,
      status: null
    });
    localStorage.setItem('adminNotifications', JSON.stringify(adminNotifications));

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
