import React, { useState, useEffect } from 'react';
import '../styles/BookingModal.css';

export default function BookingModal({ isOpen, onClose, parkingSlot }) {
  const [bookingData, setBookingData] = useState({
    dateReserved: '',
    timeIn: '',
    timeOut: '',
    vehicleType: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [parkingAvailable, setParkingAvailable] = useState(true);
  const [occupancy, setOccupancy] = useState(null);

  // Check parking availability and fetch user's vehicle information
  useEffect(() => {
    const fetchData = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser || !currentUser.id) {
        setError('Please login to make a booking');
        setLoading(false);
        return;
      }

      try {
        // Check parking lot availability
        const parkingLotId = parkingSlot.id || parkingSlot.staff_id || parkingSlot.admin_id || parkingSlot.staffID;
        
        if (parkingLotId) {
          const availabilityResponse = await fetch(`http://localhost:8080/api/parking-slots/${parkingLotId}/availability`);
          if (availabilityResponse.ok) {
            const availabilityData = await availabilityResponse.json();
            setParkingAvailable(availabilityData.hasAvailable);
            setOccupancy(availabilityData.occupancy);
            
            if (!availabilityData.hasAvailable) {
              setError('⚠️ Parking lot is already full. No available slots at this moment.');
            }
          }
        }

        // Fetch user's vehicle information
        const vehicleResponse = await fetch(`http://localhost:8080/api/vehicles/user/${currentUser.id}`);
        if (vehicleResponse.ok) {
          const vehicleData = await vehicleResponse.json();
          const vehicleType = vehicleData.vehicle_type || vehicleData.vehicleType || 'Car';
          setBookingData(prev => ({
            ...prev,
            vehicleType: vehicleType
          }));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, parkingSlot]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (submitting) {
      console.warn('Submission already in progress');
      return;
    }
    
    setSubmitting(true);
    setError('');
    setSuccess('');

    // Check if parking is available before submitting
    if (!parkingAvailable) {
      setError('⚠️ Parking lot is already full. No available slots at this moment.');
      return;
    }

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

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
      setError('Please login to make a booking');
      return;
    }

    // Get parking lot ID - check multiple possible field names
    const parkingLotId = parkingSlot.id || parkingSlot.staff_id || parkingSlot.admin_id || parkingSlot.staffID;
    
    console.log('ParkingSlot data:', parkingSlot);
    console.log('Parking lot ID:', parkingLotId);
    console.log('Current user ID:', currentUser.id);

    if (!parkingLotId) {
      setError('Invalid parking lot selected. Please try again.');
      console.error('Missing parking lot ID. ParkingSlot object:', parkingSlot);
      return;
    }

    // Prepare booking data
    const bookingPayload = {
      user_id: currentUser.id,
      parking_lot_id: parkingLotId,
      date_reserved: bookingData.dateReserved,
      time_in: bookingData.timeIn,
      time_out: bookingData.timeOut,
      vehicle_type: bookingData.vehicleType,
      duration: calculateDuration(),
      total_price: parseFloat(calculateTotalPrice())
    };

    console.log('Booking payload:', bookingPayload);

    try {
      const response = await fetch('http://localhost:8080/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        // Enhanced error message handling
        const errorMessage = data.message || data.error || 'Failed to create booking';
        
        // Check if it's a parking full error
        if (errorMessage.toLowerCase().includes('full') || errorMessage.toLowerCase().includes('available slots')) {
          setError('⚠️ ' + errorMessage);
          setParkingAvailable(false);
        } else {
          setError(errorMessage);
        }
        setSubmitting(false);
        return;
      }

      // Backend now handles admin notification creation
      // Frontend just needs to show success and close modal
      setSuccess('✅ Booking request submitted! Awaiting admin confirmation.');
      setShowConfirmation(true);
      setSubmitting(false);
    } catch (error) {
      console.error('Booking error:', error);
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
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

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p>Loading...</p>
          </div>
        ) : !parkingAvailable ? (
          <div className="parking-full-message">
            <div className="full-icon">❌</div>
            <h3>Parking Lot is Already Full</h3>
            <p className="full-message-text">No available slots at this moment</p>
            <button className="btn-cancel" onClick={onClose} style={{ marginTop: '20px', width: '100%' }}>
              Close
            </button>
          </div>
        ) : (
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
                <div className="input-with-icon">
                  <i className="bx bx-time-five"></i>
                  <input
                    type="time"
                    name="timeIn"
                    value={bookingData.timeIn}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Time Out</label>
                <div className="input-with-icon">
                  <i className="bx bx-time-five"></i>
                  <input
                    type="time"
                    name="timeOut"
                    value={bookingData.timeOut}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {bookingData.vehicleType && (
              <div className="form-group">
                <label>Vehicle Type</label>
                <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', color: '#333' }}>
                  {bookingData.vehicleType}
                </div>
              </div>
            )}

            {bookingData.timeIn && bookingData.timeOut && (
              <div className="booking-summary">
                <div className="summary-item">
                  <span>Duration:</span>
                  <strong>{calculateDuration()} hours</strong>
                </div>
                <div className="summary-item">
                  <span>Price per hour:</span>
                  <strong>₱{parseFloat(parkingSlot.price.replace(/[^0-9.]/g, '')) || 0}/hr</strong>
                </div>
                <div className="summary-item total">
                  <span>Total Price:</span>
                  <strong>₱{calculateTotalPrice()}</strong>
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-confirm" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Confirmation Modal - Shows after successful booking */}
      {showConfirmation && (
        <div className="modal-overlay" onClick={() => {
          setShowConfirmation(false);
          onClose();
          setBookingData({ dateReserved: '', timeIn: '', timeOut: '', vehicleType: '' });
          setSuccess('');
        }}>
          <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
            <div className="confirmation-header">
              <div className="confirmation-icon">✓</div>
              <h2>Booking Submitted!</h2>
            </div>
            
            <div className="confirmation-body">
              <p className="confirmation-message">
                Your booking request has been submitted successfully.
              </p>
              <p className="confirmation-wait">
                Please wait for confirmation. You will receive a notification once your booking is approved.
              </p>
            </div>
            
            <div className="confirmation-actions">
              <button 
                className="btn-confirm-close"
                onClick={() => {
                  setShowConfirmation(false);
                  onClose();
                  setBookingData({ dateReserved: '', timeIn: '', timeOut: '', vehicleType: '' });
                  setSuccess('');
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
