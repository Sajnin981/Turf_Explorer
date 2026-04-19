import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const location = useLocation();

  const isAuthenticated = localStorage.getItem('isLoggedIn') === 'true' && Boolean(localStorage.getItem('token'));
  const userRole = String(localStorage.getItem('userRole') || '').toLowerCase();

  function getQuickLinks() {
    const commonLinks = [
      { to: '/', label: 'Home' },
      { to: '/turfs', label: 'Find Turfs' }
    ];

    if (!isAuthenticated) {
      return [
        ...commonLinks,
        { to: '/login', label: 'Login' },
        { to: '/register', label: 'Register' }
      ];
    }

    if (userRole === 'admin') {
      return [
        ...commonLinks,
        { to: '/admin', label: 'Admin Dashboard' }
      ];
    }

    if (userRole === 'owner') {
      return [
        ...commonLinks,
        { to: '/my-turfs', label: 'My Turfs' },
        { to: '/add-turf', label: 'Add Turf' },
        { to: '/profile', label: 'My Profile' }
      ];
    }

    return [
      ...commonLinks,
      { to: '/my-bookings', label: 'My Bookings' },
      { to: '/profile', label: 'My Profile' }
    ];
  }

  const quickLinks = getQuickLinks();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <div className="footer-logo">
              <span className="logo-icon">⚽</span>
              <span className="logo-text">Turf Explorer</span>
            </div>
            <p className="footer-description">
              Your trusted platform for finding and booking the best sports turfs in your area.
            </p>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Quick Links</h3>
            <ul className="footer-links">
              {quickLinks.map(function(link) {
                const isActive = location.pathname === link.to;
                return (
                  <li key={link.to + link.label}>
                    <Link to={link.to} className={isActive ? 'footer-link-active' : ''}>{link.label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">Contact Us</h3>
            <ul className="footer-contact">
              <li>📧 info@turfexplorer.com</li>
              <li>📞 +880 1845634664</li>
              <li>📍 Chittagong, Bangladesh</li>
            </ul>
          </div>

        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Turf Explorer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
