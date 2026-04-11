import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyBookings } from '../../services/bookingService';
import api from '../../services/api';
import './PaymentResult.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationError, setConfirmationError] = useState(null);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(null);

  useEffect(function() {
    let isMounted = true;

    async function confirmPaymentAndLoadBooking() {
      setLoading(true);
      setConfirmationError(null);
      setConfirmationSuccess(false);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        console.log('PaymentSuccess: Received sessionId from URL:', sessionId);

        if (!sessionId) {
          console.error('PaymentSuccess: session_id is missing from URL');
          setConfirmationError('Payment session ID is missing. Please contact support.');
          setLoading(false);
          return;
        }

        // Step 1: Confirm payment with backend
        console.log('PaymentSuccess: Calling backend to confirm payment for sessionId:', sessionId);
        const response = await api.post('http://localhost:8080/api/payment/success', null, {
          params: { session_id: sessionId }
        });
        console.log('PaymentSuccess: Backend confirmation status:', response.status);
        console.log('PaymentSuccess: Backend confirmation payload:', response.data);
        setPaidAmount(response.data && response.data.amount != null ? Number(response.data.amount) : null);
        console.log('PaymentSuccess: Backend confirmation successful');
        setConfirmationSuccess(true);

        // Step 2: Load booking from localStorage or fetch all bookings
        const pendingBookingId = localStorage.getItem('pendingPaymentBookingId');
        console.log('PaymentSuccess: pendingBookingId from localStorage:', pendingBookingId);

        if (!pendingBookingId) {
          console.error('PaymentSuccess: pendingPaymentBookingId not found in localStorage');
          setConfirmationError('Could not identify booking. Please check your bookings.');
          setLoading(false);
          return;
        }

        const bookingId = Number(pendingBookingId);
        if (!bookingId) {
          console.error('PaymentSuccess: Invalid bookingId');
          setLoading(false);
          return;
        }

        // Step 3: Fetch all bookings and find the one we just paid for
        console.log('PaymentSuccess: Fetching bookings for bookingId:', bookingId);
        const bookings = await getMyBookings();
        console.log('PaymentSuccess: Retrieved bookings:', bookings);

        const matchedBooking = bookings.find(function(item) {
          return item.id === bookingId;
        });

        if (isMounted) {
          if (matchedBooking) {
            console.log('PaymentSuccess: Found matching booking:', matchedBooking);
            setBooking(matchedBooking);
            
            // Only clear the pending booking ID if payment is confirmed
            if ((matchedBooking.status || '').toUpperCase() === 'CONFIRMED') {
              console.log('PaymentSuccess: Booking confirmed, clearing pendingPaymentBookingId');
              localStorage.removeItem('pendingPaymentBookingId');
            } else {
              console.log('PaymentSuccess: Booking status is', matchedBooking.status, '(not CONFIRMED yet)');
            }
          } else {
            console.error('PaymentSuccess: Booking not found in bookings list');
            setConfirmationError('Could not load booking details.');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('PaymentSuccess: Error during payment confirmation:', error);
        if (isMounted) {
          const errorMsg = error.response?.data?.message || error.message || 'An error occurred while confirming your payment.';
          setConfirmationError(errorMsg);
          setLoading(false);
        }
      }
    }

    confirmPaymentAndLoadBooking();

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

  const sessionId = searchParams.get('session_id');

  return (
    <div className="payment-result-page">
      <div className="payment-result-card success">
        <h1>Payment Successful</h1>
        <p>Your payment was completed in Stripe.</p>

        {sessionId && (
          <p className="payment-session-text">Stripe Session: {sessionId}</p>
        )}

        {confirmationError && (
          <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px', marginBottom: '10px' }}>
            <strong>Error:</strong> {confirmationError}
          </div>
        )}

        {confirmationSuccess && (
          <div style={{ color: 'green', padding: '10px', border: '1px solid green', borderRadius: '4px', marginBottom: '10px' }}>
            <strong>Success:</strong> Payment confirmed with backend
          </div>
        )}

        {loading ? (
          <p className="payment-status-text">Confirming payment and loading booking status...</p>
        ) : (
          <div className="payment-status-box">
            <div className="payment-status-row">
              <span>Amount Paid</span>
              <strong>{paidAmount != null ? `৳${paidAmount}` : 'N/A'}</strong>
            </div>
            {booking && (
              <>
                <div className="payment-status-row">
                  <span>Booking Status</span>
                  <strong>{formatStatus(booking.status)}</strong>
                </div>
              </>
            )}
          </div>
        )}

        <button className="payment-result-btn" onClick={function() { navigate('/my-bookings'); }}>
          Go to My Bookings
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
