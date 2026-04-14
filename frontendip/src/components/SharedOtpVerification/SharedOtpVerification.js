import React, { useMemo, useRef, useState } from 'react';
import './SharedOtpVerification.css';

const OTP_LENGTH = 6;

const SharedOtpVerification = ({
  title,
  subtitle,
  email,
  verifyHandler,
  resendHandler,
  onVerified,
  noEmailMessage,
  verifySuccessMessage,
  resendSuccessMessage,
}) => {
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const inputRefs = useRef([]);
  const otp = useMemo(() => otpDigits.join(''), [otpDigits]);
  const isOtpComplete = otp.length === OTP_LENGTH;

  const maskedEmail = useMemo(() => {
    if (!email || !email.includes('@')) {
      return 'your email';
    }

    const atIndex = email.indexOf('@');
    const prefix = email.slice(0, atIndex);
    const domain = email.slice(atIndex);

    if (prefix.length <= 4) {
      return `${prefix}${'*'.repeat(Math.max(1, 4 - prefix.length))}${domain}`;
    }

    return `${prefix.slice(0, 3)}${'*'.repeat(Math.max(4, prefix.length - 3))}${domain}`;
  }, [email]);

  function startCountdown(seconds) {
    setResendCountdown(seconds);
    const timer = window.setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function handleDigitChange(index, event) {
    const value = event.target.value.replace(/[^0-9]/g, '');

    if (!value) {
      const nextDigits = [...otpDigits];
      nextDigits[index] = '';
      setOtpDigits(nextDigits);
      return;
    }

    const nextDigits = [...otpDigits];
    for (let i = 0; i < value.length && index + i < OTP_LENGTH; i += 1) {
      nextDigits[index + i] = value[i];
    }
    setOtpDigits(nextDigits);

    const nextFocusIndex = Math.min(index + value.length, OTP_LENGTH - 1);
    if (inputRefs.current[nextFocusIndex]) {
      inputRefs.current[nextFocusIndex].focus();
    }
  }

  function handleDigitKeyDown(index, event) {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    }

    if (event.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      event.preventDefault();
      inputRefs.current[index - 1].focus();
    }

    if (event.key === 'ArrowRight' && index < OTP_LENGTH - 1 && inputRefs.current[index + 1]) {
      event.preventDefault();
      inputRefs.current[index + 1].focus();
    }
  }

  function handleOtpPaste(event) {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    if (!pasted) {
      return;
    }

    const nextDigits = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < pasted.length; i += 1) {
      nextDigits[i] = pasted[i];
    }
    setOtpDigits(nextDigits);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    if (inputRefs.current[focusIndex]) {
      inputRefs.current[focusIndex].focus();
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError(noEmailMessage || 'Email not found. Please try again.');
      return;
    }

    if (!isOtpComplete) {
      setError('Please enter a valid 6-digit OTP.');
      return;
    }

    setLoading(true);
    try {
      await verifyHandler(email, otp);
      if (verifySuccessMessage) {
        setSuccessMessage(verifySuccessMessage);
      }
      if (onVerified) {
        onVerified(email);
      }
    } catch (err) {
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResendOtp() {
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError(noEmailMessage || 'Email not found. Please try again.');
      return;
    }

    setResendLoading(true);
    try {
      await resendHandler(email);
      setSuccessMessage(resendSuccessMessage || 'A new OTP has been sent to your email.');
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      startCountdown(30);
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    } catch (err) {
      if (err && err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to resend OTP. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="shared-otp-page">
      <div className="shared-otp-card">
        <div className="shared-otp-header">
          <h1 className="shared-otp-title">{title}</h1>
          <p className="shared-otp-subtitle">{subtitle}</p>
          <p className="shared-otp-email">{maskedEmail}</p>
        </div>

        {error && <div className="shared-otp-alert shared-otp-error">{error}</div>}
        {successMessage && <div className="shared-otp-alert shared-otp-success">{successMessage}</div>}

        <form onSubmit={handleVerify}>
          <div className="shared-otp-input-group" onPaste={handleOtpPaste}>
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                className="shared-otp-digit-input"
                value={digit}
                maxLength="1"
                onChange={(event) => handleDigitChange(index, event)}
                onKeyDown={(event) => handleDigitKeyDown(index, event)}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                aria-label={`OTP digit ${index + 1}`}
              />
            ))}
          </div>

          <button type="submit" className="btn btn-primary auth-btn shared-otp-primary" disabled={loading || !isOtpComplete}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          <button
            type="button"
            className="btn auth-btn shared-otp-secondary"
            disabled={resendLoading || resendCountdown > 0}
            onClick={handleResendOtp}
          >
            {resendLoading ? 'Sending...' : resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SharedOtpVerification;
