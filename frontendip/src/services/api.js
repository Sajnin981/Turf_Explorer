import axios from 'axios';

let lastNetworkErrorToastAt = 0;
const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 responses globally (token expired/invalid)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const hasResponse = error && error.response;
    const isUnauthorized = hasResponse && error.response.status === 401;
    const isNetworkError = !hasResponse && (
      (error && error.code === 'ERR_NETWORK')
      || (error && error.message === 'Network Error')
      || (typeof navigator !== 'undefined' && navigator.onLine === false)
    );

    if (isNetworkError) {
      const now = Date.now();
      const throttleMs = 4000;
      if (now - lastNetworkErrorToastAt > throttleMs) {
        lastNetworkErrorToastAt = now;
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('app:network-error', {
            detail: {
              message: 'We are having trouble connecting right now. Please try again.'
            }
          }));
        }
      }
    }

    if (isUnauthorized) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
