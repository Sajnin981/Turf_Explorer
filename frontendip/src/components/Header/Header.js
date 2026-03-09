// Header Component
// Purpose: Navigation bar displayed on all pages
// Features: Logo, navigation links, login/logout, mobile menu

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import './Header.css';

const Header = () => {
  // State variables
  const [isMenuOpen, setIsMenuOpen] = useState(false);  // Mobile menu open/closed
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // User logged in status
  const [userEmail, setUserEmail] = useState('');  // User's email
  const [userRole, setUserRole] = useState('');  // User's role
  const location = useLocation();
  const navigate = useNavigate();

  // Check login status when page loads or location changes
  useEffect(function() {
    const email = localStorage.getItem('userEmail');
    const loggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole') || '';
    if (email && loggedIn === 'true') {
      setIsLoggedIn(true);
      setUserEmail(email);
      setUserRole(role);
    } else {
      setIsLoggedIn(false);
      setUserEmail('');
      setUserRole('');
    }
  }, [location]);

  function isAdmin() {
    return userRole === 'admin';
  }

  function isOwner() {
    return userRole === 'owner';
  }

  // Function to handle user logout
  function handleLogout() {
    logout();
    setIsLoggedIn(false);
    setUserEmail('');
    setUserRole('');
    alert('Logged out successfully! 👋');
    navigate('/');
  }

  // Toggle mobile menu open/closed
  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  // Check if a path is the current active page
  function isActive(path) {
    return location.pathname === path ? 'active' : '';
  }

  // Function to close mobile menu
  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            <span className="logo-icon">⚽</span>
            <span className="logo-text">Turf Explorer</span>
          </Link>

          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <Link to="/" className={`nav-link ${isActive('/')}`} onClick={closeMenu}>
              Home
            </Link>
            <Link to="/turfs" className={`nav-link ${isActive('/turfs')}`} onClick={closeMenu}>
              Find Turfs
            </Link>
            
            {isLoggedIn && isOwner() && (
              <>
                <Link to="/add-turf" className={`nav-link ${isActive('/add-turf')}`} onClick={closeMenu}>
                  Add Turf
                </Link>
                <Link to="/my-turfs" className={`nav-link ${isActive('/my-turfs')}`} onClick={closeMenu}>
                  My Turfs
                </Link>
                <Link to="/profile" className={`nav-link profile-link ${isActive('/profile')}`} onClick={closeMenu}>
                  👤 {userEmail.split('@')[0]}
                </Link>
              </>
            )}

            {isLoggedIn && !isAdmin() && !isOwner() && (
              <>
                <Link to="/my-bookings" className={`nav-link ${isActive('/my-bookings')}`} onClick={closeMenu}>
                  Bookings
                </Link>
                <Link to="/profile" className={`nav-link profile-link ${isActive('/profile')}`} onClick={closeMenu}>
                  👤 {userEmail.split('@')[0]}
                </Link>
              </>
            )}
            
            {isAdmin() && (
              <Link to="/admin" className={`nav-link admin-link ${isActive('/admin')}`} onClick={closeMenu}>
                Admin Dashboard
              </Link>
            )}
            
            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn btn-primary nav-btn">
                Logout
              </button>
            ) : (
              <>
                <Link to="/login" className={`nav-link ${isActive('/login')}`} onClick={closeMenu}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary nav-btn" onClick={closeMenu}>
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
