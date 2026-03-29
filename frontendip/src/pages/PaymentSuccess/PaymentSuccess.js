import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyPaymentSuccess } from '../../services/bookingService';
import './PaymentResult.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const bookingId = params.get('booking_id');
  const transactionId = params.get('tran_id');
  const valId = params.get('val_id');
  const [loading, setLoading] = useState(Boolean(transactionId));
  const [message, setMessage] = useState('Verifying payment...');

  function getStatusText() {
    if (loading) {
      return 'Verifying your transaction...';
    }
    return message;
  }

  useEffect(function () {
    async function verify() {
      if (!transactionId) {
        setLoading(false);
        setMessage('Payment page loaded, but transaction id is missing.');
        return;
      }

      try {
        const response = await verifyPaymentSuccess(transactionId, valId);
        const hasResponse = response !== undefined && response !== null;
        const hasDueAmount = hasResponse && response.dueAmount !== undefined && response.dueAmount !== null;
        let dueAmountNumber = 0;
        if (hasDueAmount) {
          dueAmountNumber = Number(response.dueAmount);
        }

        if (hasDueAmount && dueAmountNumber > 0) {
          setMessage(`Booking confirmed. Remaining amount: ${Number(response.dueAmount).toFixed(2)} BDT`);
        } else {
          if (hasResponse && response.message) {
            setMessage(response.message);
          } else {
            setMessage('Payment successful and booking confirmed.');
          }
        }
      } catch (error) {
        let errorMessage = 'Could not verify payment status automatically. Please check My Bookings.';
        if (error && error.response && error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        setMessage(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [transactionId, valId]);

  return (
    <div className="payment-result-page">
      <div className="payment-result-card success">
        <h2>Payment Successful</h2>
        <p>{getStatusText()}</p>
        {bookingId && <p><strong>Booking ID:</strong> {bookingId}</p>}
        {transactionId && <p><strong>Transaction ID:</strong> {transactionId}</p>}

        <div className="payment-result-actions">
          <button className="btn btn-primary" onClick={function () { navigate('/my-bookings'); }}>
            Go to My Bookings
          </button>
          <button className="btn btn-view" onClick={function () { navigate('/turfs'); }}>
            Continue Browsing
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
