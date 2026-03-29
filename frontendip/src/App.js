import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import Home from './pages/Home/Home';
import TurfListing from './pages/TurfListing/TurfListing';
import TurfDetails from './pages/TurfDetails/TurfDetails';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AddTurf from './pages/AddTurf/AddTurf';
import MyTurfs from './pages/MyTurfs/MyTurfs';
import Profile from './pages/Profile/Profile';
import MyBookings from './pages/MyBookings/MyBookings';
import PaymentSuccess from './pages/PaymentSuccess/PaymentSuccess';
import PaymentFail from './pages/PaymentFail/PaymentFail';
import PaymentCancel from './pages/PaymentCancel/PaymentCancel';
import { isLoggedIn, isAdmin, isOwner } from './services/authService';
import './App.css';

// Redirects to /login if not authenticated
function PrivateRoute({ children }) {
  if (isLoggedIn()) {
    return children;
  }
  return <Navigate to="/login" replace />;
}

// Redirects to /login if not admin
function AdminRoute({ children }) {
  if (isAdmin()) {
    return children;
  }
  return <Navigate to="/login" replace />;
}

// Redirects admins/owners away from user-only booking page
function UserBookingRoute({ children }) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin() && !isOwner()) {
    return children;
  }

  return <Navigate to="/turfs" replace />;
}

function App() {
  return (
    
      <div className="App">
        <Header />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/turfs" element={<TurfListing />} />
            <Route path="/turf/:id" element={<TurfDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/add-turf" element={<PrivateRoute><AddTurf /></PrivateRoute>} />
            <Route path="/my-turfs" element={<PrivateRoute><MyTurfs /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/my-bookings" element={<UserBookingRoute><MyBookings /></UserBookingRoute>} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route path="/payment/fail" element={<PaymentFail />} />
            <Route path="/payment/cancel" element={<PaymentCancel />} />
          </Routes>
  
        </main>
        <Footer />
      </div>

    
  );
}

export default App;
