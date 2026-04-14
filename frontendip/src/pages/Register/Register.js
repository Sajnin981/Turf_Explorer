// Register Component
// Purpose: Allows new users to create an account
// Features: User registration form with validation

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/authService';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('USER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getRegisterErrorMessage(err) {
    if (err && err.response && err.response.data && err.response.data.message) {
      return err.response.data.message;
    }
    return 'Registration failed. Please try again.';
  }

  function getSubmitButtonText() {
    if (loading) {
      return 'Creating Account...';
    }
    return 'Create Account';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    
    if (password !== confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password, phone, address, role);
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      const msg = getRegisterErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(event) { setName(event.target.value); }
  function handleEmailChange(event) { setEmail(event.target.value); }
  function handlePasswordChange(event) { setPassword(event.target.value); }
  function handleConfirmPasswordChange(event) { setConfirmPassword(event.target.value); }
  function handlePhoneChange(event) { setPhone(event.target.value); }
  function handleAddressChange(event) { setAddress(event.target.value); }
  function handleRoleChange(event) { setRole(event.target.value); }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Sign up to start booking turfs</p>
          </div>

          {error && (
            <div className="error-message" style={{ color: '#e53e3e', background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Create a password (min 6 characters)"
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm your password"
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={handleAddressChange}
                placeholder="Enter your address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="role">Account Type</label>
              <select id="role" value={role} onChange={handleRoleChange} className="form-select" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
                <option value="USER">User (Book Turfs)</option>
                <option value="OWNER">Turf Owner (List & Manage Turfs)</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {getSubmitButtonText()}
            </button>
          </form>

          <div className="auth-footer">
            <p>Already have an account? <Link to="/login" className="auth-link">Login</Link></p>
          </div>
        </div>

        <div className="auth-image">
          <div className="image-content">
            <div className="image-icon">🏟️</div>
            <h2>Join Turf Explorer</h2>
            <p>Start your journey to finding the perfect turf</p>
            <div className="features-list">
              <div className="feature">✓ Smart recommendations</div>
              <div className="feature">✓ Easy booking system</div>
              <div className="feature">✓ Best turfs near you</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

