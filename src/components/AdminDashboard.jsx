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

  const initParkingSlots = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
      console.error('No current user found');
      setParkingSlots([]);
      return;
    }

    console.log('Current user:', currentUser);
    console.log('Fetching admin parking lot for user ID:', currentUser.id);
    
    // If parking lot ID is already stored with user, use it directly
    if (currentUser.parkingLotId) {
      console.log('✓ Using stored parking lot ID:', currentUser.parkingLotId);
      try {
        const response = await fetch(`http://localhost:8080/api/admins/${currentUser.parkingLotId}`);
        if (response.ok) {
          const lot = await response.json();
          
          let bookedCount = 0;
          try {
            const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${currentUser.parkingLotId}`);
            if (slotsResponse.ok) {
              const slots = await slotsResponse.json();
              bookedCount = slots.filter(s => (s.status || '').toLowerCase() === 'occupied' || s.reserved === true).length;
            }
          } catch (error) {
            console.error('Error fetching slot statuses:', error);
          }
          
          const formattedSlot = {
            id: currentUser.parkingLotId,
            name: lot.parkingLotName || lot.parking_lot_name || currentUser.parkingLotName || 'Unnamed Parking Lot',
            totalSlots: lot.capacity || 10,
            bookedSlots: bookedCount,
            status: 'available',
            price: `$${lot.rate || lot.price || 0}/hr`
          };
          console.log('Formatted parking slot from stored ID:', formattedSlot);
          setParkingSlots([formattedSlot]);
          setSelectedLocationId(formattedSlot.id);
          loadLocationSlotStatuses(formattedSlot.id);
          return;
        }
      } catch (error) {
        console.error('Error fetching parking lot by stored ID:', error);
      }
    }

    try {
      // SKIP Method 1 - backend bug: /api/admins/:id returns wrong admin data
      // Always use email-based lookup to get correct parking lot
      console.log('Using email-based lookup to avoid backend ID bug');
      let response = await fetch(`http://localhost:8080/api/admins/email/${encodeURIComponent(currentUser.email)}`);
      console.log('Email-based lookup response status:', response.status);
      
      // If email lookup fails, try Method 2: Get all parking lots and find by email
      if (!response.ok && response.status === 404) {
        console.log('Email lookup failed, trying Method 2: Get all parking lots');
        response = await fetch('http://localhost:8080/api/admin/parking-lots');
        console.log('Method 2 - Get all lots response status:', response.status);
        
        if (response.ok) {
          const allLots = await response.json();
          console.log('All parking lots from database:', allLots);
          console.log('Looking for email:', currentUser.email);
          
          // Find the lot that matches current user's email (exact match)
          const userLot = allLots.find(lot => {
            const lotEmail = (lot.email || '').toLowerCase().trim();
            const userEmail = (currentUser.email || '').toLowerCase().trim();
            console.log(`Comparing: "${lotEmail}" === "${userEmail}"`);
            return lotEmail === userEmail;
          });
          
          if (userLot) {
            console.log('✓ Found matching parking lot for this admin:', userLot);
            const lot = userLot;
            const lotId = lot.admin_id || lot.staffID || lot.staff_id || lot.id;
            
            // Fetch actual slot statuses from database
            let bookedCount = 0;
            try {
              const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${lotId}`);
              if (slotsResponse.ok) {
                const slots = await slotsResponse.json();
                bookedCount = slots.filter(s => (s.status || '').toLowerCase() === 'occupied' || s.reserved === true).length;
              }
            } catch (error) {
              console.error('Error fetching slot statuses:', error);
            }
            
            const formattedSlot = {
              id: lotId,
              name: lot.parkingLotName || lot.parking_lot_name || 'Unnamed Parking Lot',
              totalSlots: lot.capacity || 10,
              bookedSlots: bookedCount,
              status: 'available',
              price: `$${lot.rate || lot.price || 0}/hr`
            };
            console.log('Formatted parking slot:', formattedSlot);
            setParkingSlots([formattedSlot]);
            setSelectedLocationId(formattedSlot.id);
            loadLocationSlotStatuses(formattedSlot.id);
            return;
          } else {
            console.error('No parking lot found for user email:', currentUser.email);
            setParkingSlots([]);
            return;
          }
        }
      }
      
      // If we got a successful response from Method 1 or 2
      if (response.ok) {
        const data = await response.json();
        console.log('Admin parking lot data from API:', data);
        
        const lot = data;
        console.log('Lot fields:', {
          admin_id: lot.admin_id,
          staffID: lot.staffID,
          staff_id: lot.staff_id,
          parkingLotName: lot.parkingLotName,
          parking_lot_name: lot.parking_lot_name,
          capacity: lot.capacity,
          rate: lot.rate,
          price: lot.price
        });
        
        const lotId = lot.admin_id || lot.staffID || lot.staff_id || lot.id;
        
        // Fetch actual slot statuses from database
        let bookedCount = 0;
        try {
          const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${lotId}`);
          if (slotsResponse.ok) {
            const slots = await slotsResponse.json();
            bookedCount = slots.filter(s => (s.status || '').toLowerCase() === 'occupied' || s.reserved === true).length;
          }
        } catch (error) {
          console.error('Error fetching slot statuses:', error);
        }
        
        const formattedSlot = {
          id: lotId,
          name: lot.parkingLotName || lot.parking_lot_name || 'Unnamed Parking Lot',
          totalSlots: lot.capacity || 10,
          bookedSlots: bookedCount,
          status: 'available',
          price: `$${lot.rate || lot.price || 0}/hr`
        };
        console.log('Formatted parking slot:', formattedSlot);
        setParkingSlots([formattedSlot]);
        setSelectedLocationId(formattedSlot.id);
        loadLocationSlotStatuses(formattedSlot.id);
      } else {
        console.error('All methods failed. Admin parking lot not found.');
        console.error('This likely means the admin creation failed in the backend.');
        setParkingSlots([]);
      }
    } catch (error) {
      console.error('Error fetching parking lot:', error);
      setParkingSlots([]);
    }
  };

  const loadAdminNotifications = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
      setAdminNotifications([]);
      return;
    }

    try {
      console.log('🔔 Loading admin notifications for user_id:', currentUser.id);
      console.log('Fetching from:', `http://localhost:8080/api/notifications/admin/${currentUser.id}`);
      
      const response = await fetch(`http://localhost:8080/api/notifications/admin/${currentUser.id}`);
      console.log('Admin notifications response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Admin notifications received:', data);
        console.log('Number of admin notifications:', Array.isArray(data) ? data.length : 'Not an array');
        
        if (Array.isArray(data)) {
          setAdminNotifications(data);
          const unread = data.filter(n => !n.read).length;
          setUnreadCount(unread);
          console.log('Unread admin notifications:', unread);
        } else {
          console.warn('⚠️ Response is not an array:', typeof data);
          setAdminNotifications([]);
          setUnreadCount(0);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to load admin notifications:', response.status);
        console.error('Error details:', errorText);
        setAdminNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('❌ Exception loading admin notifications:', error);
      setAdminNotifications([]);
      setUnreadCount(0);
    }
  };

  const loadBookings = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
      console.error('No current user found for loading bookings');
      setBookings([]);
      return;
    }

    try {
      console.log('Loading bookings for admin user:', currentUser);
      
      // First, we need to get the admin's parking lot ID
      let parkingLotId = null;
      
      // Check if parking lot ID is already stored with user
      if (currentUser.parkingLotId) {
        parkingLotId = currentUser.parkingLotId;
        console.log('Using stored parking lot ID for bookings:', parkingLotId);
      } else {
        // SKIP buggy Method 1 (by user ID) - use email-based lookup
        console.log('Using email-based lookup to get parking lot ID');
        let response = await fetch(`http://localhost:8080/api/admins/email/${encodeURIComponent(currentUser.email)}`);
        console.log('Fetch admin by email response status:', response.status);
        
        // Method 2: Get all parking lots and find matching one
        if (response.status === 404) {
          console.log('Trying to fetch from all parking lots');
          response = await fetch('http://localhost:8080/api/admin/parking-lots');
          console.log('Fetch all lots response status:', response.status);
          
          if (response.ok) {
            const allLots = await response.json();
            const userLot = allLots.find(lot => 
              (lot.email || '').toLowerCase() === (currentUser.email || '').toLowerCase()
            );
            
            if (userLot) {
              parkingLotId = userLot.admin_id || userLot.staffID || userLot.staff_id || userLot.id;
              console.log('Found parking lot ID from all lots:', parkingLotId);
            }
          }
        } else if (response.ok) {
          const adminData = await response.json();
          parkingLotId = adminData.admin_id || adminData.staffID || adminData.staff_id || adminData.id;
          console.log('Found parking lot ID from admin data:', parkingLotId);
        }
      }
      
      if (!parkingLotId) {
        console.error('Could not determine parking lot ID for bookings');
        setBookings([]);
        return;
      }
      
      // Now fetch bookings using the parking lot ID
      console.log('Fetching bookings for parking lot ID:', parkingLotId);
      const bookingsResponse = await fetch(`http://localhost:8080/api/bookings/admin/${parkingLotId}`);
      console.log('Bookings response status:', bookingsResponse.status);
      
      if (bookingsResponse.ok) {
        const data = await bookingsResponse.json();
        console.log('Bookings data:', data);
        console.log('Number of bookings:', Array.isArray(data) ? data.length : 'Not an array');
        
        // Fetch vehicle info for each booking to get model, plate number, etc.
        const bookingsWithVehicles = await Promise.all(
          data.map(async (booking) => {
            if (booking.user_id) {
              try {
                const vehicleResponse = await fetch(`http://localhost:8080/api/vehicles/user/${booking.user_id}`);
                if (vehicleResponse.ok) {
                  const vehicle = await vehicleResponse.json();
                  return {
                    ...booking,
                    vehicle_model: vehicle.model || vehicle.vehicle_model,
                    plate_number: vehicle.plate_number || vehicle.plateNumber,
                    vehicle_color: vehicle.color || vehicle.vehicle_color
                  };
                }
              } catch (vehicleError) {
                console.error('Error fetching vehicle for user:', booking.user_id, vehicleError);
              }
            }
            return booking;
          })
        );
        
        console.log('Bookings with vehicle info:', bookingsWithVehicles);
        
        // Merge with locally confirmed bookings (persisted in localStorage)
        const confirmedBookingsKey = `confirmedBookings_${parkingLotId}`;
        const localConfirmed = JSON.parse(localStorage.getItem(confirmedBookingsKey) || '[]');
        console.log('Locally confirmed booking IDs:', localConfirmed);
        
        const mergedBookings = bookingsWithVehicles.map(booking => {
          const bookingId = booking.booking_id || booking.id;
          // If this booking was confirmed locally, override backend status
          if (localConfirmed.includes(bookingId)) {
            console.log(`Overriding booking ${bookingId} status to confirmed (from localStorage)`);
            return { ...booking, status: 'confirmed' };
          }
          return booking;
        });
        
        setBookings(mergedBookings);
      } else {
        const errorText = await bookingsResponse.text();
        console.log('Bookings fetch failed:', bookingsResponse.status, errorText);
        setBookings([]);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
      setBookings([]);
    }
  };

  const initializeParkingSlots = async (locationId, capacity) => {
    try {
      console.log(`Initializing ${capacity} parking slots for location ${locationId}...`);
      const response = await fetch('http://localhost:8080/api/parking-slots/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parkingLotId: locationId,
          parking_lot_id: locationId,
          capacity: capacity
        }),
      });

      if (response.ok) {
        console.log('✓ Parking slots initialized successfully');
        return true;
      } else {
        const errorText = await response.text();
        console.error('Failed to initialize slots:', response.status, errorText);
        return false;
      }
    } catch (error) {
      console.error('Error initializing parking slots:', error);
      return false;
    }
  };

  const loadLocationSlotStatuses = async (locationId) => {
    try {
      console.log('Fetching slots for location:', locationId);
      const response = await fetch(`http://localhost:8080/api/parking-slots/${locationId}`);
      if (response.ok) {
        const slots = await response.json();
        console.log('Slots from API:', slots);
        
        // If no slots exist, initialize them in the backend
        if (!slots || slots.length === 0) {
          const location = parkingSlots.find(p => p.id === locationId);
          const capacity = location?.totalSlots || 10;
          
          console.warn(`No slots found for location ${locationId}. Attempting to initialize slots in backend...`);
          
          // Try to initialize slots in the backend
          const initialized = await initializeParkingSlots(locationId, capacity);
          
          if (initialized) {
            // Retry fetching slots after initialization
            const retryResponse = await fetch(`http://localhost:8080/api/parking-slots/${locationId}`);
            if (retryResponse.ok) {
              const newSlots = await retryResponse.json();
              if (newSlots && newSlots.length > 0) {
                const formattedSlots = newSlots.map(slot => ({
                  slotId: slot.slot_id || slot.slotId,
                  slotNumber: slot.slot_number || slot.slotNumber,
                  reserved: (slot.status || '').toLowerCase() === 'occupied'
                }));
                setLocationSlots(formattedSlots);
                console.log('✓ Slots successfully loaded after initialization');
                return;
              }
            }
          }
          
          // If initialization failed or doesn't exist, show default slots
          const defaultSlots = Array.from({ length: capacity }, (_, i) => ({
            slotId: null,
            slotNumber: i + 1,
            reserved: false
          }));
          setLocationSlots(defaultSlots);
          console.warn(`Using default vacant slots (backend initialization unavailable).`);
          return;
        }
        
        // Log each slot's raw status before formatting
        slots.forEach(slot => {
          console.log(`Slot ${slot.slot_number || slot.slotNumber}: status="${slot.status}", reserved=${slot.reserved}`);
        });
        
        const formattedSlots = slots.map(slot => {
          // Check multiple status formats
          const status = (slot.status || '').toLowerCase();
          const reservedField = slot.reserved;
          
          // Consider a slot occupied if:
          // 1. status is 'occupied' OR 'reserved'
          // 2. OR reserved field is true
          const isOccupied = status === 'occupied' || status === 'reserved' || reservedField === true;
          
          return {
            slotId: slot.slot_id || slot.slotId,
            slotNumber: slot.slot_number || slot.slotNumber,
            reserved: isOccupied
          };
        });
        
        console.log('Formatted slots:', formattedSlots);
        console.log('Occupied count:', formattedSlots.filter(s => s.reserved).length);
        console.log('Vacant count:', formattedSlots.filter(s => !s.reserved).length);
        
        // Additional check - if ALL slots are occupied for a new parking lot, something is wrong
        const allOccupied = formattedSlots.every(s => s.reserved);
        if (allOccupied && formattedSlots.length > 0) {
          console.error('⚠️ WARNING: All slots are showing as occupied! This is likely a backend issue.');
          console.error('Backend should initialize slots with status="vacant" or reserved=false');
        }
        
        setLocationSlots(formattedSlots);
      } else {
        console.error('Failed to fetch slots, status:', response.status);
        setLocationSlots([]);
      }
    } catch (error) {
      console.error('Error loading slot statuses:', error);
      setLocationSlots([]);
    }
  };

  const handleSelectLocation = (id) => {
    setSelectedLocationId(id);
    loadLocationSlotStatuses(id);
    setUnsavedChanges(false);
  };

  const toggleSlot = async (slotNumber) => {
    const slot = locationSlots.find(s => s.slotNumber === slotNumber);
    if (!slot) {
      console.error('Slot not found:', slotNumber);
      return;
    }

    if (!slot.slotId) {
      alert('Cannot update slot: Slot ID is missing. Backend needs to create parking_slots entries.');
      console.error('Slot has no ID:', slot);
      return;
    }

    try {
      const newStatus = slot.reserved ? 'vacant' : 'occupied';
      console.log(`Toggling slot ${slotNumber} (ID: ${slot.slotId}) from ${slot.reserved ? 'occupied' : 'vacant'} to ${newStatus}`);
      
      const response = await fetch(`http://localhost:8080/api/parking-slots/${slot.slotId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      console.log('Update response status:', response.status);
      const responseText = await response.text();
      console.log('Update response body:', responseText);

      if (response.ok) {
        console.log('✓ Slot updated successfully');
        // Reload slots to reflect changes
        await loadLocationSlotStatuses(selectedLocationId);
        await initParkingSlots();
      } else {
        alert(`Failed to update slot status: ${response.status} - ${responseText}`);
      }
    } catch (error) {
      console.error('Error toggling slot:', error);
      alert(`Failed to update slot status: ${error.message}`);
    }
  };

  const commitLocationChanges = async () => {
    // Changes are now saved immediately on toggle, so this is just to refresh
    if (!selectedLocationId) return;
    await loadLocationSlotStatuses(selectedLocationId);
    await initParkingSlots();
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

  const markNotificationAsRead = async (id) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      loadAdminNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleConfirmBooking = async (bookingId) => {
    try {
      console.log('Confirming booking ID:', bookingId);
      const booking = bookings.find(b => (b.booking_id || b.id) === bookingId);
      
      if (!booking) {
        console.error('Booking not found:', bookingId);
        alert('Booking not found');
        return;
      }
      
      console.log('Booking to confirm:', booking);
      
      // Since backend endpoints are failing due to CORS/implementation issues,
      // we'll update the status locally and proceed with notifications and slot updates
      console.warn('⚠️ Backend booking confirmation endpoint has issues. Updating locally.');
      console.warn('Backend needs to fix: 1) CORS configuration, 2) /confirm endpoint query bug');
      
      // First, verify the booking exists and is pending
      if (!booking) {
        alert('Booking not found');
        return;
      }
      
      if (booking.status === 'confirmed') {
        alert('This booking is already confirmed');
        return;
      }
      
      // Try to update booking status in backend first
      try {
        console.log('Attempting to update booking status in backend...');
        const updateResponse = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'confirmed' }),
        });
        
        if (updateResponse.ok) {
          console.log('✓ Backend booking status updated successfully');
        } else {
          console.warn('⚠️ Backend update failed, status:', updateResponse.status);
          console.warn('Continuing with local update...');
        }
      } catch (backendError) {
        console.error('Backend update error:', backendError);
        console.warn('Continuing with local update...');
      }
      
      // Persist confirmation to localStorage so it survives page reload
      const parkingLotId = booking.parking_lot_id;
      const confirmedBookingsKey = `confirmedBookings_${parkingLotId}`;
      const existingConfirmed = JSON.parse(localStorage.getItem(confirmedBookingsKey) || '[]');
      if (!existingConfirmed.includes(bookingId)) {
        existingConfirmed.push(bookingId);
        localStorage.setItem(confirmedBookingsKey, JSON.stringify(existingConfirmed));
        console.log('✓ Booking confirmation persisted to localStorage:', bookingId);
      }
      
      // Update booking status locally for instant UI update
      const updatedBookings = bookings.map(b => {
        if ((b.booking_id || b.id) === bookingId) {
          console.log('Updating booking from status:', b.status, 'to confirmed');
          return { ...b, status: 'confirmed' };
        }
        return b;
      });
      
      console.log('✓ Booking status updated locally to confirmed');
      
      // Immediately update state to trigger re-render
      setBookings(updatedBookings);
      
      // Create user notification
      try {
        const notificationPayload = {
          user_id: booking.user_id,
          booking_id: bookingId,
          parking_lot_id: booking.parking_lot_id,
          title: 'Booking Confirmed!',
          message: `Your booking at ${booking.parking_lot_name || 'parking lot'} on ${new Date(booking.date_reserved).toLocaleDateString()} (${booking.time_in} - ${booking.time_out}) has been confirmed!`,
          type: 'confirmation',
          read: false
        };
        
        console.log('Sending user notification:', notificationPayload);
        
        const notifResponse = await fetch('http://localhost:8080/api/notifications/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(notificationPayload),
        });
        
        if (notifResponse.ok) {
          console.log('✓ User notification sent successfully');
        } else {
          console.error('Failed to send user notification, status:', notifResponse.status);
        }
      } catch (notifError) {
        console.error('Failed to send user notification:', notifError);
      }

      // Find first available parking slot and mark as occupied
      const loc = parkingSlots.find(p => p.id === booking.parking_lot_id);
      console.log('Looking for parking lot:', booking.parking_lot_id, 'Found:', loc);
      
      if (loc) {
        try {
          // Get available slots
          console.log('Fetching slots for parking lot ID:', loc.id);
          const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${loc.id}`);
          if (slotsResponse.ok) {
            const slots = await slotsResponse.json();
            console.log('All slots before update:', slots);
            const vacantSlot = slots.find(s => (s.status || '').toLowerCase() === 'vacant');
            console.log('First vacant slot found:', vacantSlot);
            
            if (vacantSlot) {
              const slotId = vacantSlot.slot_id || vacantSlot.slotId;
              console.log('Updating slot ID:', slotId, 'to occupied');
              
              // Mark slot as occupied
              const updateResponse = await fetch(`http://localhost:8080/api/parking-slots/${slotId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: 'occupied' }),
              });
              
              if (updateResponse.ok) {
                console.log('✓ Parking slot successfully marked as occupied:', slotId);
              } else {
                console.error('Failed to update slot, status:', updateResponse.status);
              }
            } else {
              console.warn('No vacant slots available!');
            }
          }
        } catch (slotError) {
          console.error('Failed to update parking slot:', slotError);
        }
      } else {
        console.error('Could not find parking lot with ID:', booking.parking_lot_id);
      }
      
      // Reload all data to ensure everything is in sync
      console.log('Reloading all data after confirmation...');
      await Promise.all([
        loadAdminNotifications(),
        initParkingSlots()
      ]);
      
      // Always refresh the parking slots view for the booking's location
      if (booking.parking_lot_id) {
        console.log('Refreshing slots for location:', booking.parking_lot_id);
        await loadLocationSlotStatuses(booking.parking_lot_id);
        
        // If it's not the currently selected location, switch to it
        if (selectedLocationId !== booking.parking_lot_id) {
          setSelectedLocationId(booking.parking_lot_id);
        }
      }
      
      alert('Booking confirmed and user notified!');
      
      // Don't reload bookings - we already updated the state locally
      // Backend confirmation endpoint has bugs, so we maintain local state
      console.log('✓ Booking confirmation complete - using local state update');
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking');
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to delete this booking? This will also free up the parking slot if it was reserved.')) {
      return;
    }

    try {
      const booking = bookings.find(b => b.booking_id === bookingId);
      
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete booking error:', errorText);
        alert('Failed to delete booking: ' + errorText);
        return;
      }

      // Remove from localStorage confirmed list if it was confirmed
      if (booking && booking.status === 'confirmed' && booking.parking_lot_id) {
        const confirmedBookingsKey = `confirmedBookings_${booking.parking_lot_id}`;
        const existingConfirmed = JSON.parse(localStorage.getItem(confirmedBookingsKey) || '[]');
        const updatedConfirmed = existingConfirmed.filter(id => id !== bookingId);
        localStorage.setItem(confirmedBookingsKey, JSON.stringify(updatedConfirmed));
        console.log('✓ Removed booking from localStorage confirmed list:', bookingId);
      }

      // If booking was confirmed, we need to free up a parking slot
      if (booking && booking.status === 'confirmed') {
        const loc = parkingSlots.find(p => p.id === booking.parking_lot_id);
        if (loc) {
          try {
            // Get all occupied slots and free the first one (since we don't track which specific slot was used)
            const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${loc.id}`);
            if (slotsResponse.ok) {
              const slots = await slotsResponse.json();
              const occupiedSlot = slots.find(s => s.status === 'occupied');
              
              if (occupiedSlot) {
                await fetch(`http://localhost:8080/api/parking-slots/${occupiedSlot.slot_id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ status: 'vacant' }),
                });
              }
            }
          } catch (slotError) {
            console.error('Failed to free parking slot:', slotError);
          }
        }
      }

      loadBookings();
      loadAdminNotifications();
      initParkingSlots();
      alert('Booking deleted successfully!');
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking: ' + error.message);
    }
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
        
      </aside>

      {/* Top bar */}
      <div className="admin-content">
        <header className="admin-topbar">
          <div className="topbar-right">
            <div className="admin-user-mini">
              <span>{adminUser?.firstname || 'Admin'}</span>
              <span className="role-tag">Admin</span>
            </div>
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
                      key={n.notification_id || n.id}
                      className={`notification-item ${n.read ? 'read' : 'unread'}`}
                    >
                      <div className="notification-content">
                        <h4>New Booking Request</h4>
                        <p><strong>{n.user_name}</strong> requested booking at <strong>{n.parking_lot_name}</strong></p>
                        <p>Date: {n.date_reserved} | Time: {n.time_in} - {n.time_out}</p>
                        <small>{new Date(n.created_at || n.timestamp).toLocaleString()}</small>
                      </div>
                      {!n.read && (
                        <button
                          className="mark-read-btn"
                          onClick={() => markNotificationAsRead(n.notification_id || n.id)}
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
                  <div key={b.booking_id || b.id} className="booking-row">
                    <div className="b-col main">
                      <strong>{b.parking_lot_name || 'N/A'}</strong>
                      <small>{b.user_firstname} {b.user_lastname}</small>
                      <small>{new Date(b.created_at).toLocaleString()}</small>
                    </div>
                    <div className="b-col">{b.date_reserved}</div>
                    <div className="b-col">{b.time_in} - {b.time_out}</div>
                    <div className="b-col">{b.vehicle_type}</div>
                    <div className="b-col">{b.duration}h</div>
                    <div className="b-col">₱{parseFloat(b.total_price).toFixed(2)}</div>
                    <div className="b-col status">
                      <span className={`mini-status ${b.status}`}>{b.status}</span>
                    </div>
                    <div className="b-col actions">
                      {b.status === 'pending' && (
                        <>
                          <button 
                            className="confirm-booking-btn"
                            onClick={() => handleConfirmBooking(b.booking_id || b.id)}
                          >
                            Confirm
                          </button>
                          <button 
                            className="delete-booking-btn"
                            onClick={() => handleDeleteBooking(b.booking_id || b.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {b.status === 'confirmed' && (
                        <>
                          <span className="confirmed-text">✓ Confirmed</span>
                          <button 
                            className="delete-booking-btn"
                            onClick={() => handleDeleteBooking(b.booking_id || b.id)}
                          >
                            Delete
                          </button>
                        </>
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

              <div className="parking-spaces-info">
                <p className="instruction-text">
                  💡 <strong>Click on any parking slot</strong> to toggle between vacant (green) and occupied (red)
                </p>
                <div className="pending-info">
                  <span>
                    Occupied: {
                      locationSlots.filter(s => s.reserved).length
                    } / {
                      parkingSlots.find(p => p.id === selectedLocationId)?.totalSlots || locationSlots.length
                    }
                  </span>
                  <span>
                    Vacant: {
                      locationSlots.filter(s => !s.reserved).length
                    } / {
                      parkingSlots.find(p => p.id === selectedLocationId)?.totalSlots || locationSlots.length
                    }
                  </span>
                  {locationSlots.filter(s => s.reserved).length === locationSlots.length && (
                    <span className="full-indicator">FULL - No vacant slots</span>
                  )}
                </div>
              </div>

              <div className="spaces-grid">
                {locationSlots.map((slot, index) => {
                  // Find confirmed bookings for this parking lot
                  const confirmedBookings = bookings.filter(b => 
                    b.parking_lot_id === selectedLocationId && b.status === 'confirmed'
                  );
                  
                  // Assign booking to slot based on index (first confirmed booking to first occupied slot, etc.)
                  const occupiedSlots = locationSlots.filter(s => s.reserved);
                  const occupiedIndex = occupiedSlots.findIndex(s => s.slotNumber === slot.slotNumber);
                  const slotBooking = slot.reserved && occupiedIndex >= 0 && confirmedBookings[occupiedIndex] 
                    ? confirmedBookings[occupiedIndex] 
                    : null;
                  
                  return (
                    <div
                      key={`${selectedLocationId}-slot-${slot.slotNumber}-${index}`}
                      className={`slot-cell ${slot.reserved ? 'reserved' : 'vacant'}`}
                      onClick={() => toggleSlot(slot.slotNumber)}
                      title={
                        slot.reserved && slotBooking 
                          ? `P${slot.slotNumber} - ${slotBooking.user_firstname || 'User'} ${slotBooking.user_lastname || ''}\n${slotBooking.vehicle_type || 'Vehicle'} - ${slotBooking.vehicle_model || slotBooking.model || 'N/A'}\nPlate: ${slotBooking.plate_number || slotBooking.plateNumber || 'N/A'}`
                          : `Click to ${slot.reserved ? 'free' : 'reserve'} P${slot.slotNumber}`
                      }
                    >
                      <div className="slot-number">P{slot.slotNumber}</div>
                      {slot.reserved && slotBooking && (
                        <div className="slot-booking-info">
                          <div className="slot-user">{slotBooking.user_firstname || slotBooking.firstname} {slotBooking.user_lastname || slotBooking.lastname}</div>
                          <div className="slot-vehicle">{slotBooking.vehicle_type || 'Vehicle'}</div>
                          <div className="slot-model">{slotBooking.vehicle_model || slotBooking.model || 'N/A'}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="spaces-actions">
                <button
                  className="update-spaces-btn"
                  onClick={() => {
                    loadLocationSlotStatuses(selectedLocationId);
                    initParkingSlots();
                  }}
                >
                  Refresh Slots
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
    </div>
  );
}
