import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import TurfListing from './pages/TurfListing/TurfListing';
import TurfDetails from './pages/TurfDetails/TurfDetails';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import OtpVerification from './pages/OtpVerification/OtpVerification';
import ForgotPassword from './pages/ForgotPassword/ForgotPassword';
import VerifyResetOtp from './pages/VerifyResetOtp/VerifyResetOtp';
import ResetPassword from './pages/ResetPassword/ResetPassword';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AddTurf from './pages/AddTurf/AddTurf';
import MyTurfs from './pages/MyTurfs/MyTurfs';
import Profile from './pages/Profile/Profile';
import MyBookings from './pages/MyBookings/MyBookings';
import PaymentSuccess from './pages/PaymentSuccess/PaymentSuccess';
import PaymentFailed from './pages/PaymentFailed/PaymentFailed';
import NotFound from './pages/NotFound/NotFound';
import OwnerRoute from './components/OwnerRoute/OwnerRoute';
import { isLoggedIn, isAdmin, isOwner } from './services/authService';
import './App.css';

function ScrollToTopOnRouteChange() {
  const location = useLocation();

  React.useEffect(function() {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return null;
}

// Redirects to /login if not authenticated
function PrivateRoute({ children }) {
  if (isLoggedIn()) {
    return children;
  }
  return <Navigate to="/login" replace />;
}

// Redirects to /login if not admin
function AdminRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin()) {
    return children;
  }

  if (isOwner()) {
    return <Navigate to="/my-turfs" replace />;
  }

  return <Navigate to="/turfs" replace />;
}

// Redirects admins/owners away from user-only booking page
function UserBookingRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin() && !isOwner()) {
    return children;
  }

  if (isAdmin()) {
    return <Navigate to="/admin" replace />;
  }

  if (isOwner()) {
    return <Navigate to="/my-turfs" replace />;
  }

  return <Navigate to="/turfs" replace />;
}

function App() {
  return (
    <div className="App">
      <ScrollToTopOnRouteChange />
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/turfs" element={<TurfListing />} />
          <Route path="/turf/:id" element={<TurfDetails />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<OtpVerification />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-reset-otp" element={<VerifyResetOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/add-turf" element={<OwnerRoute><AddTurf /></OwnerRoute>} />
          <Route path="/my-turfs" element={<OwnerRoute><MyTurfs /></OwnerRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/my-bookings" element={<UserBookingRoute><MyBookings /></UserBookingRoute>} />
          <Route path="/payment-success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
          <Route path="/success" element={<PrivateRoute><PaymentSuccess /></PrivateRoute>} />
          <Route path="/payment-failed" element={<PrivateRoute><PaymentFailed /></PrivateRoute>} />
          <Route path="/payment-cancel" element={<PrivateRoute><PaymentFailed /></PrivateRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
