import api from './api';

// Normalize backend turf object to match frontend field names
function normalizeTurf(t) {
  const normalizedTurf = {
    id: t.id,
    name: t.name,
    location: t.location,
    turfType: t.turfType,
    type: t.turfType,
    pricePerHour: t.pricePerHour,
    price: t.pricePerHour,
    description: t.description,
    imageUrl: t.imageUrl,
    image: null,
    ownerId: t.ownerId,
    status: t.status,
    createdAt: t.createdAt,
    latitude: t.latitude,
    longitude: t.longitude,
    available: false,
    distanceKm: null,
  };

  if (t.imageUrl) {
    normalizedTurf.image = t.imageUrl;
  }

  if (typeof t.available === 'boolean') {
    normalizedTurf.available = t.available;
  } else if (t.status === 'APPROVED') {
    normalizedTurf.available = true;
  }

  if (typeof t.distanceKm === 'number') {
    normalizedTurf.distanceKm = t.distanceKm;
  }

  return normalizedTurf;
}

export async function getAllTurfs(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.search) {
    searchParams.append('search', params.search);
  }
  if (params.lat !== undefined && params.lat !== null) {
    searchParams.append('lat', params.lat);
  }
  if (params.lng !== undefined && params.lng !== null) {
    searchParams.append('lng', params.lng);
  }
  if (params.availableOnly === true) {
    searchParams.append('availableOnly', 'true');
  }

  const query = searchParams.toString();
  let endpoint = '/turfs';
  if (query) {
    endpoint = '/turfs?' + query;
  }

  const response = await api.get(endpoint);
  const normalizedTurfs = [];
  for (const turf of response.data) {
    normalizedTurfs.push(normalizeTurf(turf));
  }

  return normalizedTurfs;
}

export async function getTurfSearchSuggestions(query) {
  const response = await api.get('/turfs/search-suggestions', {
    params: { query },
  });
  return response.data;
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
  const normalizedTurfs = [];
  for (const turf of response.data) {
    normalizedTurfs.push(normalizeTurf(turf));
  }

  return normalizedTurfs;
}

export async function updateTurfAvailability(turfId, available) {
  const response = await api.put(`/owner/turfs/${turfId}/availability`, {
    available,
  });
  return normalizeTurf(response.data);
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
