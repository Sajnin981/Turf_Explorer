import api from './api';

// Normalize backend turf object to match frontend field names
function normalizeTurf(t) {
  return {
    ...t,
    type: t.turfType,
    image: t.imageUrl || null,
    available: t.status === 'APPROVED',
    price: t.pricePerHour,
  };
}

export async function getAllTurfs() {
  const response = await api.get('/turfs');
  return response.data.map(normalizeTurf);
}

export async function getTurfById(id) {
  const response = await api.get(`/turfs/${id}`);
  return normalizeTurf(response.data);
}

export async function getTurfSlots(turfId) {
  const response = await api.get(`/turfs/${turfId}/slots`);
  return response.data;
}

// Owner: submit a new turf
export async function submitTurf(turfData) {
  const response = await api.post('/owner/turfs', turfData);
  return response.data;
}

// Owner: get my turfs
export async function getMyTurfs() {
  const response = await api.get('/owner/my-turfs');
  return response.data.map(normalizeTurf);
}

// Owner: delete a turf
export async function deleteTurf(turfId) {
  const response = await api.delete(`/owner/turfs/${turfId}`);
  return response.data;
}

// Owner: get bookings for a turf
export async function getTurfBookings(turfId) {
  const response = await api.get(`/owner/turfs/${turfId}/bookings`);
  return response.data;
}
