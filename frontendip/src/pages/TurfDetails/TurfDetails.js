// Turf Details Component
// Purpose: Display detailed information about a specific turf and allow users to book it
// Features: View turf details, select date and time slot, create booking

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTurfById, getTurfSlots } from '../../services/turfService';
import { createBooking } from '../../services/bookingService';
import { isLoggedIn as checkLoggedIn, getRole } from '../../services/authService';
import './TurfDetails.css';

const TurfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf, setTurf] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(function() {
    async function fetchData() {
      setLoading(true);
      try {
        const [turfData, slotsData] = await Promise.all([
          getTurfById(id),
          getTurfSlots(id)
        ]);
        setTurf(turfData);
        setSlots(slotsData.filter(function(s) { return s.status === 'AVAILABLE'; }));
      } catch (err) {
        setError('Turf not found or failed to load.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const today = new Date().toISOString().split('T')[0];

  async function handleBooking() {
    if (!checkLoggedIn()) {
      alert('Please login first to make a booking');
      navigate('/login');
      return;
    }
    if (getRole() === 'admin') {
      alert('Admins cannot book turfs.');
      return;
    }
    if (!selectedDate) {
      alert('Please select a date');
      return;
    }
    if (!selectedSlot) {
      alert('Please select a time slot');
      return;
    }

    setBookingLoading(true);
    try {
      await createBooking(turf.id, selectedSlot.id, selectedDate);
      alert(`Booking confirmed!\n\nTurf: ${turf.name}\nDate: ${selectedDate}\nTime: ${selectedSlot.startTime} - ${selectedSlot.endTime}`);
      navigate('/my-bookings');
    } catch (err) {
      const msg = err.response?.data?.message || 'Booking failed. The slot may already be taken.';
      alert(msg);
    } finally {
      setBookingLoading(false);
    }
  }

  function handleBackToTurfs() {
    navigate('/turfs');
  }

  function handleDateChange(event) {
    setSelectedDate(event.target.value);
    setSelectedSlot(null);
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
  }

  if (loading) {
    return (
      <div className="turf-details">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (error || !turf) {
    return (
      <div className="turf-details">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2 style={{ color: '#e74c3c' }}>{error || 'Turf not found'}</h2>
          <button className="btn btn-primary" onClick={handleBackToTurfs} style={{ marginTop: '20px' }}>
            Back to Turfs
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="turf-details">
      {/* Back Button */}
      <div className="details-hero">
        <div className="container">
          <button className="back-btn" onClick={handleBackToTurfs}>
            {"\u2190"} Back to Turfs
          </button>
        </div>
      </div>

      <div className="container">
        <div className="details-content">
          {/* Turf Image */}
          <div className="details-image-section">
            <div className="details-image">
              {turf.image ? (
                <img 
                  src={turf.image} 
                  alt={turf.name} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} 
                />
              ) : (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f0f0f0',
                  borderRadius: '12px',
                  fontSize: '80px'
                }}>
                  {"\uD83C\uDFDF"}
                </div>
              )}
            </div>
          </div>

          {/* Turf Info */}
          <div className="details-info-section">
            <div className="info-header">
              <h1 className="details-title">{turf.name}</h1>
              <div className="info-meta">
                <span className="rating">{"\u2B50"} {turf.rating}</span>
                <span className={`status ${turf.available ? 'available' : 'unavailable'}`}>
                  {turf.available ? '{"\u2713"} Available' : '{"\u2717"} Unavailable'}
                </span>
              </div>
            </div>

            <div className="info-item">
              <span className="info-icon">{"\uD83D\uDCCD"}</span>
              <span className="info-text">{turf.location}</span>
            </div>

            <div className="info-item">
              <span className="info-icon">{"\u26BD"}</span>
              <span className="info-text">{turf.type}</span>
            </div>

            <div className="info-item">
              <span className="info-icon">Tk</span>
              <span className="info-text price-text">Tk {turf.price || turf.pricePerHour} per hour</span>
            </div>

            <div className="info-item">
              <span className="info-icon">{"\uD83D\uDD51"}</span>
              <span className="info-text">
                {slots.length > 0 ? `${slots.length} slots available` : 'No slots available'}
              </span>
            </div>

            <div className="description">
              <h3>About this Turf</h3>
              <p>{turf.description}</p>
            </div>

            <div className="features">
              <h3>Facilities</h3>
              <div className="features-grid">
                {(turf.features || turf.facilities || []).map(function(feature, index) {
                  return (
                  <div key={index} className="feature-item">
                    <span className="feature-icon">{"\u2713"}</span>
                    <span>{feature}</span>
                  </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section with Date and Time Selection */}
        <div className="booking-section">
          <h2 className="booking-title">Book Your Slot</h2>
          
          <div className="booking-form">
            {/* Date Selection */}
            <div className="form-group">
              <label htmlFor="date-picker">Select Date</label>
              <input 
                type="date" 
                id="date-picker"
                min={today}
                value={selectedDate}
                onChange={handleDateChange}
                className="date-input"
              />
            </div>

            {/* Time Slot Selection */}
            {selectedDate && (
              <div className="form-group">
                <label>Select Time Slot</label>
                <div className="slots-grid">
                  {slots.length > 0 ? slots.map(function(slot) {
                    const isSelected = selectedSlot && selectedSlot.id === slot.id;
                    return (
                      <button
                        key={slot.id}
                        className={`slot-btn ${isSelected ? 'selected' : ''}`}
                        onClick={function() { handleSlotSelect(slot); }}
                      >
                        {slot.startTime} - {slot.endTime}
                        {slot.price && (
                          <span style={{ display: 'block', fontSize: '0.85em' }}>
                            Tk {slot.price}
                          </span>
                        )}
                      </button>
                    );
                  }) : (
                    <p style={{ color: '#999' }}>No available slots for this turf.</p>
                  )}
                </div>
              </div>
            )}

            {/* Booking Summary */}
            {selectedDate && selectedSlot && (
              <div className="booking-summary">
                <h3>Booking Summary</h3>
                <div className="summary-item">
                  <span>Turf:</span>
                  <span>{turf.name}</span>
                </div>
                <div className="summary-item">
                  <span>Date:</span>
                  <span>{selectedDate}</span>
                </div>
                <div className="summary-item">
                  <span>Time:</span>
                  <span>{selectedSlot.startTime} - {selectedSlot.endTime}</span>
                </div>
                <div className="summary-item total">
                  <span>Total:</span>
                  <span>Tk {selectedSlot.price || turf.pricePerHour}</span>
                </div>
              </div>
            )}

            {/* Book Button */}
            <button 
              className="btn btn-primary book-btn"
              onClick={handleBooking}
              disabled={!turf.available || !selectedDate || !selectedSlot || bookingLoading}
            >
              {bookingLoading ? 'Booking...' : !turf.available ? 'Currently Unavailable' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfDetails;
