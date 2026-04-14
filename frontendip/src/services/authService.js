import api from './api';

// Save auth data to localStorage after login/register
function saveAuthData(data) {
  localStorage.setItem('token', data.token);
  localStorage.setItem('userEmail', data.email);
  localStorage.setItem('userName', data.name);
  // Store role in lowercase for backward compatibility with Header/page checks
  localStorage.setItem('userRole', data.role.toLowerCase());
  localStorage.setItem('isLoggedIn', 'true');
  localStorage.setItem('user', JSON.stringify({
    id: data.id,
    name: data.name,
    email: data.email,
    phone: data.phone,
    address: data.address,
    role: data.role,
  }));
  localStorage.setItem('userProfile', JSON.stringify({
    name: data.name,
    email: data.email,
    phone: data.phone || '',
    address: data.address || ''
  }));
}

export async function login(email, password) {
  const response = await api.post('/auth/login', { email, password });
  saveAuthData(response.data);
  return response.data;
}

export async function register(name, email, password, phone, address, role = 'USER') {
  const response = await api.post('/auth/register', { name, email, password, phone, address, role });
  return response.data;
}

export async function verifyOtp(email, otp) {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
}

export async function resendOtp(email) {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
}

export async function forgotPassword(email) {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
}

export async function verifyResetOtp(email, otp) {
  const response = await api.post('/auth/verify-reset-otp', { email, otp });
  return response.data;
}

export async function resetPassword(email, newPassword) {
  const response = await api.post('/auth/reset-password', { email, newPassword });
  return response.data;
}

export async function resendResetOtp(email) {
  const response = await api.post('/auth/resend-reset-otp', { email });
  return response.data;
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('userName');
  localStorage.removeItem('isLoggedIn');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userProfile');
}

export function isLoggedIn() {
  const token = localStorage.getItem('token');
  if (token) {
    return true;
  }
  return false;
}

export function getRole() {
  return localStorage.getItem('userRole') || '';
}

export function isAdmin() {
  return getRole() === 'admin';
}

export function isOwner() {
  const role = getRole();
  return role === 'owner' || role === 'admin';
}
