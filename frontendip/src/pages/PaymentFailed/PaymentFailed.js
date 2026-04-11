import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyBookings } from '../../services/bookingService';
import './PaymentResult.css';

const PaymentFailed = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(function() {
    let isMounted = true;

    async function loadBookingStatus() {
      setLoading(true);
      try {
        const bookingIdFromQuery = searchParams.get('bookingId');
        const pendingBookingId = localStorage.getItem('pendingPaymentBookingId');
        const bookingId = Number(bookingIdFromQuery || pendingBookingId);

        if (!bookingId) {
          return;
        }

        const bookings = await getMyBookings();
        const matchedBooking = bookings.find(function(item) {
          return item.id === bookingId;
        });

        if (isMounted && matchedBooking) {
          setBooking(matchedBooking);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadBookingStatus();

    return function() {
      isMounted = false;
    };
  }, [searchParams]);

  function formatStatus(value) {
    if (!value) {
      return 'Pending';
    }
    return value.charAt(0) + value.slice(1).toLowerCase();
  }

  return (
    <div className="payment-result-page">
      <div className="payment-result-card failed">
        <h1>Payment Cancelled</h1>
        <p>You left Stripe checkout before completing payment. Your booking remains pending.</p>

        {loading ? (
          <p className="payment-status-text">Checking booking status...</p>
        ) : (
          <div className="payment-status-box">
            <div className="payment-status-row">
              <span>Booking Status</span>
              <strong>{formatStatus(booking && booking.status)}</strong>
            </div>
            <div className="payment-status-row">
              <span>Payment Status</span>
              <strong>{formatStatus(booking && booking.paymentStatus)}</strong>
            </div>
          </div>
        )}

        <button className="payment-result-btn" onClick={function() { navigate('/my-bookings'); }}>
          Back to My Bookings
        </button>
      </div>
    </div>
  );
};

export default PaymentFailed;
