import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { useNavigate } from 'react-router-dom';
import { BsBusFrontFill } from "react-icons/bs";

export default function Profile() {
   const navigate = useNavigate();
   const [user, setUser] = useState(null);
   const [isEditing, setIsEditing] = useState(false);
   const [showPasswordChange, setShowPasswordChange] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [loading, setLoading] = useState(true);

   const [editData, setEditData] = useState({
     firstname: '',
     lastname: '',
     email: ''
   });

   const [passwordData, setPasswordData] = useState({
     currentPassword: '',
     newPassword: '',
     confirmPassword: ''
   });

  // Load user data from localStorage
  useEffect(() => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      try {
        const userData = JSON.parse(currentUser);
        setUser(userData);
        setEditData({
          firstname: userData.firstname || '',
          lastname: userData.lastname || '',
          email: userData.email || ''
        });
        setLoading(false);
      } catch (err) {
        console.error('Error parsing user data:', err);
        setLoading(false);
      }
    } else {
      navigate('/');
      setLoading(false);
    }
  }, [navigate]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!editData.firstname || !editData.lastname || !editData.email) {
      setError('All fields are required');
      return;
    }

    // Update user data in database
    const updatedUser = {
      ...user,
      firstname: editData.firstname,
      lastname: editData.lastname,
      email: editData.email
    };
    
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setUser(updatedUser);
    
    setSuccess('Profile updated successfully!');
    setIsEditing(false);
    
    // TODO: Send update to backend API
    // await fetch(`http://localhost:8080/api/users/${user.id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(updatedUser)
    // });
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      console.log('Attempting to change password for user:', user.id);
      console.log('API endpoint:', `http://localhost:8080/api/users/${user.id}/password`);
      
      // First, verify current password by attempting login
      console.log('Step 1: Verifying current password...');
      const loginResponse = await fetch('http://localhost:8080/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          password: passwordData.currentPassword
        })
      });

      if (!loginResponse.ok) {
        console.error('Current password verification failed:', loginResponse.status);
        setError('Current password is incorrect');
        return;
      }

      console.log('✓ Current password verified');
      
      // Now update the password in backend
      console.log('Step 2: Updating password in database...');
      const updateResponse = await fetch(`http://localhost:8080/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...user,
          password: passwordData.newPassword 
        })
      });

      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('Password update failed:', updateResponse.status, errorText);
        throw new Error('Failed to update password in database');
      }

      console.log('✓ Password updated successfully in database');
      
      // Update local storage (without password for security)
      const updatedUser = {
        ...user
        // Don't store password in localStorage
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      setSuccess('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error:', error);
      setError(error.message || 'Failed to change password. Please try again.');
    }
  };

   if (loading) {
     return <div className="loading">Loading...</div>;
   }

   if (!user) {
     return null;
   }

   return (
     <>
       <nav className="navbar">
         <div className="navbar-left">
           <BsBusFrontFill className="dashboard-logo-icon" />
           <div className="logo">PARKWAY</div>
         </div>
         
       </nav>

       <div className="profile-container">
         <div className="profile-wrapper">
           {/* Back Button */}
          <button className="back-link" onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard')}>
             ← Back to {user?.role === 'admin' ? 'Admin' : 'Dashboard'}
           </button>
           {/* Profile Header */}
           <div className="profile-header">
             <div className="profile-avatar">
               {user?.firstname?.charAt(0).toUpperCase()}
             </div>
             <div className="profile-title">
               <h1>{user?.firstname} {user?.lastname}</h1>
               <p className="profile-email">{user?.email}</p>
             </div>
           </div>

           {/* Messages */}
           {error && <div className="alert alert-error">{error}</div>}
           {success && <div className="alert alert-success">{success}</div>}

           {/* Profile Content */}
           <div className="profile-content">
             {/* Left Section */}
             <div className="profile-left">
               <div className="profile-card">
                 <h2>Personal Information</h2>
                 {!isEditing ? (
                   <div className="profile-info">
                     <div className="info-group">
                       <label>First Name</label>
                       <p>{user?.firstname}</p>
                     </div>
                     <div className="info-group">
                       <label>Last Name</label>
                       <p>{user?.lastname}</p>
                     </div>
                     <div className="info-group">
                       <label>Email</label>
                       <p>{user?.email}</p>
                     </div>
                     <div className="info-group">
                       <label>Role</label>
                       <p>{user?.role || 'User'}</p>
                     </div>
                     <button 
                       className="edit-btn"
                       onClick={() => setIsEditing(true)}
                     >
                       Edit Profile
                     </button>
                   </div>
                 ) : (
                   <form onSubmit={handleSaveProfile} className="edit-form">
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
                     <div className="form-actions">
                       <button type="submit" className="save-btn">Save Changes</button>
                       <button 
                         type="button" 
                         className="cancel-btn"
                         onClick={() => setIsEditing(false)}
                       >
                         Cancel
                       </button>
                     </div>
                   </form>
                 )}
               </div>
             </div>

             {/* Right Section */}
             <div className="profile-right">
               <div className="profile-card">
                 <h2>Security</h2>
                 {!showPasswordChange ? (
                   <div className="security-info">
                     <p>Manage your account security and password</p>
                     <button 
                       className="change-password-btn"
                       onClick={() => setShowPasswordChange(true)}
                     >
                       Change Password
                     </button>
                   </div>
                 ) : (
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
                       <button type="submit" className="save-btn">Update Password</button>
                       <button 
                         type="button" 
                         className="cancel-btn"
                         onClick={() => setShowPasswordChange(false)}
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
       </div>
     </>
   );
}
