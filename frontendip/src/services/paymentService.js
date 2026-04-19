import api from './api';

function extractApiErrorMessage(error, fallbackMessage) {
  if (error && error.response) {
    const data = error.response.data;

    if (typeof data === 'string' && data.trim()) {
      try {
        const parsed = JSON.parse(data);
        if (parsed && parsed.message) {
          return String(parsed.message);
        }
      } catch (parseError) {
        return data;
      }
      return data;
    }

    if (data && typeof data === 'object') {
      if (data.message && String(data.message).trim()) {
        return String(data.message);
      }
      if (data.error && String(data.error).trim()) {
        return String(data.error);
      }
    }

    const status = error.response.status;
    if (status) {
      return 'Something went wrong on our end. Please try again.';
    }
  }

  if (error && error.message && String(error.message).trim()) {
    if (String(error.message).trim() === 'Network Error') {
      return 'We are having trouble connecting right now. Please try again.';
    }
    return String(error.message);
  }

  return fallbackMessage;
}

export async function createPaymentSession(bookingId) {
  const response = await api.post('/payment/create-bkash-payment', { bookingId });
  return {
    url: response.data && response.data.bkashURL ? response.data.bkashURL : null,
    paymentId: response.data && response.data.paymentID ? response.data.paymentID : null,
    bkashURL: response.data && response.data.bkashURL ? response.data.bkashURL : null,
  };
}

export async function executeBkashPayment(paymentID) {
  try {
    const response = await api.post('/payment/execute-bkash-payment', { paymentID });
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Payment confirmation failed.'));
  }
}

export async function refundBkashTransaction(transactionId) {
  try {
    const response = await api.post(`/payment/refund/${transactionId}`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Refund request failed.'));
  }
}

export async function cancelBkashPayment(paymentID) {
  try {
    const response = await api.post(`/payment/cancel-payment/${encodeURIComponent(paymentID)}`);
    return response.data;
  } catch (error) {
    throw new Error(extractApiErrorMessage(error, 'Payment cancellation could not be completed. Please try again.'));
  }
}
