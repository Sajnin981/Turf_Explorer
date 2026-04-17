// My Bookings Component
// Purpose: Display and manage user's turf bookings
// Features: View bookings, cancel bookings

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyBookings, cancelBooking } from '../../services/bookingService';
import { createPaymentSession, refundBkashTransaction } from '../../services/paymentService';
import { useNotification } from '../../context/NotificationContext';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import './MyBookings.css';

const MyBookings = () => {
  const navigate = useNavigate();
  const { showError, showInfo, showSuccess } = useNotification();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payingBookingId, setPayingBookingId] = useState(null);
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [refundingBookingId, setRefundingBookingId] = useState(null);

  function getErrorMessage(err, fallback) {
    if (err && err.response && err.response.data) {
      const data = err.response.data;

      if (typeof data === 'string' && data.trim()) {
        return data;
      }

      if (data.message && String(data.message).trim()) {
        return data.message;
      }

      if (data.error && String(data.error).trim()) {
        return data.error;
      }
    }

    if (err && err.message && String(err.message).trim()) {
      const normalizedMessage = String(err.message).trim();
      if (normalizedMessage !== 'Network Error') {
        return normalizedMessage;
      }
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
    const normalized = status.toUpperCase();
    if (normalized === 'CONFIRMED') {
      return 'ACTIVE';
    }
    if (normalized === 'REFUNDED') {
      return 'REFUNDED';
    }
    return status.charAt(0) + status.slice(1).toLowerCase();
  }

  function getPaymentClassName(paymentStatus) {
    const normalized = (paymentStatus || 'PENDING').toLowerCase();
    if (normalized === 'refunded') {
      return 'detail-value payment-refunded';
    }
    return 'detail-value payment-' + normalized;
  }

  function getPaymentLabelFromTransactionStatus(transactionStatus) {
    const normalized = (transactionStatus || 'PENDING').toUpperCase();
    if (normalized === 'SUCCESS') {
      return 'PAID';
    }
    if (normalized === 'REFUNDED') {
      return 'REFUNDED';
    }
    if (normalized === 'FAILED') {
      return 'FAILED';
    }
    return 'PENDING';
  }

  function getBookingStartDateTime(booking) {
    if (!booking || !booking.bookingDate || !booking.slotTime) {
      return null;
    }

    const slotTimeParts = booking.slotTime.split(' - ');
    const startTime = (slotTimeParts[0] || '').trim();
    if (!startTime) {
      return null;
    }

    const normalizedTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    return new Date(`${booking.bookingDate}T${normalizedTime}`);
  }

  function isLessThan24HoursBeforeBooking(booking) {
    const bookingStartDateTime = getBookingStartDateTime(booking);
    if (!bookingStartDateTime || Number.isNaN(bookingStartDateTime.getTime())) {
      return false;
    }

    const msUntilBooking = bookingStartDateTime.getTime() - Date.now();
    return msUntilBooking <= 24 * 60 * 60 * 1000;
  }

  function isRefundEligible(booking) {
    const paymentLabel = getPaymentLabelFromTransactionStatus(booking.transactionStatus);
    const hasPaymentIdentifiers = Boolean(booking.paymentId) && Boolean(booking.trxId);
    return booking.status === 'CANCELLED'
      && paymentLabel === 'PAID'
      && hasPaymentIdentifiers
      && !isLessThan24HoursBeforeBooking(booking);
  }

  function isNoRefundCancellation(booking) {
    const paymentLabel = getPaymentLabelFromTransactionStatus(booking.transactionStatus);
    return booking.status === 'CANCELLED' && paymentLabel === 'PAID' && isLessThan24HoursBeforeBooking(booking);
  }

  function isRefunded(booking) {
    return getPaymentLabelFromTransactionStatus(booking.transactionStatus) === 'REFUNDED';
  }

  function getBookingStatusMeta(booking) {
    const status = (booking.status || '').toUpperCase();

    if (status === 'CONFIRMED') {
      return {
        label: 'ACTIVE',
        className: 'status-active'
      };
    }

    if (status === 'CANCELLED') {
      if (isNoRefundCancellation(booking)) {
        return {
          label: 'Cancelled (No Refund Eligible)',
          className: 'status-cancelled-no-refund'
        };
      }

      return {
        label: 'Cancelled',
        className: isRefunded(booking) ? 'status-refunded' : 'status-cancelled'
      };
    }

    return {
      label: formatStatusText(status),
      className: 'status-pending'
    };
  }

  function shouldShowPayNowButton(booking) {
    const paymentStatus = getPaymentLabelFromTransactionStatus(booking.transactionStatus);
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

  function getRefundButtonText(bookingId) {
    if (refundingBookingId === bookingId) {
      return 'Refunding...';
    }
    return 'Claim Refund';
  }

  useEffect(function() {
    const userRole = localStorage.getItem('userRole');
    if (!localStorage.getItem('isLoggedIn')) {
      showInfo('Please login first');
      navigate('/login');
      return;
    }
    if (userRole === 'admin' || userRole === 'owner') {
      navigate('/turfs');
      return;
    }
    loadUserBookings();
  }, [navigate, showInfo]);

  async function loadUserBookings() {
    setLoading(true);
    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      showError('Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(bookingId) {
    try {
      await cancelBooking(bookingId);
      showSuccess('Booking cancelled successfully!');
      loadUserBookings();
    } catch (err) {
      showError(getErrorMessage(err, 'Failed to cancel booking.'));
    }
  }

  function handleOpenCancelModal(bookingId) {
    setCancelBookingId(bookingId);
  }

  function handleCloseCancelModal() {
    setCancelBookingId(null);
  }

  async function handleConfirmCancel() {
    if (!cancelBookingId) {
      return;
    }

    const bookingId = cancelBookingId;
    setCancelBookingId(null);
    await handleCancel(bookingId);
  }

  async function handleRefund(booking) {
    if (!booking || !booking.transactionId) {
      showError('Refund is not available for this booking.');
      return;
    }

    if (refundingBookingId) {
      return;
    }

    setRefundingBookingId(booking.id);
    try {
      const refundResponse = await refundBkashTransaction(booking.transactionId);
      if ((refundResponse.status || '').toUpperCase() !== 'SUCCESS') {
        throw new Error(refundResponse.message || 'Refund failed. Please try again later.');
      }
      showSuccess('Refunded Successfully');
      await loadUserBookings();
    } catch (err) {
      showError(getErrorMessage(err, 'Refund failed. Please try again later.'));
    } finally {
      setRefundingBookingId(null);
    }
  }

  async function handlePayNow(booking) {
    setPayingBookingId(booking.id);
    try {
      localStorage.setItem('pendingPaymentBookingId', String(booking.id));
      const session = await createPaymentSession(booking.id);
      if (!session || !session.bkashURL) {
        throw new Error('bKash URL not found');
      }

      window.location.href = session.bkashURL;
    } catch (err) {
      localStorage.removeItem('pendingPaymentBookingId');
      showError(getErrorMessage(err, 'Failed to start payment. Please try again.'));
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
            const statusMeta = getBookingStatusMeta(booking);
            const shouldShowPayNow = shouldShowPayNowButton(booking);
            const paymentLabel = getPaymentLabelFromTransactionStatus(booking.transactionStatus);
            const canClaimRefund = isRefundEligible(booking);
            return (
            <div key={booking.id} className={`booking-card ${statusMeta.className}`}>
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
                    <span className={`detail-value ${statusMeta.className}`}>
                      {statusMeta.label}
                    </span>
                  </div>

                  <div className="detail-item">
                    <span className="detail-icon">💳</span>
                    <span className="detail-label">Payment:</span>
                    <span className={getPaymentClassName(paymentLabel)}>
                      {formatStatusText(paymentLabel)}
                    </span>
                  </div>

                </div>
              </div>

              {/* Action Buttons */}
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

                {booking.status !== 'CANCELLED' && (
                  <button
                    onClick={function() { handleOpenCancelModal(booking.id); }}
                    className="btn btn-cancel"
                    disabled={Boolean(refundingBookingId)}
                  >
                    Cancel Booking
                  </button>
                )}

                {canClaimRefund && (
                  <button
                    onClick={function() { handleRefund(booking); }}
                    className="btn btn-refund"
                    disabled={refundingBookingId === booking.id}
                  >
                    {getRefundButtonText(booking.id)}
                  </button>
                )}
              </div>

              {booking.status === 'CANCELLED' && isRefunded(booking) && (
                <div className="refund-success-info">
                  Refunded Successfully
                </div>
              )}

              {booking.status === 'CANCELLED' && paymentLabel === 'PAID' && !canClaimRefund && !isRefunded(booking) && (
                <div className="refund-status-info refund-status-no-refund">
                  No refund available for this cancellation.
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

      <ConfirmModal
        isOpen={cancelBookingId !== null}
        message={(() => {
          const selectedBooking = bookings.find(function(item) {
            return item.id === cancelBookingId;
          });

          if (selectedBooking && isLessThan24HoursBeforeBooking(selectedBooking)) {
            return 'You are cancelling less than 24 hours before your booking. You will not receive a refund. Proceed?';
          }

          return 'Are you sure you want to cancel this booking?';
        })()}
        onConfirm={handleConfirmCancel}
        onCancel={handleCloseCancelModal}
      />
    </div>
  );
};

export default MyBookings;

