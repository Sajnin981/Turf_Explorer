import api from './api';

export async function createBooking(turfId, slotId, bookingDate) {
  const response = await api.post('/bookings', { turfId, slotId, bookingDate });
  return response.data;
}

export async function getMyBookings() {
  const response = await api.get('/bookings/my-bookings');
  if (!Array.isArray(response.data)) {
    return [];
  }

  return response.data.map(function(booking) {
    const transactionId = booking.transaction && booking.transaction.id
      ? booking.transaction.id
      : booking.transactionId;

    const transactionStatus = booking.transaction && booking.transaction.status
      ? booking.transaction.status
      : booking.transactionStatus;

    return {
      ...booking,
      transactionId: transactionId || null,
      transactionStatus: transactionStatus || '',
      transaction: {
        id: transactionId || null,
        status: transactionStatus || ''
      }
    };
  });
}

export async function cancelBooking(bookingId) {
  const response = await api.delete(`/bookings/${bookingId}`);
  return response.data;
}

export async function confirmBooking(bookingId) {
  const response = await api.put(`/bookings/${bookingId}/confirm`);
  return response.data;
}
