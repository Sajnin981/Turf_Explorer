// Turf Details Component
// Purpose: Display detailed information about a specific turf and allow users to book it
// Features: View turf details, select date and time slot, create booking

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTurfById, getTurfSlots } from '../../services/turfService';
import { createBooking } from '../../services/bookingService';
import { createPaymentSession } from '../../services/paymentService';
import { isLoggedIn as checkLoggedIn, getRole } from '../../services/authService';
import { useNotification } from '../../context/NotificationContext';
import './TurfDetails.css';

const TurfDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useNotification();

  const [turf, setTurf] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [bookedBooking, setBookedBooking] = useState(null);
  const [error, setError] = useState('');
  const currentRole = getRole();
  const isBookingRestrictedRole = currentRole === 'admin' || currentRole === 'owner';

  function getErrorMessage(err, fallback) {
    if (err && err.response && err.response.data && err.response.data.message) {
      return err.response.data.message;
    }
    return fallback;
  }

  function getSlotButtonClass(isSelected) {
    if (isSelected) {
      return 'slot-btn selected';
    }
    return 'slot-btn';
  }

  function getBookingTotalPrice() {
    if (!selectedSlot) {
      return turf.pricePerHour;
    }
    if (selectedSlot.price) {
      return selectedSlot.price;
    }
    return turf.pricePerHour;
  }

  useEffect(function() {
    async function fetchData() {
      setLoading(true);
      try {
        const [turfData, slotsData] = await Promise.all([
          getTurfById(id),
          getTurfSlots(id)
        ]);
        setTurf(turfData);
        if (Array.isArray(slotsData)) {
          setSlots(slotsData);
        } else {
          setSlots([]);
        }
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
      showInfo('Please log in first to make a booking.');
      navigate('/login');
      return;
    }
    if (isBookingRestrictedRole) {
      showError('Admins and owners cannot book turfs.');
      return;
    }
    if (!selectedDate) {
      showInfo('Please select a date.');
      return;
    }
    if (!selectedSlot) {
      showInfo('Please select a time slot.');
      return;
    }

    setBookingLoading(true);
    try {
      const createdBooking = await createBooking(turf.id, selectedSlot.id, selectedDate);
      setBookedBooking(createdBooking);
      showSuccess('Booking created successfully. You can proceed to payment.');
    } catch (err) {
      const msg = getErrorMessage(err, 'This time slot is no longer available. Please select another.');
      showError(msg);
    } finally {
      setBookingLoading(false);
    }
  }

  async function handlePayNow() {
    if (!bookedBooking || !bookedBooking.id) {
      showInfo('Booking information not found. Please open My Bookings and try payment there.');
      return;
    }

    setPaymentLoading(true);
    try {
      localStorage.setItem('pendingPaymentBookingId', String(bookedBooking.id));
      const session = await createPaymentSession(bookedBooking.id);
      if (!session || !session.bkashURL) {
        throw new Error('The bKash payment link is unavailable. Please try again.');
      }
      window.location.href = session.bkashURL;
    } catch (err) {
      localStorage.removeItem('pendingPaymentBookingId');
      const msg = getErrorMessage(err, 'Unable to initiate payment. Please try again.');
      showError(msg);
    } finally {
      setPaymentLoading(false);
    }
  }

  function handleBackToTurfs() {
    navigate('/turfs');
  }

  function handleDateChange(event) {
    setSelectedDate(event.target.value);
    setSelectedSlot(null);
    setBookedBooking(null);
  }

  function handleSlotSelect(slot) {
    setSelectedSlot(slot);
    setBookedBooking(null);
  }

  if (loading) {
    return (
      <div className="turf-details">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading Turf Details</h2>
        </div>
      </div>
    );
  }

  if (error || !turf) {
    const detailsErrorMessage = error || 'This turf could not be loaded right now.';
    return (
      <div className="turf-details">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2 style={{ color: '#e74c3c' }}>Unable To Load Turf Details</h2>
          <p>{detailsErrorMessage}</p>
          <button className="btn btn-primary" onClick={handleBackToTurfs} style={{ marginTop: '20px' }}>
            Back To Turfs
          </button>
        </div>
      </div>
    );
  }

  let hasTurfImage = false;
  if (turf && turf.image) {
    hasTurfImage = true;
  }

  let turfAvailabilityClass = 'unavailable';
  let turfAvailabilityText = '✗ Unavailable';
  if (turf && turf.available) {
    turfAvailabilityClass = 'available';
    turfAvailabilityText = '✓ Available';
  }

  let turfPricePerHour = turf.pricePerHour;
  if (turf && turf.price) {
    turfPricePerHour = turf.price;
  }

  let slotSummaryText = 'No slots available';
  const safeSlots = Array.isArray(slots) ? slots : [];
  if (safeSlots.length > 0) {
    slotSummaryText = `${safeSlots.length} slots available`;
  }

  let bookingButtonLabel = 'Confirm Booking';
  if (bookingLoading) {
    bookingButtonLabel = 'Booking In Progress';
  } else if (!turf.available) {
    bookingButtonLabel = 'Currently Unavailable';
  }

  return (
    <div className="turf-details">
      {/* Back Button */}
      <div className="details-hero">
        <div className="container">
          <button className="back-btn" onClick={handleBackToTurfs}>
            {"\u2190"} Back To Turfs
          </button>
        </div>
      </div>

      <div className="container">
        <div className="details-content">
          {/* Turf Image */}
          <div className="details-image-section">
            <div className="details-image">
              {hasTurfImage ? (
                <img
                  src={turf.image}
                  alt={turf.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '12px',
                    fontSize: '80px'
                  }}
                >
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
                <span className={`status ${turfAvailabilityClass}`}>
                  {turfAvailabilityText}
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
              <span className="info-text price-text">Tk {turfPricePerHour} per hour</span>
            </div>

            <div className="info-item">
              <span className="info-icon">{"\uD83D\uDD51"}</span>
              <span className="info-text">{slotSummaryText}</span>
            </div>

            <div className="description">
              <h3>About This Turf</h3>
              <p>{turf.description}</p>
            </div>

            {/* Booking Section with Date and Time Selection */}
            {!isBookingRestrictedRole && (
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
                        {safeSlots.length > 0 ? safeSlots.map(function(slot) {
                          const isSelected = selectedSlot && selectedSlot.id === slot.id;
                          return (
                            <button
                              key={slot.id}
                              className={getSlotButtonClass(isSelected)}
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
                        <span>Tk {getBookingTotalPrice()}</span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    className="btn btn-primary book-btn"
                    onClick={handleBooking}
                    disabled={!turf.available || !selectedDate || !selectedSlot || bookingLoading || paymentLoading}
                  >
                    {bookingButtonLabel}
                  </button>

                  {bookedBooking && (
                    <div className="post-booking-card">
                      <h3>Booking Created</h3>
                      <p>Your slot is reserved with pending payment. Complete payment to confirm the booking.</p>
                      <div className="post-booking-actions">
                        <button
                          className="btn btn-primary"
                          onClick={handlePayNow}
                          disabled={paymentLoading}
                        >
                          {paymentLoading ? 'Redirecting To bKash' : 'Pay Now'}
                        </button>
                        <button
                          className="btn btn-secondary"
                          onClick={function() { navigate('/my-bookings'); }}
                          disabled={paymentLoading}
                        >
                          Pay Later
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TurfDetails;
