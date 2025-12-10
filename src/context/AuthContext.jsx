import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('currentUser')) || null; } catch { return null; }
  });

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Invalid email or password' };
      }

  
      const userObj = {
        id: data.userID || data.id || data.user_id || data.userId || data.staffID,
        email: data.email,
        firstname: data.firstname,
        lastname: data.lastname,
        role: data.role || null
      };
      
      console.log('Login response data:', data);
      console.log('Created user object:', userObj);
      
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      setUser(userObj);
      return { success: true, user: userObj };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const register = async (userData) => {
    console.log('Registering user:', userData);
    try {
      const response = await fetch('http://localhost:8080/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstname: userData.firstname,
          lastname: userData.lastname,
          email: userData.email,
          password: userData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.message || 'Registration failed' };
      }

      return { success: true, message: 'Registration successful' };
    } catch (error) {
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const createAdminParkingLot = async (adminData) => {
    console.log('Creating admin parking lot with data:', adminData);
    
    
    const requestBody = {
     
      user_id: adminData.user_id,
      userId: adminData.user_id,
      
  
      email: adminData.email,
      
      
      password: adminData.password,
      Password: adminData.password,
      
   
      firstname: adminData.firstname,
      firstName: adminData.firstname,
      first_name: adminData.firstname,
      
    
      lastname: adminData.lastname,
      lastName: adminData.lastname,
      last_name: adminData.lastname,
      
     
      parkingLotName: adminData.parking_lot_name,
      parking_lot_name: adminData.parking_lot_name,
      
    
      capacity: adminData.capacity,
      
     
      price: adminData.price,
      rate: adminData.price,
      
     
      role: 'admin',
      Role: 'admin'
    };
    
    console.log('Request body being sent:', requestBody);
    
    try {
      const response = await fetch('http://localhost:8080/api/admins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('Server response status:', response.status);
      console.log('Server response data:', data);

      if (!response.ok) {
        console.error('Failed to create parking lot:', data);
        return { success: false, message: data.message || 'Failed to create admin parking lot' };
      }

    
      const staffID = data.staffID || data.staff_id || data.admin_id || data.adminId;
      console.log('Admin created with staffID:', staffID);

      return { success: true, message: 'Admin parking lot created successfully', staffID: staffID };
    } catch (error) {
      console.error('Network error:', error);
      return { success: false, message: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('currentUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, register, createAdminParkingLot }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
