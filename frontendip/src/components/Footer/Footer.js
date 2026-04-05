import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

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
              <li><Link to="/">Home</Link></li>
              <li><Link to="/turfs">Find Turfs</Link></li>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
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
