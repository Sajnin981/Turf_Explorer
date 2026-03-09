// Profile Component
// Purpose: Display and edit user profile information
// Features: View profile details, edit profile, save changes to localStorage

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  
  // State variables
  const [isEditing, setIsEditing] = useState(false);  // Edit mode flag
  const [name, setName] = useState('');  // User's full name
  const [email, setEmail] = useState('');  // User's email
  const [phone, setPhone] = useState('');  // User's phone number
  const [address, setAddress] = useState('');  // User's address

  // Load user profile data when page loads
  useEffect(function() {
    const userEmail = localStorage.getItem('userEmail');
    const userRole = localStorage.getItem('userRole');
    
    if (!userEmail) {
      alert('Please login first');
      navigate('/login');
      return;
    }
    
    if (userRole === 'admin') {
      alert('Admins do not have user profiles.');
      navigate('/admin');
      return;
    }

    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const userName = localStorage.getItem('userName') || '';
    
    setEmail(userEmail);
    setName(savedProfile.name || userName || '');
    setPhone(savedProfile.phone || '');
    setAddress(savedProfile.address || '');
  }, [navigate]);

  // Function to save profile changes
  function handleSave(event) {
    event.preventDefault();
    
    const profileData = {
      name: name,
      email: email,
      phone: phone,
      address: address
    };
    
    localStorage.setItem('userProfile', JSON.stringify(profileData));
    localStorage.setItem('userName', name);
    
    setIsEditing(false);
    alert('Profile updated successfully!');
  }

  // Handler functions for form inputs
  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handlePhoneChange(event) {
    setPhone(event.target.value);
  }

  function handleAddressChange(event) {
    setAddress(event.target.value);
  }

  function handleStartEditing() {
    setIsEditing(true);
  }

  function handleCancelEditing() {
    setIsEditing(false);
  }

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="profile-header">
        <div className="container">
          <h1>My Profile</h1>
          <p>Manage your account information</p>
        </div>
      </div>

      <div className="container">
        <div className="profile-container">
          {/* Profile Card */}
          <div className="profile-card">
            <div className="profile-icon">👤</div>
            
            {isEditing ? (
              /* Edit Mode */
              <form onSubmit={handleSave} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={handleNameChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="disabled-input"
                  />
                  <small>Email cannot be changed</small>
                </div>

                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="Enter your phone number"
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={address}
                    onChange={handleAddressChange}
                    placeholder="Enter your address"
                    rows="3"
                  />
                </div>

                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCancelEditing}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="profile-view">
                <div className="profile-info">
                  <div className="info-item">
                    <span className="info-label">Full Name:</span>
                    <span className="info-value">{name || 'Not set'}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{email}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Phone:</span>
                    <span className="info-value">{phone || 'Not set'}</span>
                  </div>

                  <div className="info-item">
                    <span className="info-label">Address:</span>
                    <span className="info-value">{address || 'Not set'}</span>
                  </div>
                </div>

                <div className="profile-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={handleStartEditing}
                  >
                    ✏️ Edit Profile
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
