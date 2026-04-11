// My Bookings Component
// Purpose: Display and manage user's turf bookings
// Features: View bookings, cancel bookings

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../../services/bookingService';
import { createPaymentSession } from '../../services/paymentService';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState(null);

  function getErrorMessage(err, fallback) {
    if (err && err.response && err.response.data && err.response.data.message) {
      return err.response.data.message;
    }
    return fallback;
  }

  function getStatusLower(status) {
    if (status) {
      return status.toLowerCase();
    }
    return 'pending';
  }

  function formatStatusText(status) {
    if (!status) {
      return 'Pending';
    }
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  function getPaymentClassName(paymentStatus) {
    const normalized = (paymentStatus || 'PENDING').toLowerCase();
    return 'detail-value payment-' + normalized;
  }

  function shouldShowPayNowButton(booking) {
    const paymentStatus = booking.paymentStatus;
    const isAlreadyPaid = paymentStatus === 'PAID';
    const isCancelled = booking.status === 'CANCELLED';

    if (isAlreadyPaid) {
      return false;
    }
    if (isCancelled) {
      return false;
    }
    return true;
  }

  function getPayButtonText(bookingId) {
    if (payingBookingId === bookingId) {
      return 'Redirecting...';
    }
    return 'Pay Now';
  }

  useEffect(function() {
    const userRole = localStorage.getItem('userRole');
    if (!localStorage.getItem('isLoggedIn')) {
      alert('Please login first');
      navigate('/login');
      return;
    }
    if (userRole === 'admin' || userRole === 'owner') {
      navigate('/turfs');
      return;
    }
    loadUserBookings();
  }, [navigate]);

  async function loadUserBookings() {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      alert('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await cancelBooking(bookingId);
      alert('Booking cancelled successfully!');
      loadUserBookings();
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to cancel booking.'));
    }
  }

  async function handlePayNow(booking) {
    setPayingBookingId(booking.id);
    try {
      localStorage.setItem('pendingPaymentBookingId', String(booking.id));
      const session = await createPaymentSession(booking.id);
      if (!session || !session.url) {
        throw new Error('Checkout URL not found');
      }

      window.location.href = session.url;
    } catch (err) {
      localStorage.removeItem('pendingPaymentBookingId');
      alert(getErrorMessage(err, 'Failed to start payment. Please try again.'));
    } finally {
      setPayingBookingId(null);
    }
  }

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="bookings-shell" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading bookings...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="bookings-shell">
        {/* Page Header */}
        <div className="bookings-header">
          <h1>My Bookings</h1>
          <p>View and manage all your turf bookings</p>
        </div>

        <div className="bookings-content">
        {/* Show bookings list */}
        <div className="bookings-list">
          {bookings.map(function(booking) {
            const statusLower = getStatusLower(booking.status);
            const shouldShowPayNow = shouldShowPayNowButton(booking);
            return (
            <div key={booking.id} className={`booking-card ${statusLower}`}>
              {/* Booking Info */}
              <div className="booking-info">
                <h3>{booking.turfName}</h3>

                <div className="booking-details">
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{booking.turfLocation || '-'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{booking.bookingDate || '-'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">🕒</span>
                    <span className="detail-label">Time:</span>
                    <span className="detail-value">{booking.slotTime || '-'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">💰</span>
                    <span className="detail-label">Price:</span>
                    <span className="detail-value detail-value-price">{booking.price ? `৳${booking.price}` : '-'}</span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">📋</span>
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-${statusLower}`}>
                      {formatStatusText(booking.status)}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">💳</span>
                    <span className="detail-label">Payment:</span>
                    <span className={getPaymentClassName(booking.paymentStatus)}>
                      {formatStatusText(booking.paymentStatus)}
                    </span>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
              {statusLower !== 'cancelled' && (
                <div className="booking-actions">
                  <button
                    onClick={function() { navigate('/turf/' + booking.turfId); }}
                    className="btn btn-view"
                  >
                    View Turf
                  </button>
                  {shouldShowPayNow && (
                    <button
                      onClick={function() { handlePayNow(booking); }}
                      className="btn btn-primary"
                      disabled={payingBookingId === booking.id}
                    >
                      {getPayButtonText(booking.id)}
                    </button>
                  )}
                  <button
                    onClick={function() { handleCancel(booking.id); }}
                    className="btn btn-cancel"
                  >
                    Cancel Booking
                  </button>
                </div>
              )}
            </div>
            );
          })}

          {bookings.length === 0 && (
            <div className="no-bookings" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📅</div>
              <h2>No Bookings Yet</h2>
              <p>You have not made any bookings. Find a turf and book a slot!</p>
              <button className="btn btn-primary" onClick={function() { navigate('/turfs'); }} style={{ marginTop: '20px' }}>
                Find Turfs
              </button>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default MyBookings;

