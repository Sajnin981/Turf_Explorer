import api from './api';

export async function createPaymentSession(bookingId) {
  const response = await api.post('/payment/create-checkout-session', { bookingId });
  return {
    url: response.data && response.data.url ? response.data.url : response.data && response.data.checkoutUrl,
    sessionId: response.data && response.data.sessionId ? response.data.sessionId : null,
  };
}
