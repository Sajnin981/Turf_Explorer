// My Bookings Component
// Purpose: Display and manage user's turf bookings
// Features: View bookings, cancel bookings

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking, initPayment } from '../../services/bookingService';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState(null);

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
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    }
  }

  async function handlePayNow(booking) {
    if (!booking.bookingDate || !booking.turfId || !booking.slotId || !booking.price) {
      alert('Payment details are incomplete for this booking. Please book from turf details again.');
      return;
    }

    setPayingBookingId(booking.id);
    try {
      const payment = await initPayment(booking.turfId, booking.slotId, booking.price, booking.bookingDate);
      if (!payment.gatewayPageURL) {
        throw new Error('Missing gateway URL');
      }
      window.location.href = payment.gatewayPageURL;
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to start payment. Please try again.');
    } finally {
      setPayingBookingId(null);
    }
  }

  if (loading) {
    return (
      <div className="my-bookings-page">
        <div className="container" style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Loading bookings...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      {/* Page Header */}
      <div className="bookings-header">
        <div className="container">
          <h1>My Bookings</h1>
          <p>View and manage all your turf bookings</p>
        </div>
      </div>

      <div className="container">
        {/* Show bookings list */}
        <div className="bookings-list">
          {bookings.map(function(booking) {
            const statusLower = booking.status ? booking.status.toLowerCase() : 'pending';
            return (
            <div key={booking.id} className={`booking-card ${statusLower}`}>
              {/* Status Badge */}
              <div className={`status-badge-booking ${statusLower}`}>
                {statusLower === 'confirmed' && '✅ Confirmed'}
                {statusLower === 'cancelled' && '❌ Cancelled'}
                {statusLower === 'pending' && '⏳ Pending'}
              </div>

              {/* Booking Info */}
              <div className="booking-info">
                <h3>{booking.turfName}</h3>

                <div className="booking-details">
                  {booking.turfLocation && (
                    <div className="detail-item">
                      <span className="detail-icon">📍</span>
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{booking.turfLocation}</span>
                    </div>
                  )}

                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <span className="detail-label">Date:</span>
                    <span className="detail-value">{booking.bookingDate}</span>
                  </div>

                  {booking.slotTime && (
                    <div className="detail-item">
                      <span className="detail-icon">🕒</span>
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">{booking.slotTime}</span>
                    </div>
                  )}

                  {booking.price && (
                    <div className="detail-item">
                      <span className="detail-icon">💰</span>
                      <span className="detail-label">Price:</span>
                      <span className="detail-value">৳{booking.price}</span>
                    </div>
                  )}

                  <div className="detail-item">
                    <span className="detail-icon">📋</span>
                    <span className="detail-label">Status:</span>
                    <span className={`detail-value status-${statusLower}`}>
                      {booking.status ? booking.status.charAt(0) + booking.status.slice(1).toLowerCase() : 'Pending'}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">💳</span>
                    <span className="detail-label">Payment:</span>
                    <span className="detail-value">
                      {booking.paymentStatus ? booking.paymentStatus.charAt(0) + booking.paymentStatus.slice(1).toLowerCase() : 'Pending'}
                    </span>
                  </div>

                  {booking.totalAmount !== undefined && booking.totalAmount !== null && (
                    <div className="detail-item">
                      <span className="detail-icon">🧾</span>
                      <span className="detail-label">Total:</span>
                      <span className="detail-value">৳{booking.totalAmount}</span>
                    </div>
                  )}

                  {booking.paidAmount !== undefined && booking.paidAmount !== null && (
                    <div className="detail-item">
                      <span className="detail-icon">✅</span>
                      <span className="detail-label">Paid:</span>
                      <span className="detail-value">৳{booking.paidAmount}</span>
                    </div>
                  )}

                  {booking.dueAmount !== undefined && booking.dueAmount !== null && booking.dueAmount > 0 && (
                    <div className="detail-item">
                      <span className="detail-icon">⏳</span>
                      <span className="detail-label">Due:</span>
                      <span className="detail-value">৳{booking.dueAmount}</span>
                    </div>
                  )}
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
                  {booking.paymentStatus !== 'SUCCESS' && booking.paymentStatus !== 'PARTIAL' && booking.paymentStatus !== 'FULL' && booking.status !== 'CANCELLED' && (
                    <button
                      onClick={function() { handlePayNow(booking); }}
                      className="btn btn-primary"
                      disabled={payingBookingId === booking.id}
                    >
                      {payingBookingId === booking.id ? 'Redirecting...' : 'Pay 50% to Confirm'}
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
  );
};

export default MyBookings;

