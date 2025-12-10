import React, { useState, useEffect } from 'react';
import '../styles/AdminDashboard.css';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";
import ConfirmationModal from './ConfirmationModal';
import AskModal from './AskModal';
import SuccessModal from './SuccessModal';

export default function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [adminUser, setAdminUser] = useState(null);
  const [parkingSlots, setParkingSlots] = useState([]);
  const [activeSection, setActiveSection] = useState('overview'); // overview | bookings | spaces | reports | profile
  const [bookings, setBookings] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [locationSlots, setLocationSlots] = useState([]); // per-slot status for selected location
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [bookingToConfirm, setBookingToConfirm] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [editData, setEditData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    parkingLotName: '',
    capacity: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
    useEffect(() => {
    const cu = localStorage.getItem('currentUser');
    if (cu) {
      const userData = JSON.parse(cu);
      setAdminUser(userData);
      setEditData({
        firstname: userData.firstname || '',
        lastname: userData.lastname || '',
        email: userData.email || '',
        parkingLotName: userData.parkingLotName || '',
        capacity: userData.capacity || ''
      });
    }
    initParkingSlots();
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
          
          const capacity = currentUser.capacity || lot.capacity || 10;
          
          const formattedSlot = {
            id: currentUser.parkingLotId,
            name: lot.parkingLotName || lot.parking_lot_name || currentUser.parkingLotName || 'Unnamed Parking Lot',
            totalSlots: parseInt(capacity),
            bookedSlots: bookedCount,
            status: 'available',
            price: `$${lot.rate || lot.price || 0}/hr`
          };
          console.log('Formatted parking slot from stored ID:', formattedSlot);
          console.log('Using capacity:', capacity);
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
      console.log('Using email-based lookup to avoid backend ID bug');
      let response = await fetch(`http://localhost:8080/api/admins/email/${encodeURIComponent(currentUser.email)}`);
      console.log('Email-based lookup response status:', response.status);
      
      if (!response.ok && response.status === 404) {
        console.log('Email lookup failed, trying Method 2: Get all parking lots');
        response = await fetch('http://localhost:8080/api/admin/parking-lots');
        console.log('Method 2 - Get all lots response status:', response.status);
        
        if (response.ok) {
          const allLots = await response.json();
          console.log('All parking lots from database:', allLots);
          console.log('Looking for email:', currentUser.email);
          
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
            
            const capacity = currentUser.capacity || lot.capacity || 10;
            
            const formattedSlot = {
              id: lotId,
              name: lot.parkingLotName || lot.parking_lot_name || 'Unnamed Parking Lot',
              totalSlots: parseInt(capacity),
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
        
        const capacity = currentUser.capacity || lot.capacity || 10;
        
        const formattedSlot = {
          id: lotId,
          name: lot.parkingLotName || lot.parking_lot_name || 'Unnamed Parking Lot',
          totalSlots: parseInt(capacity),
          bookedSlots: bookedCount,
          status: 'available',
          price: `$${lot.rate || lot.price || 0}/hr`
        };
        console.log('Formatted parking slot:', formattedSlot);
        console.log('Using capacity:', capacity);
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

  const loadBookings = async () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
      console.error('No current user found for loading bookings');
      setBookings([]);
      return;
    }

    try {
      console.log('Loading bookings for admin user:', currentUser);
      
      let parkingLotId = null;
      
      if (currentUser.parkingLotId) {
        parkingLotId = currentUser.parkingLotId;
        console.log('Using stored parking lot ID for bookings:', parkingLotId);
      } else {
        console.log('Using email-based lookup to get parking lot ID');
        let response = await fetch(`http://localhost:8080/api/admins/email/${encodeURIComponent(currentUser.email)}`);
        console.log('Fetch admin by email response status:', response.status);
        
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
      
      console.log('Fetching bookings for parking lot ID:', parkingLotId);
      const bookingsResponse = await fetch(`http://localhost:8080/api/bookings/admin/${parkingLotId}`);
      console.log('Bookings response status:', bookingsResponse.status);
      
      if (bookingsResponse.ok) {
        const data = await bookingsResponse.json();
        console.log('Bookings data:', data);
        console.log('Number of bookings:', Array.isArray(data) ? data.length : 'Not an array');
        
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
        
        const confirmedBookingsKey = `confirmedBookings_${parkingLotId}`;
        const localConfirmed = JSON.parse(localStorage.getItem(confirmedBookingsKey) || '[]');
        console.log('Locally confirmed booking IDs:', localConfirmed);
        
        const mergedBookings = bookingsWithVehicles.map(booking => {
          const bookingId = booking.booking_id || booking.id;
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
      console.log('=== Loading slots for location:', locationId, '===');
      const response = await fetch(`http://localhost:8080/api/parking-slots/${locationId}`);
      if (response.ok) {
        const slots = await response.json();
        console.log('✓ Slots from API:', slots);
        console.log('✓ Number of slots returned:', slots.length);
        
        const location = parkingSlots.find(p => p.id === locationId);
        const expectedCapacity = location?.totalSlots || 10;
        console.log('Expected capacity:', expectedCapacity, 'Actual slots:', slots.length);
        
        if (!slots || slots.length === 0) {
          const capacity = expectedCapacity;
          
          console.warn(`No slots found for location ${locationId}. Attempting to initialize slots in backend...`);
          
          const initialized = await initializeParkingSlots(locationId, capacity);
          
          if (initialized) {
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
          
          const defaultSlots = Array.from({ length: capacity }, (_, i) => ({
            slotId: null,
            slotNumber: i + 1,
            reserved: false
          }));
          setLocationSlots(defaultSlots);
          console.warn(`Using default vacant slots (backend initialization unavailable).`);
          return;
        }
        
        slots.forEach(slot => {
          console.log(`Slot ${slot.slot_number || slot.slotNumber}: status="${slot.status}", reserved=${slot.reserved}`);
        });
        
        const formattedSlots = slots.map(slot => {
          const status = (slot.status || '').toLowerCase();
          const reservedField = slot.reserved;
          
          
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
        
        if (formattedSlots.length < expectedCapacity) {
          console.warn(`⚠️ Backend has ${formattedSlots.length} slots but capacity is ${expectedCapacity}`);
          console.log('Adding missing slots locally...');
          
          const existingNumbers = new Set(formattedSlots.map(s => s.slotNumber));
          for (let i = 1; i <= expectedCapacity; i++) {
            if (!existingNumbers.has(i)) {
              formattedSlots.push({
                slotId: null,
                slotNumber: i,
                reserved: false
              });
              console.log(`Added missing slot P${i}`);
            }
          }
          
         
          formattedSlots.sort((a, b) => a.slotNumber - b.slotNumber);
          console.log(`✓ Extended to ${formattedSlots.length} slots`);
        }
        
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
    if (!selectedLocationId) return;
    await loadLocationSlotStatuses(selectedLocationId);
    await initParkingSlots();
    setUnsavedChanges(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      console.log('Updating admin profile...');
      console.log('Admin ID:', adminUser.id);
      console.log('Parking Lot ID:', adminUser.parkingLotId);
      console.log('Edit Data:', editData);
      
      try {
        const response = await fetch(`http://localhost:8080/api/users/${adminUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...adminUser,
            firstname: editData.firstname,
            lastname: editData.lastname,
            email: editData.email
          })
        });

        if (response.ok) {
          console.log('✓ Admin user info updated successfully');
        } else {
          const errorText = await response.text();
          console.warn('Could not update via /api/users:', response.status, errorText);
        }
      } catch (error) {
        console.warn('Admin user update failed (continuing with parking lot update):', error);
      }

      if (adminUser.parkingLotId) {
        console.log('Updating parking lot...');
        console.log('Parking Lot ID:', adminUser.parkingLotId);
        console.log('New capacity:', editData.capacity);
        console.log('New name:', editData.parkingLotName);
        
        let updateSuccess = false;
        
        try {
          const getParkingLotResponse = await fetch(`http://localhost:8080/api/admins/${adminUser.parkingLotId}`);
          
          if (getParkingLotResponse.ok) {
            const parkingLotData = await getParkingLotResponse.json();
            console.log('Current parking lot data:', parkingLotData);
            
            const capacityResponse = await fetch(`http://localhost:8080/api/admins/${adminUser.parkingLotId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...parkingLotData,
                capacity: parseInt(editData.capacity),
                parkingLotName: editData.parkingLotName,
                parking_lot_name: editData.parkingLotName
              })
            });

            if (capacityResponse.ok) {
              console.log('✓ Parking lot updated via /api/admins');
              updateSuccess = true;
            } else {
              const errorText = await capacityResponse.text();
              console.error('Failed via /api/admins:', capacityResponse.status, errorText);
            }
          }
        } catch (error) {
          console.error('Error with /api/admins endpoint:', error);
        }
        
        if (!updateSuccess) {
          try {
            console.log('Trying /api/admin/parking-lots endpoint...');
            const allLotsResponse = await fetch('http://localhost:8080/api/admin/parking-lots');
            
            if (allLotsResponse.ok) {
              const allLots = await allLotsResponse.json();
              const currentLot = allLots.find(lot => 
                (lot.admin_id || lot.staffID || lot.staff_id || lot.id) === adminUser.parkingLotId
              );
              
              if (currentLot) {
                console.log('Found parking lot in all lots:', currentLot);
                const lotId = currentLot.admin_id || currentLot.staffID || currentLot.staff_id || currentLot.id;
                
                const updateResponse = await fetch(`http://localhost:8080/api/admin/parking-lots/${lotId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...currentLot,
                    capacity: parseInt(editData.capacity),
                    parkingLotName: editData.parkingLotName,
                    parking_lot_name: editData.parkingLotName
                  })
                });
                
                if (updateResponse.ok) {
                  console.log('✓ Parking lot updated via /api/admin/parking-lots');
                  updateSuccess = true;
                } else {
                  const errorText = await updateResponse.text();
                  console.error('Failed via /api/admin/parking-lots:', updateResponse.status, errorText);
                }
              }
            }
          } catch (error) {
            console.error('Error with /api/admin/parking-lots endpoint:', error);
          }
        }
        
        if (!updateSuccess) {
          console.warn('⚠️ Could not update parking lot capacity via any endpoint');
          console.warn('The capacity change will be saved locally but may not persist in the backend');
        } else {
          console.log('✓ Parking lot capacity updated successfully!');
        }
      }

      if (adminUser.parkingLotId && editData.capacity) {
        const newCapacity = parseInt(editData.capacity);
        console.log('Syncing parking slots to new capacity:', newCapacity);
        
        try {
          const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${adminUser.parkingLotId}`);
          
          if (slotsResponse.ok) {
            const existingSlots = await slotsResponse.json();
            const currentCount = existingSlots.length;
            console.log('Current slot count:', currentCount, 'New capacity:', newCapacity);
            
            if (newCapacity > currentCount) {
              const slotsToCreate = newCapacity - currentCount;
              console.log(`Creating ${slotsToCreate} new slots (from ${currentCount + 1} to ${newCapacity})...`);
              
              const createPromises = [];
              for (let i = currentCount + 1; i <= newCapacity; i++) {
                const promise = fetch('http://localhost:8080/api/parking-slots', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    admin_id: adminUser.parkingLotId,
                    slot_number: i,
                    status: 'vacant',
                    reserved: false
                  })
                }).then(response => {
                  if (response.ok) {
                    console.log(`✓ Created slot ${i}`);
                    return true;
                  } else {
                    console.error(`Failed to create slot ${i}:`, response.status);
                    return false;
                  }
                }).catch(error => {
                  console.error(`Error creating slot ${i}:`, error);
                  return false;
                });
                
                createPromises.push(promise);
              }
              
              const results = await Promise.all(createPromises);
              const successCount = results.filter(r => r).length;
              console.log(`✓ Successfully created ${successCount} out of ${slotsToCreate} slots`);
              
              if (successCount === 0) {
                console.warn('⚠️ Backend slot creation not supported. Extending slots locally...');
                const currentSlots = [...existingSlots];
                for (let i = currentCount + 1; i <= newCapacity; i++) {
                  currentSlots.push({
                    slot_id: null,
                    slotId: null,
                    slot_number: i,
                    slotNumber: i,
                    status: 'vacant',
                    reserved: false,
                    admin_id: adminUser.parkingLotId
                  });
                }
                
                const formattedSlots = currentSlots.map(slot => ({
                  slotId: slot.slot_id || slot.slotId,
                  slotNumber: slot.slot_number || slot.slotNumber,
                  reserved: (slot.status || '').toLowerCase() === 'occupied' || slot.reserved === true
                }));
                setLocationSlots(formattedSlots);
                console.log('✓ Extended slots locally to', newCapacity);
              }
            }
            else if (newCapacity < currentCount) {
              console.log(`Reducing slots from ${currentCount} to ${newCapacity}...`);
              const slotsToRemove = existingSlots
                .filter(s => (s.status || '').toLowerCase() === 'vacant' && s.reserved !== true)
                .sort((a, b) => (b.slot_number || b.slotNumber) - (a.slot_number || a.slotNumber))
                .slice(0, currentCount - newCapacity);
              
              for (const slot of slotsToRemove) {
                try {
                  const slotId = slot.slot_id || slot.slotId;
                  const deleteResponse = await fetch(`http://localhost:8080/api/parking-slots/${slotId}`, {
                    method: 'DELETE'
                  });
                  
                  if (deleteResponse.ok) {
                    console.log(`✓ Deleted slot ${slot.slot_number || slot.slotNumber}`);
                  } else {
                    console.error(`Failed to delete slot ${slotId}:`, deleteResponse.status);
                  }
                } catch (error) {
                  console.error(`Error deleting slot:`, error);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error syncing parking slots:', error);
        }
      }

      const updatedUser = {
        ...adminUser,
        firstname: editData.firstname,
        lastname: editData.lastname,
        email: editData.email,
        parkingLotName: editData.parkingLotName,
        capacity: editData.capacity
      };

      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setAdminUser(updatedUser);
      
      console.log('✓ Profile saved locally:', updatedUser);
      
      setProfileSuccess('Profile and parking capacity updated successfully!');
      setIsEditingProfile(false);
      
      console.log('Refreshing parking data...');
      
      if (activeSection === 'spaces') {
        const newCapacity = parseInt(editData.capacity);
        const currentSlotCount = locationSlots.length;
        
        console.log('Currently in parking spaces view. Updating from', currentSlotCount, 'to', newCapacity, 'slots');
        
        if (newCapacity > currentSlotCount) {
          const newSlots = [...locationSlots];
          for (let i = currentSlotCount + 1; i <= newCapacity; i++) {
            newSlots.push({
              slotId: null,
              slotNumber: i,
              reserved: false
            });
          }
          setLocationSlots(newSlots);
          console.log('✓ Display updated to show', newSlots.length, 'slots');
        } else if (newCapacity < currentSlotCount) {
          const remainingSlots = locationSlots.slice(0, newCapacity);
          setLocationSlots(remainingSlots);
          console.log('✓ Display reduced to', remainingSlots.length, 'slots');
        }
      }
      
      await initParkingSlots();
      
      setTimeout(async () => {
        if (selectedLocationId || adminUser.parkingLotId) {
          const locationId = selectedLocationId || adminUser.parkingLotId;
          console.log('Reloading slots from backend for location:', locationId);
          await loadLocationSlotStatuses(locationId);
          console.log('✓ Slots refreshed from backend');
        }
      }, 1000);
    } catch (error) {
      console.error('Profile update error:', error);
      setProfileError(error.message || 'Failed to update profile');
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setProfileError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setProfileError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setProfileError('New password must be different from current password');
      return;
    }

    try {
      const loginResponse = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminUser.email,
          password: passwordData.currentPassword
        })
      });

      if (!loginResponse.ok) {
        setProfileError('Current password is incorrect');
        return;
      }

      const updateResponse = await fetch(`http://localhost:8080/api/users/${adminUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...adminUser,
          password: passwordData.newPassword 
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update password');
      }

      setProfileSuccess('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      setProfileError(error.message || 'Failed to change password');
    }
  };

 
  const handleConfirmBooking = (bookingId) => {
    setBookingToConfirm(bookingId);
    setIsConfirmModalOpen(true);
  };

  
  const executeConfirmation = async () => {
    if (!bookingToConfirm) return;
    
    setIsProcessing(true);
    const bookingId = bookingToConfirm;

    try {
      console.log('Confirming booking ID:', bookingId);
      const booking = bookings.find(b => (b.booking_id || b.id) === bookingId);
      
      if (!booking) {
        alert('Booking not found in list');
        setIsConfirmModalOpen(false);
        setIsProcessing(false);
        return;
      }

      try {
        await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'confirmed' }),
        });
      } catch (backendError) {
        console.warn('Backend update failed, continuing with local update...', backendError);
      }
      
      if (booking.parking_lot_id) {
        const confirmedBookingsKey = `confirmedBookings_${booking.parking_lot_id}`;
        const existingConfirmed = JSON.parse(localStorage.getItem(confirmedBookingsKey) || '[]');
        if (!existingConfirmed.includes(bookingId)) {
          existingConfirmed.push(bookingId);
          localStorage.setItem(confirmedBookingsKey, JSON.stringify(existingConfirmed));
        }
      }

      const loc = parkingSlots.find(p => p.id === booking.parking_lot_id);
      if (loc) {
        try {
          const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${loc.id}`);
          if (slotsResponse.ok) {
            const slots = await slotsResponse.json();
            const vacantSlot = slots.find(s => (s.status || '').toLowerCase() === 'vacant');
            
            if (vacantSlot) {
              const slotId = vacantSlot.slot_id || vacantSlot.slotId;
              await fetch(`http://localhost:8080/api/parking-slots/${slotId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'occupied' }),
              });
            }
          }
        } catch (slotError) {
          console.error('Failed to update parking slot:', slotError);
        }
      }

      const updatedBookings = bookings.map(b => {
        if ((b.booking_id || b.id) === bookingId) {
          return { ...b, status: 'confirmed' };
        }
        return b;
      });
      setBookings(updatedBookings);
      
      await initParkingSlots(); 
      if (booking.parking_lot_id) {
         await loadLocationSlotStatuses(booking.parking_lot_id);
      }
      
      setIsConfirmModalOpen(false);
      setShowSuccess(true);
      setBookingToConfirm(null);

    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Failed to confirm booking');
      setIsConfirmModalOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteBooking = (bookingId) => {
    setBookingToDelete(bookingId);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!bookingToDelete) return;
    
    setIsDeleting(true);
    const bookingId = bookingToDelete;

    try {
      const booking = bookings.find(b => (b.booking_id || b.id) === bookingId);
      
      const response = await fetch(`http://localhost:8080/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }

      if (booking && booking.status === 'confirmed' && booking.parking_lot_id) {
        const confirmedBookingsKey = `confirmedBookings_${booking.parking_lot_id}`;
        const existingConfirmed = JSON.parse(localStorage.getItem(confirmedBookingsKey) || '[]');
        const updatedConfirmed = existingConfirmed.filter(id => id !== bookingId);
        localStorage.setItem(confirmedBookingsKey, JSON.stringify(updatedConfirmed));
      }

      // --- Admin Logic: Free up Parking Slot ---
      if (booking && booking.status === 'confirmed') {
        const loc = parkingSlots.find(p => p.id === booking.parking_lot_id);
        if (loc) {
          try {
            // Get all occupied slots and free the first one
            const slotsResponse = await fetch(`http://localhost:8080/api/parking-slots/${loc.id}`);
            if (slotsResponse.ok) {
              const slots = await slotsResponse.json();
              const occupiedSlot = slots.find(s => s.status === 'occupied');
              
              if (occupiedSlot) {
                await fetch(`http://localhost:8080/api/parking-slots/${occupiedSlot.slot_id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
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
      initParkingSlots();
      setIsDeleteModalOpen(false);
      setBookingToDelete(null);

    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const currentMonthKey = new Date().toISOString().slice(0, 7); 
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
            className={`admin-nav-item ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >Profile</button>
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
              <span>Welcome, {adminUser?.firstname || 'Admin'}</span>
              <span className="role-tag">Admin</span>
            </div>
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
                  onClick={async () => {
                    console.log('Refreshing slots...');
                    await initParkingSlots();
                    await loadLocationSlotStatuses(selectedLocationId);
                    console.log('✓ Slots refreshed');
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

          {activeSection === 'profile' && (
            <div className="section-block">
              <h2 className="section-title">Admin Profile</h2>
              
              {profileError && <div className="alert alert-error">{profileError}</div>}
              {profileSuccess && <div className="alert alert-success">{profileSuccess}</div>}

              <div className="profile-section">
                <div className="profile-header-admin">
                  <div className="profile-avatar-admin">
                    {adminUser?.firstname?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3>{adminUser?.firstname} {adminUser?.lastname}</h3>
                    <p>{adminUser?.email}</p>
                    <span className="role-tag">Admin</span>
                  </div>
                </div>

                <div className="profile-forms">
                  <div className="profile-form-section">
                    <div className="section-header">
                      <h3>Personal & Parking Lot Information</h3>
                      {!isEditingProfile && (
                        <button className="btn-edit" onClick={() => setIsEditingProfile(true)}>
                          Edit Profile
                        </button>
                      )}
                    </div>

                    {isEditingProfile ? (
                      <form onSubmit={handleProfileUpdate} className="edit-form">
                        <div className="form-row">
                          <div className="form-group">
                            <label>First Name</label>
                            <input
                              type="text"
                              name="firstname"
                              value={editData.firstname}
                              onChange={handleEditChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Last Name</label>
                            <input
                              type="text"
                              name="lastname"
                              value={editData.lastname}
                              onChange={handleEditChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            name="email"
                            value={editData.email}
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Parking Lot Name</label>
                          <input
                            type="text"
                            name="parkingLotName"
                            value={editData.parkingLotName}
                            onChange={handleEditChange}
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Parking Lot Capacity (Total Slots)</label>
                          <input
                            type="number"
                            name="capacity"
                            value={editData.capacity}
                            onChange={handleEditChange}
                            min="1"
                            required
                          />
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="btn-save">Save Changes</button>
                          <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={() => {
                              setIsEditingProfile(false);
                              setEditData({
                                firstname: adminUser.firstname || '',
                                lastname: adminUser.lastname || '',
                                email: adminUser.email || '',
                                parkingLotName: adminUser.parkingLotName || '',
                                capacity: adminUser.capacity || ''
                              });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="profile-display">
                        <div className="info-row">
                          <span className="info-label">First Name:</span>
                          <span className="info-value">{adminUser?.firstname}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Last Name:</span>
                          <span className="info-value">{adminUser?.lastname}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Email:</span>
                          <span className="info-value">{adminUser?.email}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Parking Lot Name:</span>
                          <span className="info-value">{adminUser?.parkingLotName || parkingSlots[0]?.name || 'N/A'}</span>
                        </div>
                        <div className="info-row">
                          <span className="info-label">Total Capacity:</span>
                          <span className="info-value">{parkingSlots[0]?.totalSlots || adminUser?.capacity || 'N/A'} slots</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="profile-form-section">
                    <div className="section-header">
                      <h3>Change Password</h3>
                      {!showPasswordChange && (
                        <button className="btn-edit" onClick={() => setShowPasswordChange(true)}>
                          Change Password
                        </button>
                      )}
                    </div>

                    {showPasswordChange && (
                      <form onSubmit={handleChangePasswordSubmit} className="password-form">
                        <div className="form-group">
                          <label>Current Password</label>
                          <input
                            type="password"
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter current password"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>New Password</label>
                          <input
                            type="password"
                            name="newPassword"
                            value={passwordData.newPassword}
                            onChange={handlePasswordChange}
                            placeholder="Enter new password"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label>Confirm New Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={passwordData.confirmPassword}
                            onChange={handlePasswordChange}
                            placeholder="Confirm new password"
                            required
                          />
                        </div>
                        <div className="form-actions">
                          <button type="submit" className="btn-save">Update Password</button>
                          <button 
                            type="button" 
                            className="btn-cancel" 
                            onClick={() => {
                              setShowPasswordChange(false);
                              setPasswordData({
                                currentPassword: '',
                                newPassword: '',
                                confirmPassword: ''
                              });
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <ConfirmationModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Booking?"
        message="Are you sure? This will remove the booking and free up the parking slot if it was reserved."
        isLoading={isDeleting}
      />

      <AskModal 
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={executeConfirmation}
        title="Confirm Booking Request"
        message="Are you sure you want to confirm this booking? This will mark a parking slot as occupied."
        isLoading={isProcessing}
      />

      <SuccessModal 
        isOpen={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Booking Confirmed"
        message="The booking has been approved and the slot is now reserved."
      />
    </div>
  );
}
