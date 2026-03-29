import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyPaymentCancel } from '../../services/bookingService';
import '../PaymentSuccess/PaymentResult.css';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get('tran_id');

  useEffect(function () {
    async function verifyCancelOnServer() {
      if (!transactionId) {
        return;
      }

      try {
        await verifyPaymentCancel(transactionId);
      } catch (error) {
        // Ignore UI-side fallback failures; backend callback may have already processed it.
      }
    }

    verifyCancelOnServer();
  }, [transactionId]);

  return (
    <div className="payment-result-page">
      <div className="payment-result-card cancelled">
        <h2>Payment Cancelled</h2>
        <p>You cancelled the payment. No booking was confirmed.</p>
        {transactionId && <p><strong>Transaction ID:</strong> {transactionId}</p>}

        <div className="payment-result-actions">
          <button className="btn btn-primary" onClick={function () { navigate('/turfs'); }}>
            Back to Turfs
          </button>
          <button className="btn btn-view" onClick={function () { navigate('/my-bookings'); }}>
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
