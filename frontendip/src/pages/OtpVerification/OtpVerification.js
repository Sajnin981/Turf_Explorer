import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { resendOtp, verifyOtp } from '../../services/authService';
import SharedOtpVerification from '../../components/SharedOtpVerification/SharedOtpVerification';

const OtpVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const locationEmail = location.state && location.state.email ? location.state.email : '';
  const email = locationEmail || sessionStorage.getItem('pendingOtpEmail') || '';

  useEffect(() => {
    if (locationEmail) {
      sessionStorage.setItem('pendingOtpEmail', locationEmail);
    }
  }, [locationEmail]);
  async function handleVerify(emailValue, otpValue) {
    await verifyOtp(emailValue, otpValue);
  }

  async function handleResend(emailValue) {
    await resendOtp(emailValue);
  }

  function handleVerified() {
    sessionStorage.removeItem('pendingOtpEmail');
    navigate('/login');
  }

  return (
    <SharedOtpVerification
      title="Verify Your Email"
      subtitle="Enter the 6-digit code sent to your email"
      email={email}
      verifyHandler={handleVerify}
      resendHandler={handleResend}
      onVerified={handleVerified}
      noEmailMessage="Email not found. Please register again."
      verifySuccessMessage="OTP verified successfully. Please log in to continue."
      resendSuccessMessage="A new OTP has been sent to your email."
    />
  );
};

export default OtpVerification;
