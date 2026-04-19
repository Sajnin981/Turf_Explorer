import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn, getRole } from '../../services/authService';

function OwnerRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  const role = String(getRole() || '').toLowerCase();
  if (role === 'owner') {
    return children;
  }

  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <Navigate to="/turfs" replace />;
}

export default OwnerRoute;
