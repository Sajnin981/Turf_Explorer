import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import './ResetPassword.css';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const locationEmail = location.state && location.state.email ? location.state.email : '';
  const email = locationEmail || sessionStorage.getItem('resetPasswordEmail') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isFormInvalid = !newPassword || !confirmPassword || newPassword !== confirmPassword;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Email not found. Please restart password reset.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword(email, newPassword);
      setMessage(response.message || 'Password reset successfully.');
      sessionStorage.removeItem('resetPasswordEmail');
      setTimeout(function() {
        navigate('/login');
      }, 1200);
    } catch (err) {
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Unable to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-card">
        <div className="reset-password-header">
          <h1 className="reset-password-title">Reset Your Password</h1>
          <p className="reset-password-subtitle">Enter a new password for your account</p>
        </div>

        {error && <div className="otp-alert otp-error">{error}</div>}
        {message && <div className="otp-alert otp-success">{message}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group reset-password-field-group">
            <label htmlFor="newPassword">New Password</label>
            <div className="password-input-wrap">
              <input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength="6"
                required
                className="reset-password-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={function() { setShowNewPassword(!showNewPassword); }}
              >
                {showNewPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="form-group reset-password-field-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-input-wrap">
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength="6"
                required
                className="reset-password-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                onClick={function() { setShowConfirmPassword(!showConfirmPassword); }}
              >
                {showConfirmPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {newPassword && confirmPassword && newPassword !== confirmPassword && (
            <div className="reset-password-inline-error">Passwords do not match.</div>
          )}

          <button type="submit" className="btn btn-primary auth-btn reset-password-btn" disabled={loading || isFormInvalid}>
            {loading ? 'Updating Password' : 'Reset Password'}
          </button>
        </form>

        <div className="auth-footer reset-password-footer">
          <p><Link to="/login" className="auth-link">Back To Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
