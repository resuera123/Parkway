import React, { useState, useEffect } from 'react';
import '../styles/Profile.css';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
   const navigate = useNavigate();
   const [user, setUser] = useState(null);
   const [isEditing, setIsEditing] = useState(false);
   const [showPasswordChange, setShowPasswordChange] = useState(false);
   const [error, setError] = useState('');
   const [success, setSuccess] = useState('');
   const [loading, setLoading] = useState(true);

   const [editData, setEditData] = useState({
     firstName: '',
     middleInitial: '',
     lastName: '',
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
          firstName: userData.firstName || '',
          middleInitial: userData.middleInitial || '',
          lastName: userData.lastName || '',
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

    if (!editData.firstName || !editData.lastName || !editData.email) {
      setError('All fields are required');
      return;
    }

    // Update user data in localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === user.username);
    
    if (userIndex !== -1) {
      users[userIndex] = {
        ...users[userIndex],
        firstName: editData.firstName,
        middleInitial: editData.middleInitial,
        lastName: editData.lastName,
        email: editData.email
      };
      
      localStorage.setItem('users', JSON.stringify(users));
      const updatedUser = users[userIndex];
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    }
  };

  const handleChangePasswordSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (passwordData.currentPassword !== user.password) {
      setError('Current password is incorrect');
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

    // Update password in localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.username === user.username);
    
    if (userIndex !== -1) {
      users[userIndex].password = passwordData.newPassword;
      
      localStorage.setItem('users', JSON.stringify(users));
      const updatedUser = users[userIndex];
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setSuccess('Password changed successfully!');
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
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
           <div className="logo">PARKWAY</div>
         </div>
         <div className="navbar-right">
           <div className="notification-icon">🔔</div>
           <div className="user-info">
             <span className="username">{user?.firstName || 'User'}</span>
           </div>
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
               {user?.firstName?.charAt(0).toUpperCase()}
             </div>
             <div className="profile-title">
               <h1>{user?.firstName} {user?.middleInitial} {user?.lastName}</h1>
               <p>@{user?.username}</p>
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
                       <p>{user?.firstName}</p>
                     </div>
                     <div className="info-group">
                       <label>Middle Initial</label>
                       <p>{user?.middleInitial || 'N/A'}</p>
                     </div>
                     <div className="info-group">
                       <label>Last Name</label>
                       <p>{user?.lastName}</p>
                     </div>
                     <div className="info-group">
                       <label>Email</label>
                       <p>{user?.email}</p>
                     </div>
                     <div className="info-group">
                       <label>Username</label>
                       <p>{user?.username}</p>
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
                         name="firstName"
                         value={editData.firstName}
                         onChange={handleEditChange}
                         required
                       />
                     </div>
                     <div className="form-group">
                       <label>Middle Initial</label>
                       <input
                         type="text"
                         name="middleInitial"
                         value={editData.middleInitial}
                         onChange={handleEditChange}
                         maxLength="1"
                       />
                     </div>
                     <div className="form-group">
                       <label>Last Name</label>
                       <input
                         type="text"
                         name="lastName"
                         value={editData.lastName}
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
