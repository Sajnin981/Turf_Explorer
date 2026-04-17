import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMyBookings } from '../../services/bookingService';
import { executeBkashPayment } from '../../services/paymentService';
import { useNotification } from '../../context/NotificationContext';
import './PaymentResult.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { showError, showSuccess } = useNotification();
  const [booking, setBooking] = useState(null);
  const [confirmedBookingStatus, setConfirmedBookingStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmationError, setConfirmationError] = useState(null);
  const [confirmationSuccess, setConfirmationSuccess] = useState(false);
  const [paidAmount, setPaidAmount] = useState(null);

  function setErrorState(message) {
    setConfirmationSuccess(false);
    setConfirmationError(message);
  }

  function setSuccessState() {
    setConfirmationError(null);
    setConfirmationSuccess(true);
  }

  useEffect(function() {
    let isMounted = true;

    async function confirmPaymentAndLoadBooking() {
      setLoading(true);
      setConfirmationError(null);
      setConfirmationSuccess(false);
      setConfirmedBookingStatus(null);

      try {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentId = urlParams.get('paymentID');
        const status = urlParams.get('status');
        const pendingBookingId = localStorage.getItem('pendingPaymentBookingId');
        console.log('PaymentSuccess: Received paymentID from URL:', paymentId);

        if (!paymentId) {
          console.error('PaymentSuccess: paymentID is missing from URL');
          setErrorState('Payment ID is missing. Please contact support.');
          showError('Payment ID is missing. Please contact support.');
          setLoading(false);
          return;
        }

        if (status && status.toLowerCase() !== 'success') {
          const query = new URLSearchParams();
          query.set('status', status);
          if (paymentId) {
            query.set('paymentID', paymentId);
          }
          if (pendingBookingId) {
            query.set('bookingId', pendingBookingId);
          }
          navigate('/payment-failed?' + query.toString(), { replace: true });
          return;
        }

        const executionKey = `payment-execute-${paymentId}`;
        const executionState = sessionStorage.getItem(executionKey);

        // Step 1: Execute payment in backend
        let response = null;
        if (executionState === 'success') {
          console.log('PaymentSuccess: execute already completed for paymentID:', paymentId);
          setSuccessState();
        } else if (executionState === 'running') {
          console.log('PaymentSuccess: execute already running for paymentID:', paymentId);
          setSuccessState();
        } else {
          console.log('PaymentSuccess: Calling backend to execute payment for paymentID:', paymentId);
          sessionStorage.setItem(executionKey, 'running');
          response = await executeBkashPayment(paymentId);
          console.log('PaymentSuccess: Backend confirmation payload:', response);
          if ((response.status || '').toUpperCase() !== 'SUCCESS') {
            const message = response.message || 'Payment confirmation failed';
            sessionStorage.removeItem(executionKey);
            setErrorState(message);
            showError(message);
            setLoading(false);
            return;
          }
          setPaidAmount(response && response.amount != null ? Number(response.amount) : null);
          if (response && response.bookingStatus) {
            setConfirmedBookingStatus(String(response.bookingStatus).toUpperCase());
          }
          console.log('PaymentSuccess: Backend confirmation successful');
          sessionStorage.setItem(executionKey, 'success');
          setSuccessState();
          showSuccess('Payment successful and confirmed.');
        }

        // Step 2: Load booking from localStorage or fetch all bookings
        console.log('PaymentSuccess: pendingBookingId from localStorage:', pendingBookingId);

        if (!pendingBookingId) {
          console.error('PaymentSuccess: pendingPaymentBookingId not found in localStorage');
          // Payment confirmation already succeeded; booking lookup is optional context.
          localStorage.removeItem('pendingPaymentBookingId');
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
        }) || bookings.find(function(item) {
          return item.paymentId === paymentId;
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
            // Do not show payment error here; payment was already confirmed.
            showSuccess('Payment confirmed. Booking details will update shortly.');
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('PaymentSuccess: Error during payment confirmation:', error);
        if (isMounted) {
          const paymentId = new URLSearchParams(window.location.search).get('paymentID');
          if (paymentId) {
            sessionStorage.removeItem(`payment-execute-${paymentId}`);
          }
          const errorMsg = error.response?.data?.message || error.message || 'An error occurred while confirming your payment.';
          setErrorState(errorMsg);
          showError(errorMsg);
          setLoading(false);
        }
      }
    }

    confirmPaymentAndLoadBooking();

    return function() {
      isMounted = false;
    };
  }, [searchParams, showError, showSuccess, navigate]);

  function formatStatus(value) {
    if (!value) {
      return 'Pending';
    }
    return value.charAt(0) + value.slice(1).toLowerCase();
  }

  const paymentId = searchParams.get('paymentID');

  return (
    <div className="payment-result-page">
      <div className="payment-result-card success">
        <h1>Payment Successful</h1>
        <p>Your payment was completed in bKash.</p>

        {paymentId && (
          <p className="payment-session-text">bKash Payment ID: {paymentId}</p>
        )}

        {confirmationError && (
          <div style={{ color: 'red', padding: '10px', border: '1px solid red', borderRadius: '4px', marginBottom: '10px' }}>
            <strong>Error:</strong> {confirmationError}
          </div>
        )}

        {confirmationSuccess && !confirmationError && (
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
                  <strong>{formatStatus(confirmedBookingStatus || booking.status)}</strong>
                </div>
              </>
            )}

            {!booking && confirmedBookingStatus && (
              <div className="payment-status-row">
                <span>Booking Status</span>
                <strong>{formatStatus(confirmedBookingStatus)}</strong>
              </div>
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
