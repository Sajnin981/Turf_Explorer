// Add Turf Component
// Purpose: Allow users to submit their turf for listing on the platform
// Features: Form to add turf details, submit for admin approval

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitTurf } from '../../services/turfService';
import './AddTurf.css';

const AddTurf = () => {
  const navigate = useNavigate();
  
  // State variables for form fields
  const [name, setName] = useState('');  // Turf name
  const [location, setLocation] = useState('');  // Turf location
  const [type, setType] = useState('');  // Type of turf (5v5, 7v7, etc.)
  const [price, setPrice] = useState('');  // Price per hour
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check user authentication when page loads
  useEffect(function() {
    const userEmail = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userRole = localStorage.getItem('userRole');
    
    if (!userEmail || !isLoggedIn) {
      alert('Please login first to add a turf');
      navigate('/login');
      return;
    }
    
    if (userRole === 'admin') {
      alert('Admins cannot add turfs. This is a user feature.');
      navigate('/admin');
      return;
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await submitTurf({
        name,
        location,
        turfType: type,
        pricePerHour: parseInt(price),
        description,
        imageUrl: imageUrl || null
      });
      alert('Turf submitted! Your turf is waiting for admin approval.');
      navigate('/my-turfs');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit turf. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Handler functions for form inputs
  function handleNameChange(event) {
    setName(event.target.value);
  }

  function handleLocationChange(event) {
    setLocation(event.target.value);
  }

  function handleTypeChange(event) {
    setType(event.target.value);
  }

  function handlePriceChange(event) {
    setPrice(event.target.value);
  }

  function handleDescriptionChange(event) {
    setDescription(event.target.value);
  }

  function handleImageUrlChange(event) {
    setImageUrl(event.target.value);
  }

  function handleCancel() {
    navigate(-1);  // Go back to previous page
  }

  return (
    <div className="add-turf-page">
      <div className="add-turf-container">
        {/* Header */}
        <div className="add-turf-header">
          <h1>🏟️ Add Your Turf</h1>
          <p>Submit your turf for listing</p>
        </div>

        {/* Simple Form */}
        <form className="add-turf-form" onSubmit={handleSubmit}>
          {error && <div style={{ color: '#e74c3c', background: '#fdecea', padding: '10px', borderRadius: '6px', marginBottom: '16px' }}>{error}</div>}
          {/* Turf Name */}
          <div className="form-group">
            <label htmlFor="name">Turf Name *</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g., Green Valley Sports Arena"
              required
            />
          </div>

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={handleLocationChange}
              placeholder="e.g., Nasirabad, Chittagong"
              required
            />
          </div>

          {/* Turf Type */}
          <div className="form-group">
            <label htmlFor="type">Turf Type *</label>
            <select
              id="type"
              value={type}
              onChange={handleTypeChange}
              required
            >
              <option value="">Select Type</option>
              <option value="5v5 Football">5v5 Football</option>
              <option value="7v7 Football">7v7 Football</option>
              <option value="Cricket Turf">Cricket Turf</option>
              <option value="Multi-Sport">Multi-Sport</option>
            </select>
          </div>

          {/* Price */}
          <div className="form-group">
            <label htmlFor="price">Price per Hour (৳) *</label>
            <input
              type="number"
              id="price"
              value={price}
              onChange={handlePriceChange}
              placeholder="e.g., 1500"
              min="100"
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              value={description}
              onChange={handleDescriptionChange}
              rows="4"
              placeholder="Describe your turf..."
              required
            />
          </div>

          {/* Image Upload */}
          <div className="form-group">
            <label htmlFor="imageUrl">Turf Image URL (Optional)</label>
            <input
              type="text"
              id="imageUrl"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="Paste image URL or upload when backend is ready"
            />
            <small style={{ color: '#666', fontSize: '0.85em', display: 'block', marginTop: '5px' }}>
              💡 Image upload feature will be fully functional when backend is integrated
            </small>
          </div>

          {/* Submit Button */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Turf'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTurf;
