// Header Component
// Purpose: Navigation bar displayed on all pages
// Features: Logo, navigation links, login/logout, mobile menu

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { useNotification } from '../../context/NotificationContext';
import ChatBot from '../ChatBot/ChatBot';
import './Header.css';

const Header = () => {
  // State variables
  const [isMenuOpen, setIsMenuOpen] = useState(false);  // Mobile menu open/closed
  const [isLoggedIn, setIsLoggedIn] = useState(false);  // User logged in status
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');  // User's email
  const [userRole, setUserRole] = useState('');  // User's role
  const [chatOpen, setChatOpen] = useState(false); // Chatbot state
  const location = useLocation();
  const navigate = useNavigate();
  const { showSuccess } = useNotification();

  // Check login status when page loads or location changes
  useEffect(function() {
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const loggedIn = localStorage.getItem('isLoggedIn');
    const role = localStorage.getItem('userRole') || '';
    if (email && loggedIn === 'true') {
      setIsLoggedIn(true);
      setUserName(name || '');
      setUserEmail(email);
      setUserRole(role);
    } else {
      setIsLoggedIn(false);
      setUserName('');
      setUserEmail('');
      setUserRole('');
    }
  }, [location]);

  const displayName = userName || userEmail;

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
    setUserName('');
    setUserEmail('');
    setUserRole('');
    showSuccess('You have been logged out successfully.');
    navigate('/');
  }

  // Toggle mobile menu open/closed
  function toggleMenu() {
    setIsMenuOpen(!isMenuOpen);
  }

  // Function to close mobile menu
  function closeMenu() {
    setIsMenuOpen(false);
  }

  function getNavLinkClassName(navLinkState) {
    return navLinkState.isActive ? 'nav-link active' : 'nav-link';
  }

  function getTurfsNavLinkClassName(navLinkState) {
    const isTurfDetailsPage = location.pathname.startsWith('/turf/');
    return navLinkState.isActive || isTurfDetailsPage ? 'nav-link active' : 'nav-link';
  }

  function getProfileNavLinkClassName(navLinkState) {
    return navLinkState.isActive ? 'nav-link profile-link active' : 'nav-link profile-link';
  }

  function getAdminNavLinkClassName(navLinkState) {
    return navLinkState.isActive ? 'nav-link admin-link active' : 'nav-link admin-link';
  }

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            <span className="logo-icon">⚽</span>
            <span className="logo-text">Turf Explorer</span>
          </a>

          <nav className={`nav ${isMenuOpen ? 'nav-open' : ''}`}>
            <NavLink to="/" end className={getNavLinkClassName} onClick={closeMenu}>
              Home
            </NavLink>
            <NavLink to="/turfs" className={getTurfsNavLinkClassName} onClick={closeMenu}>
              Find Turfs
            </NavLink>
            
            {isLoggedIn && isOwner() && (
              <>
                <NavLink to="/add-turf" className={getNavLinkClassName} onClick={closeMenu}>
                  Add Turf
                </NavLink>
                <NavLink to="/my-turfs" className={getNavLinkClassName} onClick={closeMenu}>
                  My Turfs
                </NavLink>
                <NavLink to="/profile" className={getProfileNavLinkClassName} onClick={closeMenu}>
                  👤 {displayName}
                </NavLink>
              </>
            )}

            {isLoggedIn && !isAdmin() && !isOwner() && (
              <>
                <NavLink to="/my-bookings" className={getNavLinkClassName} onClick={closeMenu}>
                  Bookings
                </NavLink>
                <NavLink to="/profile" className={getProfileNavLinkClassName} onClick={closeMenu}>
                  👤 {displayName}
                </NavLink>
              </>
            )}
            
            {isAdmin() && (
              <NavLink to="/admin" className={getAdminNavLinkClassName} onClick={closeMenu}>
                Admin Dashboard
              </NavLink>
            )}
            
            <button
              type="button"
              className="btn btn-primary nav-btn"
              onClick={(e) => { e.preventDefault(); setChatOpen(!chatOpen); closeMenu(); }}
            >
              🤖
            </button>

            {isLoggedIn ? (
              <button onClick={handleLogout} className="btn nav-btn nav-btn-danger">
                Logout
              </button>
            ) : (
              <>
                <NavLink to="/login" className={getNavLinkClassName} onClick={closeMenu}>
                  Login
                </NavLink>
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
      </header>
      {chatOpen && <ChatBot onClose={() => setChatOpen(false)} />}
    </>
  );
};

export default Header;
