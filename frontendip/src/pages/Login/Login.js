// Login Component
// Purpose: Allows users and admins to login to their accounts
// Features: User/Admin login tabs, email and password authentication

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, logout } from '../../services/authService';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  
  const [loginMode, setLoginMode] = useState('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function getLoginErrorMessage(err) {
    if (err && err.response && err.response.data && err.response.data.message) {
      return err.response.data.message;
    }
    return 'Login failed. Please check your credentials.';
  }

  function getUserTabClass() {
    if (loginMode === 'user') {
      return 'tab-button active';
    }
    return 'tab-button';
  }

  function getAdminTabClass() {
    if (loginMode === 'admin') {
      return 'tab-button active';
    }
    return 'tab-button';
  }

  function getSubmitButtonText() {
    if (loading) {
      return 'Logging in...';
    }
    return 'Login';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data.role.toLowerCase();

      if (loginMode === 'user' && role === 'admin') {
        setError('Please use Admin Login for admin accounts.');
        // Keep app state clean when login happens from the wrong tab.
        logout();
        setLoading(false);
        return;
      }

      if (loginMode === 'admin' && role !== 'admin') {
        setError('Access denied. This account does not have admin privileges.');
        // Keep app state clean when login happens from the wrong tab.
        logout();
        setLoading(false);
        return;
      }

      if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/turfs');
      }
    } catch (err) {
      const msg = getLoginErrorMessage(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleEmailChange(event) { setEmail(event.target.value); }
  function handlePasswordChange(event) { setPassword(event.target.value); }
  function handleSetUserMode() { setLoginMode('user'); setError(''); }
  function handleSetAdminMode() { setLoginMode('admin'); setError(''); }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-content">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back!</h1>
            <p className="auth-subtitle">Login to your account</p>
          </div>

          <div className="login-tabs">
            <button 
              type="button"
              className={getUserTabClass()}
              onClick={handleSetUserMode}
            >
              👤 User Login
            </button>
            <button 
              type="button"
              className={getAdminTabClass()}
              onClick={handleSetAdminMode}
            >
              👨‍💼 Admin Login
            </button>
          </div>

          {error && (
            <div className="error-message" style={{ color: '#e53e3e', background: '#fff5f5', border: '1px solid #fc8181', borderRadius: '6px', padding: '10px 14px', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
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
                placeholder="Enter your password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {getSubmitButtonText()}
            </button>

            <div className="auth-footer" style={{ marginTop: '12px' }}>
              <p><Link to="/forgot-password" className="auth-link">Forgot Password?</Link></p>
            </div>

            <div className="auth-footer">
              <p>Don't have an account? <Link to="/register" className="auth-link">Register here</Link></p>
            </div>
          </form>
        </div>

        <div className="auth-image">
          <div className="image-content">
            <div className="image-icon">⚽</div>
            <h2>Welcome to Turf Explorer</h2>
            <p>Book your favorite sports turf in minutes</p>
            <div className="features-list">
              <div className="feature">✓ Quick & Easy Booking</div>
              <div className="feature">✓ Best Turfs in Town</div>
              <div className="feature">✓ Secure Payments</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
